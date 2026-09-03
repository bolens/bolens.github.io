import { resolve } from 'node:path';
import { startBrowser } from './lib/cdp-browser.mjs';
import { startSiteServer } from './lib/site-server.mjs';

const root = resolve(import.meta.dirname, '..');
const server = await startSiteServer(root);
let browser;
const pause = (duration = 50) => new Promise((done) => setTimeout(done, duration));
const waitFor = async (send, expression, description) => {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true });
    if (result.result.value) return result.result.value;
    await pause();
  }
  throw new Error(`timed out waiting for ${description}`);
};
const key = async (send, value, code, modifiers = 0) => {
  const windowsVirtualKeyCode = value.length === 1 ? value.toUpperCase().charCodeAt(0) : { Escape: 27, Enter: 13, Home: 36, End: 35, ArrowUp: 38, ArrowDown: 40 }[value];
  await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: value, code, windowsVirtualKeyCode, modifiers });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: value, code, windowsVirtualKeyCode, modifiers });
};

try {
  browser = await startBrowser(() => {});
  const { send } = browser;
  await Promise.all(['Page.enable', 'Runtime.enable'].map((method) => send(method)));
  await send('Page.navigate', { url: `${server.origin}/` });
  await waitFor(send, `document.readyState==='complete'&&!!document.querySelector('.command-palette')`, 'home interactions');

  await send('Runtime.evaluate', { expression: `(()=>{const input=document.createElement('input');input.id='shortcut-guard';document.body.append(input);input.focus()})()` });
  await key(send, 'p', 'KeyP', 1);
  const guarded = await send('Runtime.evaluate', { expression: `document.querySelector('.palette-picker').hidden`, returnByValue: true });
  if (!guarded.result.value) throw new Error('appearance shortcut opened while typing in a form control');
  await send('Runtime.evaluate', { expression: `document.querySelector('#shortcut-guard').remove()` });

  await key(send, '/', 'Slash', 1);
  const shortcutOverlay = await send('Runtime.evaluate', { expression: `(()=>{const shortcuts=document.querySelector('.shortcut-overlay');const commands=document.querySelector('.command-palette');return {open:shortcuts?.open,commandsOpen:commands.open,rows:shortcuts?.querySelectorAll('tbody tr').length,title:shortcuts?.querySelector('h2')?.textContent,overlay:portfolioOverlay.active}})()`, returnByValue: true });
  if (!shortcutOverlay.result.value.open || shortcutOverlay.result.value.commandsOpen || shortcutOverlay.result.value.rows < 8 || shortcutOverlay.result.value.title !== 'Keyboard shortcuts' || !shortcutOverlay.result.value.overlay) throw new Error(`shortcut overlay failed: ${JSON.stringify(shortcutOverlay.result.value)}`);
  await key(send, 'Escape', 'Escape');
  await waitFor(send, `!document.querySelector('.shortcut-overlay').open&&!portfolioOverlay.active`, 'shortcut overlay close');

  await send('Runtime.evaluate', { expression: `(()=>{const button=document.createElement('button');button.id='command-return';document.body.append(button);button.focus()})()` });
  await key(send, '/', 'Slash');
  await send('Runtime.evaluate', { expression: `(()=>{const input=document.querySelector('.command-palette input');input.value='prvcy';input.dispatchEvent(new Event('input',{bubbles:true}))})()` });
  const fuzzySearch = await send('Runtime.evaluate', { expression: `(()=>{const dialog=document.querySelector('.command-palette');return {open:dialog.open,first:dialog.querySelector('[role="option"] b')?.textContent,marks:dialog.querySelectorAll('[role="option"] mark').length,groups:dialog.querySelectorAll('.command-group').length}})()`, returnByValue: true });
  if (!fuzzySearch.result.value.open || fuzzySearch.result.value.first !== 'Privacy Devices' || fuzzySearch.result.value.marks < 1 || fuzzySearch.result.value.groups < 1) throw new Error(`fuzzy command search failed: ${JSON.stringify(fuzzySearch.result.value)}`);
  await send('Runtime.evaluate', { expression: `(()=>{const input=document.querySelector('.command-palette input');input.value='';input.dispatchEvent(new Event('input',{bubbles:true}))})()` });
  await key(send, 'End', 'End');
  const selectedEnd = await send('Runtime.evaluate', { expression: `document.querySelector('.command-palette [aria-selected="true"] b').textContent`, returnByValue: true });
  await key(send, 'Home', 'Home');
  const selectedHome = await send('Runtime.evaluate', { expression: `document.querySelector('.command-palette [aria-selected="true"] b').textContent`, returnByValue: true });
  if (selectedEnd.result.value !== 'Reset all site preferences' || selectedHome.result.value !== 'Home') throw new Error(`command Home/End failed: ${selectedHome.result.value} -> ${selectedEnd.result.value}`);
  await key(send, 'Escape', 'Escape');
  const commandFocusReturn = await send('Runtime.evaluate', { expression: `document.activeElement?.id`, returnByValue: true });
  if (commandFocusReturn.result.value !== 'command-return') throw new Error(`command focus returned to ${commandFocusReturn.result.value}`);

  await key(send, 'k', 'KeyK', 1);
  await send('Runtime.evaluate', { expression: `(()=>{const dialog=document.querySelector('.command-palette');const input=dialog.querySelector('input');input.value='keyboard shortcuts';input.dispatchEvent(new Event('input',{bubbles:true}));dialog.querySelector('[role="option"]').click()})()` });
  const shortcutCommand = await send('Runtime.evaluate', { expression: `({shortcutsOpen:document.querySelector('.shortcut-overlay').open,commandsOpen:document.querySelector('.command-palette').open})`, returnByValue: true });
  if (!shortcutCommand.result.value.shortcutsOpen || shortcutCommand.result.value.commandsOpen) throw new Error(`shortcut command failed: ${JSON.stringify(shortcutCommand.result.value)}`);
  await key(send, 'Escape', 'Escape');

  await key(send, 'k', 'KeyK', 10);
  await send('Runtime.evaluate', { expression: `(()=>{const input=document.querySelector('.command-palette input');input.value='no trail matches this';input.dispatchEvent(new Event('input',{bubbles:true}))})()` });
  const empty = await send('Runtime.evaluate', { expression: `(()=>{const dialog=document.querySelector('.command-palette');const input=dialog.querySelector('input');return {open:dialog.open,empty:!dialog.querySelector('.command-empty').hidden,count:dialog.querySelectorAll('[role="option"]').length,active:input.hasAttribute('aria-activedescendant')}})()`, returnByValue: true });
  if (!empty.result.value.open || !empty.result.value.empty || empty.result.value.count !== 0 || empty.result.value.active) throw new Error(`empty command state failed: ${JSON.stringify(empty.result.value)}`);
  await key(send, 'ArrowDown', 'ArrowDown');
  await send('Runtime.evaluate', { expression: `(()=>{const input=document.querySelector('.command-palette input');input.value='use day appearance';input.dispatchEvent(new Event('input',{bubbles:true}))})()` });
  await key(send, 'Enter', 'Enter');
  await waitFor(send, `!document.querySelector('.command-palette').open&&!portfolioOverlay.active`, 'command dialog close');
  const commandAction = await send('Runtime.evaluate', { expression: `({theme:portfolioAppearance.theme,dialog:document.querySelector('.command-palette').open,overlay:portfolioOverlay.active,status:document.querySelector('.palette-status').textContent})`, returnByValue: true });
  if (commandAction.result.value.theme !== 'day' || commandAction.result.value.dialog || commandAction.result.value.overlay || !commandAction.result.value.status.includes('Day')) throw new Error(`command execution failed: ${JSON.stringify(commandAction.result.value)}`);

  await send('Runtime.evaluate', { expression: `(()=>{window.__shared=[];window.__copied=[];Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:(value)=>{__copied.push(value);return Promise.resolve()}}});Object.defineProperty(navigator,'share',{configurable:true,value:(value)=>{__shared.push(value);return Promise.resolve()}})})()` });
  await key(send, 'k', 'KeyK', 1);
  await send('Runtime.evaluate', { expression: `(()=>{const input=document.querySelector('.command-palette input');input.value='copy page title';input.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('.command-palette [role="option"]').click()})()` });
  await key(send, 'k', 'KeyK', 1);
  await send('Runtime.evaluate', { expression: `(()=>{const dialog=document.querySelector('.command-palette');const input=dialog.querySelector('input');input.value='share page';input.dispatchEvent(new Event('input',{bubbles:true}));[...dialog.querySelectorAll('[role="option"]')].find((option)=>option.querySelector('b').textContent==='Share page').click()})()` });
  await key(send, 'k', 'KeyK', 1);
  await send('Runtime.evaluate', { expression: `(()=>{Object.defineProperty(navigator,'share',{configurable:true,value:undefined});const dialog=document.querySelector('.command-palette');const input=dialog.querySelector('input');input.value='share page';input.dispatchEvent(new Event('input',{bubbles:true}));[...dialog.querySelectorAll('[role="option"]')].find((option)=>option.querySelector('b').textContent==='Share page').click()})()` });
  const pageActions = await send('Runtime.evaluate', { expression: `({copied:__copied,shared:__shared,title:document.title,url:location.href})`, returnByValue: true });
  const pageActionValue = pageActions.result.value;
  if (pageActionValue.copied.join('|') !== `${pageActionValue.title}|${pageActionValue.url}` || pageActionValue.shared.length !== 1 || pageActionValue.shared[0].title !== pageActionValue.title || pageActionValue.shared[0].url !== pageActionValue.url) throw new Error(`page command actions failed: ${JSON.stringify(pageActionValue)}`);

  await key(send, 'k', 'KeyK', 1);
  await key(send, 'ArrowUp', 'ArrowUp');
  const wrappedLast = await send('Runtime.evaluate', { expression: `document.querySelector('.command-palette [aria-selected="true"] b').textContent`, returnByValue: true });
  await key(send, 'ArrowDown', 'ArrowDown');
  const wrappedFirst = await send('Runtime.evaluate', { expression: `document.querySelector('.command-palette [aria-selected="true"] b').textContent`, returnByValue: true });
  if (wrappedLast.result.value !== 'Reset all site preferences' || wrappedFirst.result.value !== 'Share page') throw new Error(`command keyboard wrapping failed: ${wrappedLast.result.value} -> ${wrappedFirst.result.value}`);
  await key(send, 'Escape', 'Escape');

  await send('Runtime.evaluate', { expression: `portfolioAppearancePicker.open()` });
  await key(send, 'k', 'KeyK', 1);
  const exclusiveOverlay = await send('Runtime.evaluate', { expression: `({commands:document.querySelector('.command-palette').open,pickerVisible:portfolioAppearancePicker.visible,pickerOpen:document.querySelector('.palette-picker').open,overlay:portfolioOverlay.active})`, returnByValue: true });
  if (!exclusiveOverlay.result.value.commands || exclusiveOverlay.result.value.pickerVisible || exclusiveOverlay.result.value.pickerOpen || !exclusiveOverlay.result.value.overlay) throw new Error(`overlay exclusivity failed: ${JSON.stringify(exclusiveOverlay.result.value)}`);
  await key(send, 'Escape', 'Escape');

  await send('Runtime.evaluate', { expression: `(()=>{const button=document.createElement('button');button.id='picker-return';document.body.append(button);button.focus();portfolioAppearancePicker.open()})()` });
  await send('Runtime.evaluate', { expression: `document.querySelector('main').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}))` });
  await waitFor(send, `!document.querySelector('.palette-picker').open&&!portfolioOverlay.active`, 'outside picker collapse');
  const collapsed = await send('Runtime.evaluate', { expression: `(()=>{const picker=document.querySelector('.palette-picker');return {visible:!picker.hidden,open:picker.open,overlay:portfolioOverlay.active}})()`, returnByValue: true });
  if (!collapsed.result.value.visible || collapsed.result.value.open || collapsed.result.value.overlay) throw new Error(`outside picker collapse failed: ${JSON.stringify(collapsed.result.value)}`);
  await send('Runtime.evaluate', { expression: `portfolioAppearancePicker.open()` });
  await key(send, 'Escape', 'Escape');
  const focusReturn = await send('Runtime.evaluate', { expression: `({hidden:document.querySelector('.palette-picker').hidden,focused:document.activeElement?.id})`, returnByValue: true });
  if (!focusReturn.result.value.hidden || focusReturn.result.value.focused !== 'picker-return') throw new Error(`picker focus return failed: ${JSON.stringify(focusReturn.result.value)}`);

  const glyphs = await send('Runtime.evaluate', { expression: `({eyebrows:document.querySelectorAll('.eyebrow .trail-glyph').length,arrows:document.querySelectorAll('.trail-arrow svg use').length,statusProtected:document.querySelectorAll('.eyebrow .status-dot .trail-glyph').length,principles:document.querySelectorAll('.principles .principle-glyph').length})`, returnByValue: true });
  if (glyphs.result.value.eyebrows < 4 || glyphs.result.value.arrows < 4 || glyphs.result.value.statusProtected !== 0 || glyphs.result.value.principles !== 3) throw new Error(`glyph enhancement failed: ${JSON.stringify(glyphs.result.value)}`);

  await send('Page.navigate', { url: `${server.origin}/case-studies/uddns/#confirm` });
  await waitFor(send, `document.querySelector('.case-story .is-active')?.id==='confirm'&&document.querySelectorAll('.case-route a[data-visited]').length===4&&getComputedStyle(document.querySelector('.case-route')).getPropertyValue('--case-progress').trim()==='1'`, 'case-study hash state');
  await key(send, 'k', 'KeyK', 1);
  const caseCommands = await send('Runtime.evaluate', { expression: `(()=>{const dialog=document.querySelector('.command-palette');return [...dialog.querySelectorAll('[role="option"] b')].map((item)=>item.textContent)})()`, returnByValue: true });
  for (const label of ['Next project','Next case-study section','Previous case-study section','Copy link to current section','Copy current repository URL','Open next project repository','Return to project index','Toggle reduced motion']) if (!caseCommands.result.value.includes(label)) throw new Error(`missing contextual command: ${label}`);
  await key(send, 'Escape', 'Escape');
  const confirm = await send('Runtime.evaluate', { expression: `({active:document.querySelector('.case-story .is-active')?.id,visited:[...document.querySelectorAll('.case-route a[data-visited]')].length,progress:getComputedStyle(document.querySelector('.case-route')).getPropertyValue('--case-progress').trim()})`, returnByValue: true });
  if (confirm.result.value.active !== 'confirm' || confirm.result.value.visited !== 4 || confirm.result.value.progress !== '1') throw new Error(`case-study confirm state failed: ${JSON.stringify(confirm.result.value)}`);
  await send('Runtime.evaluate', { expression: `location.hash='#cause'` });
  await waitFor(send, `document.querySelector('.case-story .is-active')?.id==='cause'`, 'case-study hash transition');
  const cause = await send('Runtime.evaluate', { expression: `({visited:[...document.querySelectorAll('.case-route a[data-visited]')].length,progress:getComputedStyle(document.querySelector('.case-route')).getPropertyValue('--case-progress').trim()})`, returnByValue: true });
  if (cause.result.value.visited !== 2 || Number(cause.result.value.progress) < .32 || Number(cause.result.value.progress) > .34) throw new Error(`case-study cause state failed: ${JSON.stringify(cause.result.value)}`);

  const rapidHash = await send('Runtime.evaluate', {
    expression: `new Promise((resolve)=>{location.hash='#confirm';location.hash='#cause';requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve({hash:location.hash,active:document.querySelector('.case-story .is-active')?.id}))))})`,
    awaitPromise: true,
    returnByValue: true,
  });
  if (rapidHash.result.value.hash !== '#cause' || rapidHash.result.value.active !== 'cause') {
    throw new Error(`rapid case-study hash transition failed: ${JSON.stringify(rapidHash.result.value)}`);
  }

  console.log('Interaction contract passed command, shortcut, picker, glyph, and case-study behaviors.');
} finally {
  await browser?.close();
  await server.close();
}
