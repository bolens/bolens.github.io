import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluate } from './lib/browser-test.mjs';
import { fixedNow } from './lib/browser-environment.mjs';
import { startUI } from './lib/ui-fixture.mjs';

const ui = await startUI();
const { send } = ui;
const good = { html_url: 'https://github.com/bolens/uddns', pushed_at: '2026-02-03T00:00:00Z' };
const response = (data) => `window.fetch=async()=>({ok:true,json:async()=>${JSON.stringify(data)}});`;
const dates = () => evaluate(send, `({resolved:document.querySelectorAll('.project-updated.is-resolved').length,unavailable:document.querySelectorAll('.project-updated.is-unavailable').length,disabled:document.querySelector('[name="project-sort"] [value="updated"]').disabled,sort:document.querySelector('[name="project-sort"]').value,invalid:[...document.querySelectorAll('[data-project-updated]')].some(node=>!Number.isFinite(Number(node.dataset.projectUpdated)))})`);
try {
  for (const [label, payload] of [
    ['empty response', []], ['non-array response', {}], ['null row', [null]],
    ['invalid timestamp', [{ ...good, pushed_at: 'not-a-date' }]],
    ['unmatched repository', [{ ...good, html_url: 'https://github.com/example/unrelated' }]],
  ]) {
    await test(`${label} leaves no usable dates and disables update sorting`, async () => {
      await ui.load('/work/?sort=updated', response(payload));
      // load and promise microtasks have completed. Assert the outcome directly,
      // rather than waiting out a broken fallback for every malformed input.
      assert.deepEqual(await dates(), { resolved: 0, unavailable: 8, disabled: true, sort: 'featured', invalid: false });
    });
  }
  await test('malformed rows do not discard valid repository dates later in the response', async () => {
    await ui.load('/work/?sort=updated', response([null, { html_url: 42 }, { ...good, html_url: 'https://github.com/bolens/aur-response-toolkit', pushed_at: 'invalid' }, good]));
    assert.deepEqual(await dates(), { resolved: 1, unavailable: 7, disabled: false, sort: 'updated', invalid: false });
    assert.equal(await evaluate(send, `document.querySelector('.project-updated.is-resolved').dateTime`), '2026-02-03T00:00:00Z');
  });
  for (const cache of [{ savedAt: fixedNow }, { savedAt: fixedNow, repositories: {} }]) {
    await test(`invalid cache ${JSON.stringify(cache)} cannot suppress a valid refresh`, async () => {
      await ui.load('/work/', `localStorage.setItem('portfolio-project-updates-v1',${JSON.stringify(JSON.stringify(cache))});window.__requests=0;window.fetch=async()=>{__requests++;return {ok:true,json:async()=>[${JSON.stringify(good)}]}};`);
      assert.equal(await evaluate(send, '__requests'), 1);
      assert.equal((await dates()).resolved, 1);
    });
  }
  for (const savedAt of [fixedNow + 1, String(fixedNow), null]) {
    await test(`invalid cache timestamp ${JSON.stringify(savedAt)} triggers a refresh`, async () => {
      await ui.load('/work/', `localStorage.setItem('portfolio-project-updates-v1',${JSON.stringify(JSON.stringify({ savedAt, repositories: [good] }))});window.__requests=0;window.fetch=async()=>{__requests++;return {ok:true,json:async()=>[${JSON.stringify(good)}]}};`);
      assert.equal(await evaluate(send, '__requests'), 1);
      assert.equal((await dates()).resolved, 1);
    });
  }
  await test('a valid updated_at can replace an invalid pushed_at without admitting invalid duplicates', async () => {
    await ui.load('/work/', response([{ ...good, pushed_at: 'invalid', updated_at: '2026-01-01T00:00:00Z' }, { ...good, pushed_at: 'invalid' }]));
    assert.equal((await dates()).resolved, 1);
    assert.equal(await evaluate(send, `document.querySelector('.project-updated.is-resolved').dateTime`), '2026-01-01T00:00:00Z');
  });
  await test('a refresh makes previously unavailable cached dates accessible', async () => {
    const second = { ...good, html_url: 'https://github.com/bolens/aur-response-toolkit' };
    await ui.load('/work/', `localStorage.setItem('portfolio-project-updates-v1',${JSON.stringify(JSON.stringify({ savedAt: 0, repositories: [good] }))});${response([good, second])}`);
    assert.deepEqual(await dates(), { resolved: 2, unavailable: 6, disabled: false, sort: 'featured', invalid: false });
    assert.equal(await evaluate(send, `[...document.querySelectorAll('.project-updated.is-resolved')].every(node=>!node.hasAttribute('aria-hidden'))`), true);
  });
  await test('stale usable dates survive a failed background refresh', async () => {
    await ui.load('/work/?sort=updated', `localStorage.setItem('portfolio-project-updates-v1',${JSON.stringify(JSON.stringify({ savedAt: 0, repositories: [good] }))});window.fetch=async()=>{throw new Error('offline')};`);
    assert.deepEqual(await dates(), { resolved: 1, unavailable: 7, disabled: false, sort: 'updated', invalid: false });
  });
  await test('unknown filter URL values normalize while reset preserves the fragment', async () => {
    await ui.load('/work/?q=privacy&language=missing&type=missing&sort=missing#projects', response([good]));
    const controls = await evaluate(send, `({language:document.querySelector('[name="project-language"]').value,type:document.querySelector('[name="project-kind"]').value,sort:document.querySelector('[name="project-sort"]').value,visible:[...document.querySelectorAll('.index-list>a:not([hidden]) b')].map(node=>node.textContent)})`);
    assert.deepEqual(controls, { language: '', type: '', sort: 'featured', visible: ['Privacy Devices'] });
    await evaluate(send, `document.querySelector('.work-reset').click()`);
    assert.equal(await evaluate(send, 'location.search+location.hash'), '#projects');
    assert.equal(await evaluate(send, `document.activeElement.name`), 'project-search');
  });
  await test('filter controls are hidden with JavaScript disabled', async () => {
    await send('Emulation.setScriptExecutionDisabled', { value: true });
    const { navigate } = await import('./lib/browser-test.mjs');
    try {
      await navigate(send, `${ui.origin}/work/`);
      const state = await evaluate(send, `({tools:getComputedStyle(document.querySelector('.work-tools')).display,dates:[...document.querySelectorAll('.project-updated')].every(node=>getComputedStyle(node).display==='none'),projects:document.querySelectorAll('.index-list>a').length})`);
      assert.deepEqual(state, { tools: 'none', dates: true, projects: 8 });
    } finally { await send('Emulation.setScriptExecutionDisabled', { value: false }); }
  });
  assert.deepEqual(ui.errors, []);
} finally { await ui.close(); }
