import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluate, waitFor } from './lib/browser-test.mjs';
import { startUI } from './lib/ui-fixture.mjs';

const ui = await startUI();
const { send } = ui;
const run = async (label) => {
  await ui.open(label); await ui.choose(label);
  await waitFor(send, `!document.querySelector('.command-palette').open&&!portfolioOverlay.active`, `${label} completes`);
};
try {
  await test('search combines terms, ranks exact labels, and keeps ARIA selection aligned', async () => {
    await ui.load();
    assert.equal((await ui.open('privacy'))[0], 'Privacy Devices');
    assert.deepEqual(await ui.search('privacy repository'), ['Privacy Devices repository']);
    assert.deepEqual(await ui.search('> reduced'), ['Toggle reduced motion']);
    const names = await ui.search('@ privacy');
    assert.ok(names.includes('Privacy Devices') && names.includes('Privacy Devices repository'));
    assert.ok(!names.includes('Home'));
    await ui.search('no such trail zzz');
    await ui.key('Enter', 'Enter');
    assert.equal(await evaluate(send, `document.querySelector('.command-palette').open`), true);
    assert.equal(await evaluate(send, `document.querySelector('.command-palette input').hasAttribute('aria-activedescendant')`), false);
    await ui.search('appearance');
    await ui.key('End', 'End');
    const selected = await evaluate(send, `(()=>{const input=document.querySelector('.command-palette input');const option=document.getElementById(input.getAttribute('aria-activedescendant'));return {label:option.querySelector('b').textContent,selected:option.getAttribute('aria-selected'),count:document.querySelectorAll('.command-palette [aria-selected="true"]').length}})()`);
    assert.equal(selected.selected, 'true'); assert.equal(selected.count, 1);
    await ui.search('Use day appearance');
    assert.equal(await evaluate(send, `document.querySelector('.command-palette [aria-selected="true"] b').textContent`), 'Use day appearance');
    await ui.closeCommands();
  });

  await test('pointer selection follows nested option content and ignores group headings', async () => {
    await ui.load(); await ui.open('appearance');
    const selection = await evaluate(send, `(()=>{const result=document.querySelector('.command-results');const option=[...result.querySelectorAll('[role="option"]')].find(node=>node.querySelector('b').textContent==='Use night appearance');option.querySelector('b').dispatchEvent(new PointerEvent('pointermove',{bubbles:true}));result.querySelector('.command-group').dispatchEvent(new PointerEvent('pointermove',{bubbles:true}));return document.querySelector('.command-palette [aria-selected="true"] b').textContent})()`);
    assert.equal(selection, 'Use night appearance');
    await ui.key('Enter', 'Enter');
    await waitFor(send, `!portfolioOverlay.active`, 'selected action completes');
    assert.equal(await evaluate(send, 'portfolioAppearance.theme'), 'night');
  });

  await test('recent commands are bounded, deduplicated, restored, and cleared by reset', async () => {
    await ui.load();
    const commands = ['Use day appearance', 'Use night appearance', 'Use system appearance', 'Use Pacific Coast palette', 'Use Glacier palette', 'Toggle reduced motion'];
    for (const command of commands) await run(command);
    await run('Use night appearance');
    const expected = ['Use night appearance', 'Toggle reduced motion', 'Use Glacier palette', 'Use Pacific Coast palette', 'Use system appearance'];
    assert.deepEqual(await evaluate(send, `JSON.parse(localStorage.getItem('portfolio-recent-commands'))`), expected);
    // Reload without the isolation helper, intentionally retaining persisted history.
    const { navigate } = await import('./lib/browser-test.mjs');
    await navigate(send);
    assert.deepEqual((await ui.open()).slice(0, 5), expected);
    await ui.closeCommands();
    await run('Reset all site preferences');
    assert.equal(await evaluate(send, `localStorage.getItem('portfolio-recent-commands')`), null);
    assert.equal((await ui.open())[0], 'Home');
    await ui.closeCommands();
  });

  for (const saved of ['{broken', '{}', '[null,42,"Missing command","Use night appearance"]']) {
    await test(`invalid recent-command storage ${saved} does not break search`, async () => {
      await ui.load('/', `localStorage.setItem('portfolio-recent-commands',${JSON.stringify(saved)});`);
      const names = await ui.open();
      assert.ok(names.includes('Home') && names.includes('Use night appearance'));
      assert.equal(new Set(names).size, names.length);
      assert.ok(!names.includes('Missing command'));
      await ui.closeCommands();
    });
  }

  await test('browser actions call their native boundaries with the current page context', async () => {
    await ui.load('/', `window.__actions=[];history.back=()=>__actions.push('back');history.forward=()=>__actions.push('forward');window.print=()=>__actions.push('print');`);
    for (const command of ['Back', 'Forward', 'Print page']) await run(command);
    assert.deepEqual(await evaluate(send, '__actions'), ['back', 'forward', 'print']);
    await run('Toggle reduced motion');
    await run('Toggle reduced motion');
    await waitFor(send, `document.querySelector('.command-status').textContent==='Using the system motion preference.'`, 'system motion announcement');
    assert.equal(await evaluate(send, 'portfolioAppearance.motion'), 'auto');
  });

  await test('focus-main action keeps focus on main after the dialog close event', async () => {
    await ui.load();
    await evaluate(send, `document.querySelector('.site-header a').focus()`);
    await run('Focus main content');
    assert.equal(await evaluate(send, `document.activeElement===document.querySelector('main')`), true);
  });

  await test('scroll actions request the correct destinations and native reload creates a new document', async () => {
    await ui.load('/', `window.__scrollRequests=[];const nativeScroll=window.scrollTo;window.scrollTo=(...args)=>{if(args[0]?.behavior==='smooth')__scrollRequests.push(args[0]);else nativeScroll(...args)};`);
    await run('Top of page'); await run('Bottom of page');
    const requests = await evaluate(send, `({requests:__scrollRequests,height:document.documentElement.scrollHeight})`);
    assert.deepEqual(requests.requests, [{ top: 0, behavior: 'smooth' }, { top: requests.height, behavior: 'smooth' }]);
    const previous = await evaluate(send, 'performance.timeOrigin');
    await ui.open('Reload page'); await ui.choose('Reload page');
    await waitFor(send, `performance.timeOrigin!==${previous}&&document.readyState==='complete'&&!!portfolioAppearancePicker`, 'reload command loads a new document');
  });

  await test('case-study actions wrap sections and copy the active section and repository', async () => {
    await ui.load('/case-studies/uddns/#condition', `localStorage.setItem('portfolio-motion','reduced');window.__copied=[];Object.defineProperty(navigator,'clipboard',{value:{writeText:async value=>{__copied.push(value)}},configurable:true});`);
    await waitFor(send, `document.querySelector('#condition').getBoundingClientRect().top<=innerHeight*.38`, 'initial section aligned');
    await run('Previous case-study section');
    await waitFor(send, `location.hash==='#confirm'&&document.querySelector('.case-route [aria-current="location"]')?.getAttribute('href')==='#confirm'&&document.querySelector('#confirm').getBoundingClientRect().top<=innerHeight*.38`, 'previous section wraps');
    await run('Next case-study section');
    await waitFor(send, `location.hash==='#condition'&&document.querySelector('.case-route [aria-current="location"]')?.getAttribute('href')==='#condition'&&document.querySelector('#condition').getBoundingClientRect().top<=innerHeight*.38`, 'next section wraps');
    await run('Copy link to current section');
    await waitFor(send, `document.querySelector('.command-status').textContent==='Section link copied.'`, 'section copy');
    await run('Copy current repository URL');
    await waitFor(send, `document.querySelector('.command-status').textContent==='Repository URL copied.'`, 'repository copy');
    assert.deepEqual(await evaluate(send, '__copied'), [`${ui.origin}/case-studies/uddns/#condition`, 'https://github.com/bolens/uddns']);
  });

  for (const [slug, previous, next] of [
    ['uddns', false, true], ['launch-layer', true, true], ['privacy-devices', true, false],
  ]) {
    await test(`${slug} exposes only available neighboring projects`, async () => {
      await ui.load(`/case-studies/${slug}/`);
      const names = await ui.open();
      assert.equal(names.includes('Previous project'), previous);
      assert.equal(names.includes('Next project'), next);
      assert.equal(names.includes('Open next project repository'), next);
      assert.equal(names[0], next ? 'Next project' : 'Previous project');
      await ui.closeCommands();
    });
  }

  for (const [key, code, pathname, hash] of [
    ['h', 'KeyH', '/', ''], ['w', 'KeyW', '/work/', ''], ['a', 'KeyA', '/about/', ''],
    ['s', 'KeyS', '/', '#selected-work'], ['c', 'KeyC', '/', '#contact'],
  ]) {
    await test(`Alt+${key.toUpperCase()} navigates to ${pathname}${hash}`, async () => {
      await ui.load('/case-studies/uddns/');
      await ui.key(key, code, 1);
      await waitFor(send, `location.pathname===${JSON.stringify(pathname)}&&location.hash===${JSON.stringify(hash)}&&document.readyState==='complete'&&!!window.portfolioAppearancePicker`, 'navigation shortcut destination');
    });
  }
  await test('next and previous project shortcuts navigate to the expected local routes', async () => {
    await ui.load('/case-studies/launch-layer/');
    await ui.key('j', 'KeyJ', 1);
    await waitFor(send, `location.pathname==='/case-studies/millennium-helpers/'&&document.readyState==='complete'&&!!portfolioAppearancePicker`, 'next project navigation');
    await ui.key('N', 'KeyN', 9);
    await waitFor(send, `location.pathname==='/case-studies/launch-layer/'&&document.readyState==='complete'&&!!portfolioAppearancePicker`, 'previous project navigation');
  });
  assert.deepEqual(ui.errors, [], 'uncaught application exceptions');
} finally { await ui.close(); }
