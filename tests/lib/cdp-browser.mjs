import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { spawn } from 'node:child_process';

export async function startBrowser(onEvent) {
  const executable = ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium'].find(existsSync);
  if (!executable) throw new Error('Chrome or Chromium is required for the browser smoke test');
  const profile = mkdtempSync('/tmp/bolens-site-smoke-');
  const process = spawn(executable, ['--headless=new', '--disable-gpu', '--disable-dev-shm-usage', '--no-sandbox', '--no-first-run', '--no-default-browser-check', '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
  let log = '';
  let socket;
  let closed = false;
  const pending = new Map();
  process.stderr.on('data', (chunk) => { log += chunk.toString(); });

  const removeProfile = () => setTimeout(() => rmSync(profile, { recursive: true, force: true }), 250);
  const stop = () => {
    if (closed) return;
    closed = true;
    socket?.close();
    const error = new Error('browser connection closed');
    for (const request of pending.values()) request.reject(error);
    pending.clear();
    if (process.exitCode === null) {
      process.once('exit', removeProfile);
      process.kill('SIGTERM');
    } else {
      removeProfile();
    }
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
        return message.error ? handler.reject(message.error) : handler.resolve(message.result);
      }
      onEvent(message);
    };
    return {
      debugPort: port,
      send: (method, params = {}) => new Promise((resolve, reject) => {
        if (closed) return reject(new Error('browser connection is closed'));
        const requestId = ++id;
        pending.set(requestId, { resolve, reject });
        socket.send(JSON.stringify({ id: requestId, method, params }));
      }),
      close: stop,
    };
  } catch (error) {
    stop();
    throw error;
  }
}
