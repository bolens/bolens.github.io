import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluate, waitFor } from './lib/browser-test.mjs';
import { startUI } from './lib/ui-fixture.mjs';

const ui = await startUI();
const { send } = ui;
try {
  for (const element of ['input', 'textarea', 'select', 'div']) {
    await test(`${element} editing suppresses navigation and overlay shortcuts`, async () => {
      await ui.load();
      await evaluate(send, `(()=>{const input=document.createElement(${JSON.stringify(element)});input.id='editing';if(input.tagName==='DIV')input.contentEditable='true';document.body.append(input);input.focus()})()`);
      for (const [key, code, modifiers] of [['k', 'KeyK', 1], ['p', 'KeyP', 1], ['g', 'KeyG', 1], ['/', 'Slash', 0], ['w', 'KeyW', 1], ['N', 'KeyN', 9]]) await ui.key(key, code, modifiers);
      assert.deepEqual(await evaluate(send, `({path:location.pathname,overlay:portfolioOverlay.active,picker:portfolioAppearancePicker.visible,focus:document.activeElement.id})`), { path: '/', overlay: false, picker: false, focus: 'editing' });
    });
  }

  await test('reserved modifier combinations do not invoke site shortcuts', async () => {
    await ui.load();
    await evaluate(send, `for(const flags of [{ctrlKey:true},{metaKey:true},{altKey:true,ctrlKey:true},{altKey:true,metaKey:true},{altKey:true,shiftKey:true}])document.body.dispatchEvent(new KeyboardEvent('keydown',{key:'p',code:'KeyP',bubbles:true,...flags}))`);
    assert.equal(await evaluate(send, 'portfolioAppearancePicker.visible'), false);
    await ui.key('P', 'KeyP', 10);
    assert.equal(await evaluate(send, 'portfolioAppearancePicker.visible'), true);
    await ui.key('Escape', 'Escape');
  });

  await test('picker radio keyboard changes persist and opening twice preserves the return target', async () => {
    await ui.load();
    await evaluate(send, `(()=>{const button=document.createElement('button');button.id='return-target';document.body.append(button);button.focus();portfolioAppearancePicker.open();portfolioAppearancePicker.open();document.querySelector('.theme-options input[value="day"]').focus()})()`);
    await ui.key('ArrowRight', 'ArrowRight');
    await waitFor(send, `portfolioAppearance.theme==='night'`, 'native radio keyboard selection');
    assert.equal(await evaluate(send, `localStorage.getItem('portfolio-theme')`), 'night');
    assert.equal(await evaluate(send, `document.querySelector('.theme-options input:checked').value`), 'night');
    await evaluate(send, `document.querySelector('.palette-picker .overlay-close').click()`);
    await waitFor(send, `!portfolioOverlay.active&&document.activeElement.id==='return-target'`, 'picker focus restored');
  });

  await test('inside pointer interaction keeps picker open while outside interaction only collapses it', async () => {
    await ui.load();
    await evaluate(send, `portfolioAppearancePicker.open();document.querySelector('.palette-name').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}))`);
    assert.equal(await evaluate(send, `document.querySelector('.palette-picker').open`), true);
    await evaluate(send, `document.querySelector('main').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}))`);
    await waitFor(send, `!document.querySelector('.palette-picker').open&&!portfolioOverlay.active`, 'outside pointer collapses picker');
    assert.equal(await evaluate(send, 'portfolioAppearancePicker.visible'), true);
    await ui.key('Escape', 'Escape');
    assert.equal(await evaluate(send, 'portfolioAppearancePicker.visible'), false);
  });

  for (const [key, code, selector] of [['k', 'KeyK', '.command-palette'], ['/', 'Slash', '.shortcut-overlay'], ['g', 'KeyG', '.glyph-explorer']]) {
    await test(`${selector} ignores interior clicks, closes on backdrop, and tolerates a removed focus target`, async () => {
      await ui.load();
      await evaluate(send, `(()=>{const button=document.createElement('button');button.id='removed-target';document.body.append(button);button.focus()})()`);
      await ui.key(key, code, 1);
      await evaluate(send, `document.querySelector(${JSON.stringify(selector)}).querySelector('h2').click();document.querySelector('#removed-target').remove()`);
      assert.equal(await evaluate(send, `document.querySelector(${JSON.stringify(selector)}).open`), true);
      await evaluate(send, `document.querySelector(${JSON.stringify(selector)}).dispatchEvent(new MouseEvent('click',{bubbles:true}))`);
      await waitFor(send, `!document.querySelector(${JSON.stringify(selector)}).open&&!portfolioOverlay.active`, 'backdrop closes dialog');
      assert.equal(await evaluate(send, 'document.activeElement.isConnected'), true);
    });
  }

  await test('opening each dialog closes the previous one without losing aggregate overlay state', async () => {
    await ui.load();
    for (const [key, code, expected] of [['g', 'KeyG', '.glyph-explorer'], ['/', 'Slash', '.shortcut-overlay'], ['k', 'KeyK', '.command-palette']]) {
      await ui.key(key, code, 1);
      await waitFor(send, `document.querySelectorAll('dialog[open]').length===1&&document.querySelector(${JSON.stringify(expected)}).open&&portfolioOverlay.active`, 'exclusive dialog state');
    }
    await ui.closeCommands();
  });
  assert.deepEqual(ui.errors, [], 'uncaught application exceptions');
} finally { await ui.close(); }
