import { resolve } from 'node:path';
import { startBrowser } from './lib/cdp-browser.mjs';
import { startSiteServer } from './lib/site-server.mjs';

const root = resolve(import.meta.dirname, '..');
const server = await startSiteServer(root);
const { origin } = server;
let browser;

const pause = (duration = 100) => new Promise((done) => setTimeout(done, duration));

try {
  browser = await startBrowser(() => {});
  const { send } = browser;
  await Promise.all(['Page.enable', 'Runtime.enable'].map((method) => send(method)));

  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
  await send('Page.navigate', { url: `${origin}/` });
  await pause();
  await send('Runtime.evaluate', { expression: `localStorage.setItem('portfolio-palette','glacier')` });
  await send('Page.navigate', { url: `${origin}/?palette=alpine` });
  await pause();

  const preview = await send('Runtime.evaluate', {
    expression: `(()=>{
      let changes=0;
      addEventListener('portfolio-appearance-change',()=>changes++);
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
  await pause();
  const autoLight = await send('Runtime.evaluate', {
    expression: `({theme:portfolioAppearance.theme,resolved:portfolioAppearance.resolvedTheme,color:document.querySelector('meta[name="theme-color"]:not([media])')?.content})`,
    returnByValue: true,
  });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] });
  await pause(50);
  const autoDark = await send('Runtime.evaluate', {
    expression: `({theme:portfolioAppearance.theme,resolved:portfolioAppearance.resolvedTheme,color:document.querySelector('meta[name="theme-color"]:not([media])')?.content})`,
    returnByValue: true,
  });
  const light = autoLight.result.value;
  const dark = autoDark.result.value;
  if (light.theme !== 'auto' || light.resolved !== 'day' || light.color !== '#eaf1f4' || dark.resolved !== 'night' || dark.color !== '#10232f') {
    throw new Error(`automatic theme resolution failed: ${JSON.stringify({ light, dark })}`);
  }

  await send('Page.navigate', { url: `${origin}/` });
  await pause();
  const cleared = await send('Runtime.evaluate', {
    expression: `(()=>{dispatchEvent(new StorageEvent('storage',{key:'portfolio-palette',newValue:null}));dispatchEvent(new StorageEvent('storage',{key:'portfolio-theme',newValue:null}));return {palette:portfolioAppearance.palette,theme:portfolioAppearance.theme,checked:document.querySelector('input[name="portfolio-palette"]:checked')?.value}})()`,
    returnByValue: true,
  });
  if (cleared.result.value.palette !== 'glacier' || cleared.result.value.theme !== 'auto' || cleared.result.value.checked !== 'glacier') {
    throw new Error(`cleared preference synchronization failed: ${JSON.stringify(cleared.result.value)}`);
  }

  console.log('Theme smoke passed URL previews, cross-tab synchronization, cleared preferences, and automatic system color changes.');
} finally {
  browser?.close();
  server.close();
}
