import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { spawn } from 'node:child_process';

export async function startBrowser(onEvent) {
  const executable = ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium'].find(existsSync);
  if (!executable) throw new Error('Chrome or Chromium is required for the browser smoke test');
  const profile = mkdtempSync('/tmp/bolens-site-smoke-');
  const process = spawn(executable, ['--headless=new', '--disable-gpu', '--disable-dev-shm-usage', '--no-sandbox', '--no-first-run', '--no-default-browser-check', '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { detached: true, stdio: ['ignore', 'ignore', 'pipe'] });
  let log = '';
  let socket;
  let closed = false;
  const pending = new Map();
  process.stderr.on('data', (chunk) => { log += chunk.toString(); });

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
        const gracefulDeadline = Date.now() + 2_000;
        while (groupExists() && Date.now() < gracefulDeadline) {
          await new Promise((done) => setTimeout(done, 25));
        }
        if (groupExists()) globalThis.process.kill(-process.pid, 'SIGKILL');
        const forcedDeadline = Date.now() + 2_000;
        while (groupExists() && Date.now() < forcedDeadline) {
          await new Promise((done) => setTimeout(done, 25));
        }
      }
      const cleanupDeadline = Date.now() + 2_000;
      let absentChecks = 0;
      while (absentChecks < 3 && Date.now() < cleanupDeadline) {
        rmSync(profile, { recursive: true, force: true });
        await new Promise((done) => setTimeout(done, 25));
        absentChecks = existsSync(profile) ? 0 : absentChecks + 1;
      }
      rmSync(profile, { recursive: true, force: true });
    })();
    return closing;
  };

  try {
    const deadline = Date.now() + 45_000;
    let port;
    while (Date.now() < deadline) {
      if (process.exitCode !== null) throw new Error(`browser exited before debugger startup with ${executable} (code ${process.exitCode}): ${log.slice(-1200)}`);
      const match = log.match(/DevTools listening on ws:\/\/[^:]+:(\d+)\//);
      if (match) {
        port = Number(match[1]);
        break;
      }
      await new Promise((done) => setTimeout(done, 50));
    }
    if (!port) throw new Error(`browser debugger did not start within 45s with ${executable}: ${log.slice(-1200)}`);
    const target = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' }).then((result) => result.json());
    socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
    let id = 0;
    socket.onmessage = ({ data }) => {
      const message = JSON.parse(data);
      if (message.id && pending.has(message.id)) {
        const handler = pending.get(message.id);
        pending.delete(message.id);
        clearTimeout(handler.timeout);
        return message.error ? handler.reject(message.error) : handler.resolve(message.result);
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
    return { debugPort: port, send, close };
  } catch (error) {
    await stop();
    throw error;
  }
}
