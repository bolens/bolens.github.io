import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import test from 'node:test';
import { startBrowser } from './lib/cdp-browser.mjs';
import { evaluate, navigate, waitFor, waitForFrames } from './lib/browser-test.mjs';
import { startSiteServer } from './lib/site-server.mjs';

const server = await startSiteServer(resolve(import.meta.dirname, '..'));
let browser;
try {
  browser = await startBrowser();
  const { send } = browser;
  await navigate(send, `${server.origin}/`);
  await evaluate(send, `window.__unhandled=[];addEventListener('unhandledrejection',event=>__unhandled.push(String(event.reason)))`);
  const execute = async (label) => {
    await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'k', code: 'KeyK', windowsVirtualKeyCode: 75, modifiers: 1 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'k', code: 'KeyK', windowsVirtualKeyCode: 75, modifiers: 1 });
    await evaluate(send, `(()=>{const dialog=document.querySelector('.command-palette');if(!dialog.open)throw new Error('command palette did not open');const input=dialog.querySelector('input');input.value=${JSON.stringify(label)};input.dispatchEvent(new Event('input',{bubbles:true}));const option=[...dialog.querySelectorAll('[role="option"]')].find(node=>node.querySelector('b').textContent===${JSON.stringify(label)});if(!option)throw new Error('command missing');option.click()})()`);
    await waitFor(send, `!document.querySelector('.command-palette').open&&!portfolioOverlay.active`, 'command closes overlay');
  };
  for (const [name, clipboard] of [
    ['missing clipboard', 'undefined'],
    ['denied clipboard', `{writeText:()=>Promise.reject(new DOMException('Denied','NotAllowedError'))}`],
  ]) {
    await test(`${name} reports failure and leaves subsequent commands usable`, async () => {
      await evaluate(send, `Object.defineProperty(navigator,'clipboard',{configurable:true,value:${clipboard}});document.querySelector('.command-status').textContent=''`);
      await execute('Copy page link');
      await waitFor(send, `document.querySelector('.command-status').textContent==='Clipboard access was unavailable.'`, 'clipboard failure message');
      await execute('Use day appearance');
      assert.equal(await evaluate(send, 'portfolioAppearance.theme'), 'day');
    });
  }
  await test('cancelling native sharing does not copy a link or leak a rejected promise', async () => {
    await evaluate(send, `window.__shares=[];window.__copies=[];Object.defineProperty(navigator,'share',{configurable:true,value:details=>{__shares.push(details);return Promise.reject(new DOMException('Cancelled','AbortError'))}});Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:value=>{__copies.push(value);return Promise.resolve()}}})`);
    await execute('Share page');
    await waitForFrames(send);
    const state = await evaluate(send, `({shares:__shares,copies:__copies,errors:__unhandled,title:document.title,url:location.href})`);
    assert.deepEqual(state.shares, [{ title: state.title, url: state.url }]);
    assert.deepEqual(state.copies, []);
    assert.deepEqual(state.errors, []);
    await execute('Use night appearance');
    assert.equal(await evaluate(send, 'portfolioAppearance.theme'), 'night');
  });
} finally {
  await browser?.close();
  await server.close();
}
