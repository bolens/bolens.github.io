import { existsSync, mkdtempSync } from 'node:fs';
import { spawn } from 'node:child_process';

export async function startBrowser(onEvent) {
  const executable = ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium'].find(existsSync);
  if (!executable) throw new Error('Chrome or Chromium is required for the browser smoke test');
  const profile = mkdtempSync('/tmp/bolens-site-smoke-');
  const process = spawn(executable, ['--headless=new', '--disable-gpu', '--disable-dev-shm-usage', '--no-sandbox', '--no-first-run', '--no-default-browser-check', '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=9222', `--user-data-dir=${profile}`, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
  let log = '';
  process.stderr.on('data', (chunk) => { log += chunk.toString(); });
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    if (process.exitCode !== null) throw new Error(`browser exited before debugger startup with ${executable} (code ${process.exitCode}): ${log.slice(-1200)}`);
    try {
      const version = await fetch('http://127.0.0.1:9222/json/version').then((result) => result.json());
      if (version) break;
    } catch {
      await new Promise((done) => setTimeout(done, 100));
    }
  }
  if (Date.now() >= deadline) throw new Error(`browser debugger did not start within 45s with ${executable}: ${log.slice(-1200)}`);
  const target = await fetch('http://127.0.0.1:9222/json/new?about:blank', { method: 'PUT' }).then((result) => result.json());
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let id = 0;
  const pending = new Map();
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
    send: (method, params = {}) => new Promise((resolve, reject) => {
      const requestId = ++id;
      pending.set(requestId, { resolve, reject });
      socket.send(JSON.stringify({ id: requestId, method, params }));
    }),
    close: () => { socket.close(); process.kill('SIGTERM'); },
  };
}
