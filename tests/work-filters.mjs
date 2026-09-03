import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { startBrowser } from './lib/cdp-browser.mjs';
import { startSiteServer } from './lib/site-server.mjs';

const root = resolve(import.meta.dirname, '..');
const captureEvidence = process.argv.includes('--capture-evidence');
const server = await startSiteServer(root);
const { origin } = server;
let browser;
const documentRepositories = [
  'https://github.com/bolens/uddns',
  'https://github.com/bolens/aur-response-toolkit',
  'https://github.com/bolens/launch-layer',
  'https://github.com/bolens/millennium-helpers',
  'https://github.com/bolens/omarchy-privacy-devices',
  'https://github.com/bolens/omarchy-p2p-services',
  'https://github.com/bolens/omarchy-app-drawer',
  'https://github.com/bolens/omarchy-multi-monitor-workspaces',
];

const pause = (duration = 50) => new Promise((done) => setTimeout(done, duration));
const waitFor = async (send, expression, description) => {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true });
    if (result.result.value) return result.result.value;
    await pause();
  }
  throw new Error(`timed out waiting for ${description}`);
};

try {
  browser = await startBrowser(() => {});
  const { send } = browser;
  await Promise.all(['Page.enable', 'Runtime.enable'].map((method) => send(method)));
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: `${origin}/work/` });
  await waitFor(send, `document.readyState==='complete'&&!!document.querySelector('.work-tools')`, 'work controls');
  const repositories = [...Array(8)].map((_, index) => ({
    html_url: documentRepositories[index],
    pushed_at: new Date(Date.UTC(2026, index, index + 1)).toISOString(),
  }));
  await send('Runtime.evaluate', { expression: `localStorage.setItem('portfolio-project-updates-v1',${JSON.stringify(JSON.stringify({ savedAt: Date.now(), repositories }))})` });
  await send('Page.reload');
  await waitFor(send, `document.querySelector('.work-tools')?.dataset.updates==='live'`, 'cached live update dates');

  const initial = await send('Runtime.evaluate', { expression: `(()=>({items:document.querySelectorAll('.index-list>a').length,languages:[...document.querySelectorAll('[name="project-language"] option')].map((option)=>option.textContent),dates:document.querySelectorAll('.project-updated').length}))()`, returnByValue: true });
  if (initial.result.value.items !== 8 || initial.result.value.languages.length !== 7 || initial.result.value.dates !== 8) throw new Error(`initial work index failed: ${JSON.stringify(initial.result.value)}`);

  const filtered = await send('Runtime.evaluate', { expression: `(()=>{const set=(name,value)=>{const control=document.querySelector('[name="'+name+'"]');control.value=value;control.dispatchEvent(new Event('change',{bubbles:true}))};set('project-language','qml');set('project-kind','repository');const search=document.querySelector('[name="project-search"]');search.value='drawer';search.dispatchEvent(new Event('input',{bubbles:true}));return {visible:[...document.querySelectorAll('.index-list>a:not([hidden]) b')].map((item)=>item.textContent),status:document.querySelector('.work-results').textContent,url:location.search}})()`, returnByValue: true });
  if (filtered.result.value.visible.join() !== 'App Drawer' || !filtered.result.value.status.includes('1 of 8') || !filtered.result.value.url.includes('language=qml')) throw new Error(`combined work filters failed: ${JSON.stringify(filtered.result.value)}`);

  await send('Runtime.evaluate', { expression: `document.querySelector('.work-reset').click()` });
  const sorted = await send('Runtime.evaluate', { expression: `(()=>{const sort=document.querySelector('[name="project-sort"]');sort.value='updated';sort.dispatchEvent(new Event('change',{bubbles:true}));return {first:document.querySelector('.index-list>a b').textContent,sort:sort.value,status:document.querySelector('.work-results').textContent,focus:document.activeElement.name}})()`, returnByValue: true });
  if (sorted.result.value.first !== 'Multi-Monitor Workspaces' || sorted.result.value.sort !== 'updated' || !sorted.result.value.status.includes('8 of 8')) throw new Error(`live update sort failed: ${JSON.stringify(sorted.result.value)}`);

  if (captureEvidence) {
    for (const [width, height, name] of [[1440, 1000, 'desktop'], [390, 844, 'mobile']]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 });
      await send('Runtime.evaluate', { expression: `document.querySelector('.work-tools').scrollIntoView({block:'start'})` });
      await pause(100);
      const capture = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
      writeFileSync(`/tmp/bolens-work-filters-${name}.png`, Buffer.from(capture.data, 'base64'));
    }
  }
  console.log('Work filters passed search, language, type, URL state, reset, live dates, and recently updated sorting.');
} finally {
  await browser?.close();
  await server.close();
}
