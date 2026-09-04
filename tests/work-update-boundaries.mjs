import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import test from 'node:test';
import { startBrowser } from './lib/cdp-browser.mjs';
import { evaluate, navigate, waitFor } from './lib/browser-test.mjs';
import { fixedNow } from './lib/browser-environment.mjs';
import { startSiteServer } from './lib/site-server.mjs';

const server = await startSiteServer(resolve(import.meta.dirname, '..'));
let browser;
const repositories = [
  { html_url: 'https://github.com/BOLENS/UDDNS', pushed_at: '2026-01-02T00:00:00Z' },
  { html_url: 'https://github.com/bolens/aur-response-toolkit', pushed_at: '2026-01-02T00:00:00Z' },
];
try {
  browser = await startBrowser();
  const { send } = browser;
  const load = async (source, query = '') => {
    await navigate(send, 'about:blank');
    const script = await send('Page.addScriptToEvaluateOnNewDocument', { source: `localStorage.clear();window.__fetches=0;${source}` });
    try { await navigate(send, `${server.origin}/work/${query}`); }
    finally { await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: script.identifier }); }
  };
  const read = () => evaluate(send, `({fetches:__fetches,resolved:document.querySelectorAll('.project-updated.is-resolved').length,unavailable:document.querySelectorAll('.project-updated.is-unavailable').length,disabled:document.querySelector('[name="project-sort"] [value="updated"]').disabled,sort:document.querySelector('[name="project-sort"]').value})`);

  for (const age of [599_999, 600_000]) {
    await test(`project cache ${age}ms old ${age < 600_000 ? 'avoids' : 'starts'} a refresh`, async () => {
      const cache = JSON.stringify({ savedAt: fixedNow - age, repositories });
      await load(`localStorage.setItem('portfolio-project-updates-v1',${JSON.stringify(cache)});window.fetch=()=>{__fetches++;return new Promise(resolve=>window.__respondUpdates=resolve)};`, '?sort=updated');
      assert.deepEqual(await read(), { fetches: age < 600_000 ? 0 : 1, resolved: 2, unavailable: 6, disabled: false, sort: 'updated' });
      const order = await evaluate(send, `[...document.querySelectorAll('.index-list>a b')].slice(0,2).map(node=>node.textContent)`);
      assert.deepEqual(order, ['uDDNS', 'AUR Response Toolkit'], 'equal update dates retain featured order and URLs match regardless of case');
      if (age === 600_000) {
        await evaluate(send, `__respondUpdates({ok:true,json:async()=>[{html_url:'https://github.com/bolens/uddns',pushed_at:'2026-09-02T00:00:00Z'}]})`);
        await waitFor(send, `document.querySelector('.project-updated').dateTime==='2026-09-02T00:00:00Z'`, 'refresh replaces cached date');
        assert.equal(await evaluate(send, `JSON.parse(localStorage.getItem('portfolio-project-updates-v1')).savedAt`), fixedNow);
      }
    });
  }

  for (const [name, response] of [
    ['network rejection', `Promise.reject(new Error('offline'))`],
    ['HTTP failure', `Promise.resolve({ok:false,status:503})`],
    ['invalid JSON', `Promise.resolve({ok:true,json:()=>Promise.reject(new SyntaxError('bad JSON'))})`],
  ]) {
    await test(`${name} disables update sorting while ordinary filtering still works`, async () => {
      await load(`window.fetch=()=>{__fetches++;return ${response}};`, '?sort=updated#projects');
      await waitFor(send, `document.querySelector('[name="project-sort"] [value="updated"]').disabled`, 'unavailable update fallback');
      assert.deepEqual(await read(), { fetches: 1, resolved: 0, unavailable: 8, disabled: true, sort: 'featured' });
      assert.equal(await evaluate(send, 'location.search+location.hash'), '#projects');
      const names = await evaluate(send, `(()=>{const input=document.querySelector('[name="project-search"]');input.value='  PRIVACY  ';input.dispatchEvent(new Event('input',{bubbles:true}));return [...document.querySelectorAll('.index-list>a:not([hidden]) b')].map(node=>node.textContent)})()`);
      assert.deepEqual(names, ['Privacy Devices']);
    });
  }

  await test('storage denial does not discard successful update data or break sorting', async () => {
    await load(`Storage.prototype.getItem=Storage.prototype.setItem=()=>{throw new DOMException('Blocked','SecurityError')};window.fetch=()=>{__fetches++;return Promise.resolve({ok:true,json:async()=>${JSON.stringify(repositories)}})};`, '?sort=updated');
    await waitFor(send, `document.querySelector('.work-tools').dataset.updates==='live'`, 'updates without storage');
    assert.deepEqual(await read(), { fetches: 1, resolved: 2, unavailable: 6, disabled: false, sort: 'updated' });
  });
} finally {
  await browser?.close();
  await server.close();
}
