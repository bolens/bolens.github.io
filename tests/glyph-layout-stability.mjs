import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { startBrowser } from './lib/cdp-browser.mjs';
import { navigate, waitFor } from './lib/browser-test.mjs';
import { startSiteServer } from './lib/site-server.mjs';

const root = resolve(import.meta.dirname, '..');
const server = await startSiteServer(root);
const glyphSource = readFileSync(resolve(root, 'assets/trail-glyphs.js'), 'utf8');
const sample = `(() => {
  const selectors=['.hero-actions .button','.nav-cta','.text-link','.project-link h3','.eyebrow','.principles li','.work-tools','.index-list>a','.case-facts a','.case-next a'];
  return Object.fromEntries(selectors.flatMap((selector) => [...document.querySelectorAll(selector)].map((element, index) => {
    const box=element.getBoundingClientRect();
    return [selector + ':' + index, [box.width, box.height]];
  })));
})()`;
// Sample immediately around the actual deferred enhancement script, after the
// parser and blocking stylesheets finish. Parser chunk sizes are not layout bugs.
const instrumented = `window.__glyphLayoutBefore=${sample};\n${glyphSource}\nwindow.__glyphLayoutAfter=${sample};`;
let browser;
const interceptions = [];


try {
  browser = await startBrowser((message) => {
    if (message.method === 'Fetch.requestPaused') interceptions.push(browser.send('Fetch.fulfillRequest', {
      requestId: message.params.requestId, responseCode: 200,
      responseHeaders: [{ name: 'Content-Type', value: 'text/javascript' }],
      body: Buffer.from(instrumented).toString('base64'),
    }));
  });
  const { send } = browser;
  await Promise.all(['Page.enable', 'Runtime.enable', 'Network.enable'].map((method) => send(method)));
  await send('Fetch.enable', { patterns: [{ urlPattern: '*/assets/trail-glyphs.js', requestStage: 'Request' }] });
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });

  for (const route of ['/', '/about/', '/work/', '/case-studies/uddns/']) {
    await navigate(send, `${server.origin}${route}`);
    await waitFor(send, '!!window.__glyphLayoutAfter&&!document.documentElement.classList.contains("is-loading")', `${route} layout sampling`, 5_000);
    const result = await send('Runtime.evaluate', { expression: `(() => {
      const before=window.__glyphLayoutBefore;
      const after=window.__glyphLayoutAfter;
      if (!Object.keys(before).length || document.querySelectorAll('.trail-glyph,.fact-glyph,.project-glyph').length===0) throw new Error('missing glyph layout fixtures');
      return Object.fromEntries(Object.entries(before).map(([name, size]) => {
        if (!after[name]) throw new Error('layout target disappeared: '+name);
        return [name, { widthDelta: Math.abs(after[name][0]-size[0]), heightDelta: Math.abs(after[name][1]-size[1]) }];
      }));
    })()`, returnByValue: true });
    const unstable = Object.entries(result.result.value).filter(([, delta]) => delta.widthDelta > .5 || delta.heightDelta > .5);
    if (unstable.length) throw new Error(`${route} glyph initialization shifted layout: ${JSON.stringify(Object.fromEntries(unstable))}`);

    const alignment = await send('Runtime.evaluate', { expression: `(()=>{
      const selectors=['.hero-actions .button .trail-arrow','.text-link .trail-arrow','.project-link h3 .trail-arrow','.eyebrow .trail-glyph','.principles li .principle-glyph','.case-facts a .trail-arrow','.case-next a .trail-arrow','.site-footer a .trail-arrow'];
      const textRect=(container,glyph)=>{const walker=document.createTreeWalker(container,NodeFilter.SHOW_TEXT);let node;let candidate=null;while(node=walker.nextNode()){if(glyph.contains(node)||!node.textContent.trim())continue;candidate=node}if(!candidate)return null;const end=candidate.textContent.trimEnd().length;const range=document.createRange();range.setStart(candidate,Math.max(0,end-1));range.setEnd(candidate,end);return range.getBoundingClientRect()};
      return Object.fromEntries(selectors.flatMap((selector)=>{const glyph=document.querySelector(selector);if(!glyph)return [];const container=glyph.parentElement;const text=textRect(container,glyph);if(!text)return [];const box=glyph.getBoundingClientRect();const reference=container.closest('.case-next')?container.getBoundingClientRect():text;return [[selector,Math.abs((box.top+box.height/2)-(reference.top+reference.height/2))]]}));
    })()`, returnByValue: true });
    const misaligned = Object.entries(alignment.result.value).filter(([, centerDelta]) => centerDelta > 2.5);
    if (misaligned.length) throw new Error(`${route} glyph centers missed adjacent text: ${JSON.stringify(Object.fromEntries(misaligned))}`);

    if (route === '/') {
      const skeleton = await send('Runtime.evaluate', { expression: `(()=>{const root=document.documentElement;const target=document.querySelector('.signal-map');const read=()=>{const style=getComputedStyle(target,'::after');return {content:style.content,animation:style.animationName,pointerEvents:style.pointerEvents}};const settled=read();root.classList.add('is-loading');const loading=read();root.dataset.motion='reduced';const reduced=read();root.classList.remove('is-loading');root.removeAttribute('data-motion');return {settled,loading,reduced}})()`, returnByValue: true });
      const { settled, loading, reduced } = skeleton.result.value;
      if (settled.content !== 'none' || loading.content === 'none' || loading.animation !== 'skeleton-trace' || loading.pointerEvents !== 'none' || reduced.animation !== 'none') throw new Error(`visual skeleton states failed: ${JSON.stringify(skeleton.result.value)}`);
    }

    if (route === '/work/') {
      const textSkeleton = await send('Runtime.evaluate', { expression: `(()=>{const time=document.querySelector('.project-updated');time.className='project-updated';const read=()=>{const style=getComputedStyle(time);return {width:style.width,color:style.color,background:style.backgroundImage,animation:style.animationName,visibility:style.visibility}};const pending=read();time.classList.add('is-resolved');const resolved=read();time.className='project-updated is-unavailable';const unavailable=read();return {pending,resolved,unavailable}})()`, returnByValue: true });
      const { pending, resolved, unavailable } = textSkeleton.result.value;
      if (pending.width === 'auto' || pending.color !== 'rgba(0, 0, 0, 0)' || pending.background === 'none' || pending.animation !== 'skeleton-text' || resolved.background !== 'none' || resolved.animation !== 'none' || resolved.color === 'rgba(0, 0, 0, 0)' || unavailable.visibility !== 'hidden') throw new Error(`text skeleton states failed: ${JSON.stringify(textSkeleton.result.value)}`);
    }
  }
  console.log('Layout stability passed reserved sizing, optical glyph centering, and skeleton state transitions.');
} finally {
  await browser?.close();
  await Promise.all(interceptions);
  await server.close();
}
