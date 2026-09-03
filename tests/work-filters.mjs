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
    ...(index === 0
      ? { updated_at: new Date(Date.UTC(2026, index, index + 1)).toISOString() }
      : { pushed_at: new Date(Date.UTC(2026, index, index + 1)).toISOString() }),
  }));
  await send('Runtime.evaluate', { expression: `localStorage.setItem('portfolio-project-updates-v1',${JSON.stringify(JSON.stringify({ savedAt: Date.now(), repositories }))})` });
  await send('Page.reload');
  await waitFor(send, `document.querySelector('.work-tools')?.dataset.updates==='live'`, 'cached live update dates');

  const initial = await send('Runtime.evaluate', { expression: `(()=>({items:document.querySelectorAll('.index-list>a').length,languages:[...document.querySelectorAll('[name="project-language"] option')].map((option)=>option.textContent),dates:document.querySelectorAll('.project-updated').length}))()`, returnByValue: true });
  if (initial.result.value.items !== 8 || initial.result.value.languages.length !== 7 || initial.result.value.dates !== 8) throw new Error(`initial work index failed: ${JSON.stringify(initial.result.value)}`);
  const resolvedDates = await send('Runtime.evaluate', { expression: `(()=>({resolved:document.querySelectorAll('.project-updated.is-resolved').length,unavailable:document.querySelectorAll('.project-updated.is-unavailable').length,exposed:[...document.querySelectorAll('.project-updated')].every((time)=>!time.hasAttribute('aria-hidden')&&time.dateTime)}))()`, returnByValue: true });
  if (resolvedDates.result.value.resolved !== 8 || resolvedDates.result.value.unavailable !== 0 || !resolvedDates.result.value.exposed) throw new Error(`resolved date accessibility state failed: ${JSON.stringify(resolvedDates.result.value)}`);

  const filtered = await send('Runtime.evaluate', { expression: `(()=>{const set=(name,value)=>{const control=document.querySelector('[name="'+name+'"]');control.value=value;control.dispatchEvent(new Event('change',{bubbles:true}))};set('project-language','qml');set('project-kind','repository');const search=document.querySelector('[name="project-search"]');search.value='drawer';search.dispatchEvent(new Event('input',{bubbles:true}));return {visible:[...document.querySelectorAll('.index-list>a:not([hidden]) b')].map((item)=>item.textContent),status:document.querySelector('.work-results').textContent,url:location.search}})()`, returnByValue: true });
  if (filtered.result.value.visible.join() !== 'App Drawer' || !filtered.result.value.status.includes('1 of 8') || !filtered.result.value.url.includes('language=qml')) throw new Error(`combined work filters failed: ${JSON.stringify(filtered.result.value)}`);

  await send('Runtime.evaluate', { expression: `document.querySelector('.work-reset').click()` });
  const sorted = await send('Runtime.evaluate', { expression: `(()=>{const sort=document.querySelector('[name="project-sort"]');sort.value='updated';sort.dispatchEvent(new Event('change',{bubbles:true}));return {first:document.querySelector('.index-list>a b').textContent,sort:sort.value,status:document.querySelector('.work-results').textContent,focus:document.activeElement.name}})()`, returnByValue: true });
  if (sorted.result.value.first !== 'Multi-Monitor Workspaces' || sorted.result.value.sort !== 'updated' || !sorted.result.value.status.includes('8 of 8') || sorted.result.value.focus !== 'project-search') throw new Error(`live update sort or reset focus failed: ${JSON.stringify(sorted.result.value)}`);

  const ordering = await send('Runtime.evaluate', { expression: `(()=>{const sort=document.querySelector('[name="project-sort"]');const names=()=>[...document.querySelectorAll('.index-list>a b')].map((item)=>item.textContent);const set=(value)=>{sort.value=value;sort.dispatchEvent(new Event('change',{bubbles:true}));return names()};return {ascending:set('name-asc'),descending:set('name-desc'),featured:set('featured'),url:location.search}})()`, returnByValue: true });
  const alphabetic = [...ordering.result.value.ascending].sort((left, right) => left.localeCompare(right, undefined, { sensitivity: 'base' }));
  if (ordering.result.value.ascending.join('|') !== alphabetic.join('|') || ordering.result.value.descending.join('|') !== [...alphabetic].reverse().join('|') || ordering.result.value.featured[0] !== 'uDDNS' || ordering.result.value.url) throw new Error(`name or featured ordering failed: ${JSON.stringify(ordering.result.value)}`);

  const emptyState = await send('Runtime.evaluate', { expression: `(()=>{const search=document.querySelector('[name="project-search"]');search.value='definitely absent project';search.dispatchEvent(new Event('input',{bubbles:true}));return {visible:document.querySelectorAll('.index-list>a:not([hidden])').length,empty:document.querySelector('.index-list').classList.contains('is-empty'),status:document.querySelector('.work-results').textContent,url:location.search}})()`, returnByValue: true });
  if (emptyState.result.value.visible !== 0 || !emptyState.result.value.empty || emptyState.result.value.status !== 'No projects match those filters.' || !emptyState.result.value.url.includes('q=definitely+absent+project')) throw new Error(`empty work-filter state failed: ${JSON.stringify(emptyState.result.value)}`);
  await send('Runtime.evaluate', { expression: `document.querySelector('.work-reset').click()` });

  const partialCache = JSON.stringify({ savedAt: Date.now(), repositories: repositories.slice(0, 1) });
  await send('Runtime.evaluate', { expression: `localStorage.setItem('portfolio-project-updates-v1',${JSON.stringify(partialCache)})` });
  await send('Page.reload');
  await waitFor(send, `document.querySelector('.work-tools')?.dataset.updates==='live'`, 'partial cached update dates');
  const partialDates = await send('Runtime.evaluate', { expression: `({resolved:document.querySelectorAll('.project-updated.is-resolved').length,unavailable:document.querySelectorAll('.project-updated.is-unavailable').length,enabled:!document.querySelector('[name="project-sort"] [value="updated"]').disabled})`, returnByValue: true });
  if (partialDates.result.value.resolved !== 1 || partialDates.result.value.unavailable !== 7 || !partialDates.result.value.enabled) throw new Error(`partial date state failed: ${JSON.stringify(partialDates.result.value)}`);

  await send('Runtime.evaluate', { expression: `localStorage.setItem('portfolio-project-updates-v1',${JSON.stringify(JSON.stringify({ savedAt: 0, repositories: repositories.slice(0, 1) }))})` });
  const staleFetchStub = await send('Page.addScriptToEvaluateOnNewDocument', { source: `window.__updateFetches=0;window.fetch=()=>{window.__updateFetches+=1;return Promise.reject(new Error('offline'))}` });
  await send('Page.navigate', { url: `${origin}/work/?q=privacy&language=qml&type=case%20study&sort=name-desc#projects` });
  await waitFor(send, `document.querySelector('.work-tools')?.dataset.updates==='live'&&window.__updateFetches===1`, 'stale cache refresh');
  const restored = await send('Runtime.evaluate', { expression: `(()=>({search:document.querySelector('[name="project-search"]').value,language:document.querySelector('[name="project-language"]').value,kind:document.querySelector('[name="project-kind"]').value,sort:document.querySelector('[name="project-sort"]').value,visible:[...document.querySelectorAll('.index-list>a:not([hidden]) b')].map((item)=>item.textContent),hash:location.hash,fetches:window.__updateFetches,updatedEnabled:!document.querySelector('[name="project-sort"] [value="updated"]').disabled}))()`, returnByValue: true });
  if (restored.result.value.search !== 'privacy' || restored.result.value.language !== 'qml' || restored.result.value.kind !== 'case study' || restored.result.value.sort !== 'name-desc' || restored.result.value.visible.join() !== 'Privacy Devices' || restored.result.value.hash !== '#projects' || restored.result.value.fetches !== 1 || !restored.result.value.updatedEnabled) throw new Error(`URL restoration or stale-cache refresh failed: ${JSON.stringify(restored.result.value)}`);
  await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: staleFetchStub.identifier });

  await send('Runtime.evaluate', { expression: `localStorage.removeItem('portfolio-project-updates-v1')` });
  const fetchStub = await send('Page.addScriptToEvaluateOnNewDocument', { source: `(()=>{const nativeFetch=window.fetch.bind(window);window.fetch=(url,options)=>String(url).includes('api.github.com/users/bolens/repos')?Promise.resolve({ok:true,json:()=>Promise.resolve(${JSON.stringify(repositories)})}):nativeFetch(url,options)})()` });
  await send('Page.reload');
  await waitFor(send, `document.querySelectorAll('.project-updated.is-resolved').length===8`, 'fetched update dates');
  const fetchedDates = await send('Runtime.evaluate', { expression: `(()=>{const cached=JSON.parse(localStorage.getItem('portfolio-project-updates-v1'));return {savedAt:Number.isFinite(cached.savedAt),repositories:cached.repositories.length,updates:document.querySelector('.work-tools').dataset.updates}})()`, returnByValue: true });
  if (!fetchedDates.result.value.savedAt || fetchedDates.result.value.repositories !== 8 || fetchedDates.result.value.updates !== 'live') throw new Error(`fetched date cache failed: ${JSON.stringify(fetchedDates.result.value)}`);

  await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: fetchStub.identifier });
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `window.fetch=()=>Promise.resolve({ok:false,status:403})` });
  await send('Runtime.evaluate', { expression: `localStorage.setItem('portfolio-project-updates-v1','{malformed')` });
  await send('Page.navigate', { url: `${origin}/work/?sort=updated` });
  await waitFor(send, `document.querySelector('[name="project-sort"] [value="updated"]')?.disabled&&!document.documentElement.classList.contains('is-loading')`, 'settled unavailable update dates');
  const unavailableDates = await send('Runtime.evaluate', { expression: `(()=>({unavailable:document.querySelectorAll('.project-updated.is-unavailable').length,resolved:document.querySelectorAll('.project-updated.is-resolved').length,sort:document.querySelector('[name="project-sort"]').value,url:location.search,label:document.querySelector('[name="project-sort"] [value="updated"]').textContent,loading:document.documentElement.classList.contains('is-loading')}))()`, returnByValue: true });
  if (unavailableDates.result.value.unavailable !== 8 || unavailableDates.result.value.resolved !== 0 || unavailableDates.result.value.sort !== 'featured' || unavailableDates.result.value.url || !unavailableDates.result.value.label.includes('unavailable') || unavailableDates.result.value.loading) throw new Error(`unavailable date fallback failed: ${JSON.stringify(unavailableDates.result.value)}`);

  if (captureEvidence) {
    for (const [width, height, name] of [[1440, 1000, 'desktop'], [390, 844, 'mobile']]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 });
      await send('Runtime.evaluate', { expression: `document.querySelector('.work-tools').scrollIntoView({block:'start'})` });
      await pause(100);
      const capture = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
      writeFileSync(`/tmp/bolens-work-filters-${name}.png`, Buffer.from(capture.data, 'base64'));
    }
  }
  console.log('Work filters passed filtering, sorting, resolved, partial, fetched, cached, and unavailable update states.');
} finally {
  await browser?.close();
  await server.close();
}
