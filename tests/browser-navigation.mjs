import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { startBrowser } from './lib/cdp-browser.mjs';
import { evaluate, navigate } from './lib/browser-test.mjs';
import { fixedNow } from './lib/browser-environment.mjs';

let generation = 0;
let hold;
const server = createServer((request, response) => {
  if (request.url === '/favicon.ico') return response.writeHead(204).end();
  const release = () => response.writeHead(200, { 'content-type': 'text/html' }).end(`<!doctype html><p id="ready">${++generation}</p>`);
  if (hold) { const next = hold; hold = undefined; next(release); }
  else release();
});
let browser;
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}/`;
try {
  browser = await startBrowser();
  const { send } = browser;
  await navigate(send, url);
  const environment = await evaluate(send, `({now:Date.now(),constructed:+new Date(),parsed:+new Date('2000-01-01T00:00:00Z'),hour:new Date().getHours(),zone:Intl.DateTimeFormat().resolvedOptions().timeZone,locale:Intl.DateTimeFormat().resolvedOptions().locale})`);
  assert.deepEqual(environment, { now: fixedNow, constructed: fixedNow, parsed: 946684800000, hour: 12, zone: 'UTC', locale: 'en-US' });
  assert.equal(await evaluate(send, `fetch('https://example.invalid/').then(()=>false,error=>error.message.includes('requires a test fixture'))`, { awaitPromise: true }), true);

  for (const destination of [url, undefined]) {
    const previous = await evaluate(send, `document.querySelector('#ready').textContent`);
    let requested;
    const requestArrived = new Promise((resolve) => { requested = resolve; });
    hold = requested;
    let settled = false;
    const navigation = navigate(send, destination).then(() => { settled = true; });
    const release = await requestArrived;
    // The old ready DOM is deliberately kept alive until the test releases the
    // next response. No machine-speed assumptions or arbitrary sleeps.
    assert.equal(settled, false);
    release();
    await navigation;
    assert.notEqual(await evaluate(send, `document.querySelector('#ready').textContent`), previous);
  }
  await send('Emulation.setScriptExecutionDisabled', { value: true });
  await navigate(send, url);
  assert.equal(await evaluate(send, `document.querySelector('#ready').textContent`), '4');
  console.log('Navigation passed delayed same-URL loads, reloads, disabled scripts, fixed clock, and external fetch isolation.');
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}
