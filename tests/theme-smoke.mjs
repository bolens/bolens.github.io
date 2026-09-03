import { resolve } from 'node:path';
import { startBrowser } from './lib/cdp-browser.mjs';
import { startSiteServer } from './lib/site-server.mjs';

const root = resolve(import.meta.dirname, '..');
const server = await startSiteServer(root);
const { origin } = server;
let browser;

const pause = (duration = 100) => new Promise((done) => setTimeout(done, duration));
const waitFor = async (send, expression, description = expression, timeout = 10_000) => {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const ready = await send('Runtime.evaluate', { expression, returnByValue: true });
    if (ready.result.value) return ready.result.value;
    await pause(50);
  }
  throw new Error(`timed out waiting for ${description} after ${timeout}ms`);
};

try {
  browser = await startBrowser(() => {});
  const { send } = browser;
  await Promise.all(['Page.enable', 'Runtime.enable'].map((method) => send(method)));

  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
  await send('Page.navigate', { url: `${origin}/` });
  await waitFor(send, `document.readyState==='complete'`, 'initial page load');
  await send('Runtime.evaluate', { expression: `localStorage.setItem('portfolio-palette','glacier')` });
  await send('Page.navigate', { url: `${origin}/?palette=alpine` });
  await waitFor(send, `!!window.portfolioAppearancePicker`);

  const preview = await send('Runtime.evaluate', {
    expression: `(()=>{
      let changes=0;
      portfolioAppearance.subscribe(()=>changes++);
      dispatchEvent(new StorageEvent('storage',{key:'portfolio-palette',newValue:'coast'}));
      dispatchEvent(new StorageEvent('storage',{key:'portfolio-theme',newValue:'night'}));
      return {
        active:portfolioAppearance.palette,
        saved:localStorage.getItem('portfolio-palette'),
        theme:portfolioAppearance.theme,
        paletteChecked:document.querySelector('input[name="portfolio-palette"]:checked')?.value,
        themeChecked:document.querySelector('input[name="portfolio-theme"]:checked')?.value,
        changes,
      };
    })()`,
    returnByValue: true,
  });
  const previewValue = preview.result.value;
  if (previewValue.active !== 'alpine' || previewValue.saved !== 'glacier' || previewValue.theme !== 'night' || previewValue.paletteChecked !== 'alpine' || previewValue.themeChecked !== 'night' || previewValue.changes !== 1) {
    throw new Error(`appearance synchronization failed: ${JSON.stringify(previewValue)}`);
  }

  await send('Runtime.evaluate', { expression: `localStorage.removeItem('portfolio-theme')` });
  await send('Page.navigate', { url: `${origin}/missing-theme-check` });
  await waitFor(send, `!!window.portfolioAppearancePicker`);
  const autoLight = await send('Runtime.evaluate', {
    expression: `({theme:portfolioAppearance.theme,resolved:portfolioAppearance.resolvedTheme,colors:[...document.querySelectorAll('meta[name="theme-color"]')].map((meta)=>meta.content)})`,
    returnByValue: true,
  });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] });
  await waitFor(send, `portfolioAppearance.resolvedTheme==='night'`, 'automatic dark appearance');
  const autoDark = await send('Runtime.evaluate', {
    expression: `({theme:portfolioAppearance.theme,resolved:portfolioAppearance.resolvedTheme,colors:[...document.querySelectorAll('meta[name="theme-color"]')].map((meta)=>meta.content)})`,
    returnByValue: true,
  });
  const light = autoLight.result.value;
  const dark = autoDark.result.value;
  if (light.theme !== 'auto' || light.resolved !== 'day' || light.colors.join('|') !== '#eaf1f4|#10232f' || dark.resolved !== 'night' || dark.colors.join('|') !== '#eaf1f4|#10232f') {
    throw new Error(`automatic theme resolution failed: ${JSON.stringify({ light, dark })}`);
  }

  await send('Page.navigate', { url: `${origin}/` });
  await waitFor(send, `!!window.portfolioAppearancePicker`);
  const cleared = await send('Runtime.evaluate', {
    expression: `(()=>{dispatchEvent(new StorageEvent('storage',{key:'portfolio-palette',newValue:null}));dispatchEvent(new StorageEvent('storage',{key:'portfolio-theme',newValue:null}));return {palette:portfolioAppearance.palette,theme:portfolioAppearance.theme,checked:document.querySelector('input[name="portfolio-palette"]:checked')?.value}})()`,
    returnByValue: true,
  });
  if (cleared.result.value.palette !== 'glacier' || cleared.result.value.theme !== 'auto' || cleared.result.value.checked !== 'glacier') {
    throw new Error(`cleared preference synchronization failed: ${JSON.stringify(cleared.result.value)}`);
  }

  await send('Emulation.setEmulatedMedia', { features: [
    { name: 'prefers-color-scheme', value: 'light' },
    { name: 'prefers-contrast', value: 'more' },
  ] });
  await send('Runtime.evaluate', { expression: `portfolioAppearance.setPalette('desert');portfolioAppearance.setTheme('day')` });
  const contrastLight = await send('Runtime.evaluate', {
    expression: `(()=>{const style=getComputedStyle(document.documentElement);return {muted:style.getPropertyValue('--muted').trim(),line:style.getPropertyValue('--line').trim()}})()`,
    returnByValue: true,
  });
  await send('Emulation.setEmulatedMedia', { features: [
    { name: 'prefers-color-scheme', value: 'dark' },
    { name: 'prefers-contrast', value: 'more' },
  ] });
  await send('Runtime.evaluate', { expression: `portfolioAppearance.setTheme('night')` });
  const contrastDark = await send('Runtime.evaluate', {
    expression: `(()=>{const style=getComputedStyle(document.documentElement);return {muted:style.getPropertyValue('--muted').trim(),line:style.getPropertyValue('--line').trim()}})()`,
    returnByValue: true,
  });
  if (contrastLight.result.value.muted !== '#2e4442' || contrastLight.result.value.line !== '#718784' || contrastDark.result.value.muted !== '#d4dedb' || contrastDark.result.value.line !== '#78908c') {
    throw new Error(`increased contrast tokens failed: ${JSON.stringify({ light: contrastLight.result.value, dark: contrastDark.result.value })}`);
  }

  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
  await send('Runtime.evaluate', { expression: `localStorage.setItem('portfolio-palette','toString');localStorage.setItem('portfolio-theme','sepia')` });
  await send('Page.navigate', { url: `${origin}/?palette=__proto__` });
  await waitFor(send, `!!window.portfolioAppearancePicker`);
  const invalid = await send('Runtime.evaluate', {
    expression: `({palette:portfolioAppearance.palette,theme:portfolioAppearance.theme,rootPalette:document.documentElement.dataset.palette,rootTheme:document.documentElement.dataset.theme||'auto'})`,
    returnByValue: true,
  });
  if (invalid.result.value.palette !== 'glacier' || invalid.result.value.theme !== 'auto' || invalid.result.value.rootPalette !== 'glacier' || invalid.result.value.rootTheme !== 'auto') {
    throw new Error(`invalid preference fallback failed: ${JSON.stringify(invalid.result.value)}`);
  }

  const explicitColors = await send('Runtime.evaluate', {
    expression: `(()=>{const read=()=>[...document.querySelectorAll('meta[name="theme-color"]')].map((meta)=>meta.content);portfolioAppearance.setPalette('coast');portfolioAppearance.setTheme('day');const day=read();portfolioAppearance.setTheme('night');return {day,night:read()}})()`,
    returnByValue: true,
  });
  if (explicitColors.result.value.day.some((color) => color !== '#e8f0ef') || explicitColors.result.value.night.some((color) => color !== '#102326')) {
    throw new Error(`explicit theme-color synchronization failed: ${JSON.stringify(explicitColors.result.value)}`);
  }

  const automaticPalettes = [];
  for (const palette of ['alpine', 'desert', 'glacier', 'signal', 'forest', 'coast', 'meadow', 'volcanic']) {
    await send('Runtime.evaluate', { expression: `portfolioAppearance.setPalette('${palette}');portfolioAppearance.setTheme('auto')` });
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
    const day = await send('Runtime.evaluate', { expression: `getComputedStyle(document.documentElement).getPropertyValue('--paper').trim()`, returnByValue: true });
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] });
    const night = await send('Runtime.evaluate', { expression: `getComputedStyle(document.documentElement).getPropertyValue('--paper').trim()`, returnByValue: true });
    automaticPalettes.push({ palette, day: day.result.value, night: night.result.value });
  }
  if (automaticPalettes.some(({ day, night }) => !day || !night || day === night)) {
    throw new Error(`automatic palette matrix failed: ${JSON.stringify(automaticPalettes)}`);
  }

  const overlayComposition = await send('Runtime.evaluate', {
    expression: `(()=>{const changes=[];const record=(event)=>changes.push(event.detail.active);addEventListener('ui-overlay-change',record);portfolioOverlay.set('commands',true);portfolioOverlay.set('appearance',true);portfolioOverlay.set('commands',false);const shared=document.documentElement.classList.contains('ui-overlay-open');portfolioOverlay.set('appearance',false);removeEventListener('ui-overlay-change',record);return {shared,closed:!document.documentElement.classList.contains('ui-overlay-open'),changes}})()`,
    returnByValue: true,
  });
  const overlayValue = overlayComposition.result.value;
  if (!overlayValue.shared || !overlayValue.closed || overlayValue.changes.join('|') !== 'true|false') {
    throw new Error(`overlay composition failed: ${JSON.stringify(overlayValue)}`);
  }

  const atomicReset = await send('Runtime.evaluate', {
    expression: `(()=>{portfolioAppearance.setPalette('desert');portfolioAppearance.setTheme('night');const states=[];const unsubscribe=portfolioAppearance.subscribe((state)=>states.push(state));portfolioAppearance.reset();unsubscribe();portfolioAppearance.setTheme('day');return {states,savedPalette:localStorage.getItem('portfolio-palette'),savedTheme:localStorage.getItem('portfolio-theme')}})()`,
    returnByValue: true,
  });
  const resetValue = atomicReset.result.value;
  if (resetValue.states.length !== 1 || resetValue.states[0].palette !== 'glacier' || resetValue.states[0].theme !== 'auto' || resetValue.savedPalette !== 'glacier' || resetValue.savedTheme !== 'day') {
    throw new Error(`atomic appearance reset failed: ${JSON.stringify(resetValue)}`);
  }

  const blockedStorageScript = await send('Page.addScriptToEvaluateOnNewDocument', { source: `
    Storage.prototype.getItem=()=>{throw new DOMException('blocked','SecurityError')};
    Storage.prototype.setItem=()=>{throw new DOMException('blocked','SecurityError')};
  ` });
  await send('Page.navigate', { url: `${origin}/` });
  await waitFor(send, `!!window.portfolioAppearancePicker`, 'blocked-storage appearance startup');
  const blockedStorage = await send('Runtime.evaluate', {
    expression: `(()=>{portfolioAppearance.setPalette('coast');portfolioAppearance.setTheme('night');return {palette:portfolioAppearance.palette,theme:portfolioAppearance.theme,rootPalette:document.documentElement.dataset.palette,rootTheme:document.documentElement.dataset.theme}})()`,
    returnByValue: true,
  });
  await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: blockedStorageScript.identifier });
  if (blockedStorage.result.value.palette !== 'coast' || blockedStorage.result.value.theme !== 'night' || blockedStorage.result.value.rootPalette !== 'coast' || blockedStorage.result.value.rootTheme !== 'night') {
    throw new Error(`blocked storage fallback failed: ${JSON.stringify(blockedStorage.result.value)}`);
  }

  await send('Emulation.setScriptExecutionDisabled', { value: true });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] });
  await send('Page.navigate', { url: `${origin}/?palette=alpine` });
  await waitFor(send, `document.readyState==='complete'`, 'no-JavaScript page load');
  const noScript = await send('Runtime.evaluate', {
    expression: `(()=>{const style=getComputedStyle(document.documentElement);return {palette:document.documentElement.dataset.palette||'',theme:document.documentElement.dataset.theme||'',paper:style.getPropertyValue('--paper').trim(),accent:style.getPropertyValue('--copper').trim(),picker:!!document.querySelector('.palette-picker')}})()`,
    returnByValue: true,
  });
  await send('Emulation.setScriptExecutionDisabled', { value: false });
  if (noScript.result.value.palette || noScript.result.value.theme || noScript.result.value.paper !== '#10232f' || noScript.result.value.accent !== '#70bce2' || noScript.result.value.picker) {
    throw new Error(`no-JavaScript fallback failed: ${JSON.stringify(noScript.result.value)}`);
  }

  console.log('Theme smoke passed preference and storage fallbacks, metadata, atomic state transitions, synchronization, automatic palettes, overlay composition, increased contrast, and no-JavaScript defaults.');
} finally {
  browser?.close();
  await server.close();
}
