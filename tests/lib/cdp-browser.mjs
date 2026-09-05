import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { browserEnvironment } from './browser-environment.mjs';

export async function startBrowser(onEvent = () => {}, { fetch: fetchImpl = globalThis.fetch } = {}) {
  const executable = ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium'].find(existsSync);
  if (!executable) throw new Error('Chrome or Chromium is required for the browser smoke test');
  const profile = mkdtempSync('/tmp/bolens-site-smoke-');
  const process = spawn(executable, ['--headless=new', '--disable-gpu', '--disable-dev-shm-usage', '--no-sandbox', '--no-first-run', '--disable-background-networking', '--disable-component-update', '--no-default-browser-check', '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { detached: true, stdio: ['ignore', 'ignore', 'pipe'] });
  let log = '';
  let socket;
  let closed = false;
  const pending = new Map();
  process.stderr.on('data', (chunk) => { log = (log + chunk.toString()).slice(-8000); });
  let spawnError;
  process.on('error', (error) => { spawnError = error; });

  let closing;
  const stop = (reason = new Error('browser connection closed'), closeSocket = true) => {
    if (closing) return closing;
    closed = true;
    if (closeSocket) socket?.close();
    for (const request of pending.values()) {
      clearTimeout(request.timeout);
      request.reject(reason);
    }
    pending.clear();
    closing = (async () => {
      const groupExists = () => {
        try {
          globalThis.process.kill(-process.pid, 0);
          return true;
        } catch {
          return false;
        }
      };
      if (groupExists()) {
        globalThis.process.kill(-process.pid, 'SIGTERM');
        const gracefulDeadline = performance.now() + 2_000;
        while (groupExists() && performance.now() < gracefulDeadline) {
          await new Promise((done) => setTimeout(done, 25));
        }
        if (groupExists()) globalThis.process.kill(-process.pid, 'SIGKILL');
        const forcedDeadline = performance.now() + 2_000;
        while (groupExists() && performance.now() < forcedDeadline) {
          await new Promise((done) => setTimeout(done, 25));
        }
      }
      const cleanupDeadline = performance.now() + 2_000;
      let absentChecks = 0;
      while (absentChecks < 3 && performance.now() < cleanupDeadline) {
        rmSync(profile, { recursive: true, force: true });
        await new Promise((done) => setTimeout(done, 25));
        absentChecks = existsSync(profile) ? 0 : absentChecks + 1;
      }
      rmSync(profile, { recursive: true, force: true });
    })();
    return closing;
  };

  try {
    const deadline = performance.now() + 45_000;
    let port;
    while (performance.now() < deadline) {
      if (spawnError) throw spawnError;
      if (process.exitCode !== null || process.signalCode !== null) throw new Error(`browser exited before debugger startup with ${executable} (code ${process.exitCode}): ${log.slice(-1200)}`);
      const match = log.match(/DevTools listening on ws:\/\/[^:]+:(\d+)\//);
      if (match) {
        port = Number(match[1]);
        break;
      }
      await new Promise((done) => setTimeout(done, 50));
    }
    if (!port) throw new Error(`browser debugger did not start within 45s with ${executable}: ${log.slice(-1200)}`);
    let target;
    let targetError;
    while (!target && performance.now() < deadline) {
      if (spawnError) throw spawnError;
      if (process.exitCode !== null || process.signalCode !== null) throw new Error(`browser exited before debugger target creation with ${executable} (code ${process.exitCode}): ${log.slice(-1200)}`);
      try {
        const response = await fetchImpl(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT', signal: AbortSignal.timeout(Math.max(1, Math.ceil(deadline - performance.now()))) });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        target = await response.json();
      } catch (error) {
        targetError = error;
        await new Promise((done) => setTimeout(done, 50));
      }
    }
    if (!target?.webSocketDebuggerUrl) throw new Error(`browser debugger target was not ready within 45s with ${executable}: ${targetError?.message ?? 'missing target URL'}; ${log.slice(-1200)}`);
    socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('browser websocket did not open before startup deadline')), Math.max(1, deadline - performance.now()));
      const finish = (error) => {
        clearTimeout(timer);
        if (error) reject(error);
        else resolve();
      };
      socket.onopen = () => finish();
      socket.onerror = () => finish(new Error('browser websocket failed during startup'));
      socket.onclose = () => finish(new Error('browser websocket closed during startup'));
    });
    let id = 0;
    socket.onmessage = ({ data }) => {
      const message = JSON.parse(data);
      if (message.id && pending.has(message.id)) {
        const handler = pending.get(message.id);
        pending.delete(message.id);
        clearTimeout(handler.timeout);
        if (message.error) return handler.reject(new Error(message.error.message));
        const exception = message.result?.exceptionDetails;
        if (exception) return handler.reject(new Error(exception.exception?.description ?? exception.text));
        return handler.resolve(message.result);
      }
      onEvent(message);
    };
    const send = (method, params = {}, timeoutMs = 30_000) => new Promise((resolve, reject) => {
      if (closed) return reject(new Error('browser connection is closed'));
      const requestId = ++id;
      const timeout = setTimeout(() => {
        pending.delete(requestId);
        reject(new Error(`browser command timed out after ${timeoutMs}ms: ${method}`));
      }, timeoutMs);
      pending.set(requestId, { resolve, reject, timeout });
      socket.send(JSON.stringify({ id: requestId, method, params }));
    });
    const close = async () => {
      if (!closed) {
        try {
          await send('Browser.close', {}, 2_000);
        } catch {}
      }
      return stop();
    };
    socket.onclose = () => { void stop(new Error('browser connection closed unexpectedly'), false).catch(() => {}); };
    socket.onerror = () => { void stop(new Error('browser connection closed unexpectedly'), false).catch(() => {}); };
    await send('Page.enable');
    // The debugger target is a separate tab. Give it stable focus independent
    // of browser startup ordering or whichever tab the host considers active.
    await send('Emulation.setFocusEmulationEnabled', { enabled: true });
    await send('Emulation.setTimezoneOverride', { timezoneId: 'UTC' });
    await send('Emulation.setLocaleOverride', { locale: 'en-US' });
    await send('Emulation.setEmulatedMedia', { features: [
      { name: 'prefers-color-scheme', value: 'light' },
      { name: 'prefers-reduced-motion', value: 'no-preference' },
    ] });
    await send('Page.addScriptToEvaluateOnNewDocument', { source: browserEnvironment });
    return { debugPort: port, send, close };
  } catch (error) {
    await stop();
    throw error;
  }
}
