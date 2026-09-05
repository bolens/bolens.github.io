import { resolve } from 'node:path';
import { startBrowser } from './cdp-browser.mjs';
import { evaluate, navigate, waitFor } from './browser-test.mjs';
import { startSiteServer } from './site-server.mjs';

export async function startUI() {
  const server = await startSiteServer(resolve(import.meta.dirname, '../..'));
  const errors = [];
  let browser;
  try {
    browser = await startBrowser((message) => {
      if (message.method !== 'Runtime.exceptionThrown') return;
      const details = message.params.exceptionDetails;
      const urls = [details.url, ...(details.stackTrace?.callFrames ?? []).map((frame) => frame.url)].filter(Boolean);
      if (urls.some((url) => url.startsWith(server.origin))) errors.push(details.exception?.description ?? details.text);
    });
    await browser.send('Runtime.enable');
  } catch (error) { await server.close(); throw error; }
  const { send } = browser;
  return {
    send, origin: server.origin, errors,
    async load(path = '/', source = '') {
      // A fresh document is required even for repeated routes and hash changes.
      await navigate(send, 'about:blank');
      const script = await send('Page.addScriptToEvaluateOnNewDocument', { source: `localStorage.clear();${source}` });
      try { await navigate(send, server.origin + path); }
      finally { await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: script.identifier }); }
      await waitFor(send, '!!window.portfolioAppearancePicker', 'application controls');
    },
    async key(key, code, modifiers = 0) {
      const windowsVirtualKeyCode = key.length === 1 ? key.toUpperCase().charCodeAt(0) : { Escape: 27, Enter: 13, Home: 36, End: 35, ArrowUp: 38, ArrowDown: 40, ArrowRight: 39, Tab: 9 }[key];
      await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key, code, modifiers, windowsVirtualKeyCode });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, modifiers, windowsVirtualKeyCode });
    },
    async open(query = '') {
      await this.key('k', 'KeyK', 1);
      await waitFor(send, `document.querySelector('.command-palette').open`, 'command palette open');
      return this.search(query);
    },
    async search(query) {
      return evaluate(send, `(()=>{const input=document.querySelector('.command-palette input');input.value=${JSON.stringify(query)};input.dispatchEvent(new Event('input',{bubbles:true}));return [...document.querySelectorAll('.command-palette [role="option"] b')].map(node=>node.textContent)})()`);
    },
    async choose(label) {
      await evaluate(send, `(()=>{const option=[...document.querySelectorAll('.command-palette [role="option"]')].find(node=>node.querySelector('b').textContent===${JSON.stringify(label)});if(!option)throw new Error('Missing command: '+${JSON.stringify(label)});option.click()})()`);
    },
    async closeCommands() {
      await evaluate(send, `document.querySelector('.command-palette .overlay-close').click()`);
      await waitFor(send, `!document.querySelector('.command-palette').open&&!portfolioOverlay.active`, 'command palette closed');
    },
    async close() { try { await browser.close(); } finally { await server.close(); } },
  };
}
