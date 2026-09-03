import { resolve } from 'node:path';
import { startBrowser } from './lib/cdp-browser.mjs';
import { startSiteServer } from './lib/site-server.mjs';

const root = resolve(import.meta.dirname, '..');
const server = await startSiteServer(root);
const browser = await startBrowser(() => {});
const { send } = browser;

try {
  await Promise.all(['Page.enable', 'Runtime.enable', 'Network.enable'].map((method) => send(method)));
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `
    window.__glyphLayoutFrames=[];
    const selectors=['.hero-actions .button','.nav-cta','.text-link','.project-link h3','.eyebrow','.principles li','.work-tools','.index-list>a','.case-facts a','.case-next a'];
    const sample=()=>{
      const values={};
      for(const selector of selectors){const element=document.querySelector(selector);if(!element)continue;const box=element.getBoundingClientRect();values[selector]=[box.width,box.height]}
      window.__glyphLayoutFrames.push(values);
      if(performance.now()<1400)requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  ` });

  for (const route of ['/', '/about/', '/work/', '/case-studies/uddns/']) {
    await send('Page.navigate', { url: `${server.origin}${route}` });
    await new Promise((done) => setTimeout(done, 1500));
    const result = await send('Runtime.evaluate', { expression: `(()=>{const dimensions={};for(const frame of window.__glyphLayoutFrames){for(const [selector,size] of Object.entries(frame))(dimensions[selector]??=[]).push(size)}return {loading:document.documentElement.classList.contains('is-loading'),dimensions:Object.fromEntries(Object.entries(dimensions).map(([selector,sizes])=>{const widths=sizes.map(([width])=>width);const heights=sizes.map(([,height])=>height);return [selector,{widthDelta:Math.max(...widths)-Math.min(...widths),heightDelta:Math.max(...heights)-Math.min(...heights)}]}))}})()`, returnByValue: true });
    if (result.result.value.loading) throw new Error(`${route} retained its loading state after resources completed`);
    const unstable = Object.entries(result.result.value.dimensions).filter(([, delta]) => delta.widthDelta > .5 || delta.heightDelta > .5);
    if (unstable.length) throw new Error(`${route} glyph initialization shifted layout: ${JSON.stringify(Object.fromEntries(unstable))}`);
  }
  console.log('Glyph layout stability passed buttons, links, headings, principles, work rows, and case-study navigation.');
} finally {
  await browser.close();
  await server.close();
}
