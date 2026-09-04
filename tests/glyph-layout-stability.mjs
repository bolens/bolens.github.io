import { resolve } from 'node:path';
import { startBrowser } from './lib/cdp-browser.mjs';
import { navigate, waitFor } from './lib/browser-test.mjs';
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
    window.__glyphLayoutDone=false;
    const selectors=['.hero-actions .button','.nav-cta','.text-link','.project-link h3','.eyebrow','.principles li','.work-tools','.index-list>a','.case-facts a','.case-next a'];
    const sample=()=>{
      const values={};
      for(const selector of selectors){const element=document.querySelector(selector);if(!element)continue;const box=element.getBoundingClientRect();values[selector]=[box.width,box.height]}
      window.__glyphLayoutFrames.push(values);
    };
    const observed=new Set();
    const resizeObserver=new ResizeObserver(sample);
    const observeTargets=()=>{for(const selector of selectors){const element=document.querySelector(selector);if(element&&!observed.has(element)){observed.add(element);resizeObserver.observe(element)}}};
    const mutationObserver=new MutationObserver(()=>{observeTargets();sample()});
    mutationObserver.observe(document,{childList:true,subtree:true});
    addEventListener('load',()=>document.fonts.ready.then(()=>requestAnimationFrame(()=>requestAnimationFrame(()=>{observeTargets();sample();mutationObserver.disconnect();resizeObserver.disconnect();window.__glyphLayoutDone=true}))));
  ` });

  for (const route of ['/', '/about/', '/work/', '/case-studies/uddns/']) {
    await navigate(send, `${server.origin}${route}`);
    await waitFor(send, 'window.__glyphLayoutDone===true', `${route} layout sampling`, 5_000);
    const result = await send('Runtime.evaluate', { expression: `(()=>{const dimensions={};for(const frame of window.__glyphLayoutFrames){for(const [selector,size] of Object.entries(frame))(dimensions[selector]??=[]).push(size)}return {loading:document.documentElement.classList.contains('is-loading'),dimensions:Object.fromEntries(Object.entries(dimensions).map(([selector,sizes])=>{const widths=sizes.map(([width])=>width);const heights=sizes.map(([,height])=>height);return [selector,{widthDelta:Math.max(...widths)-Math.min(...widths),heightDelta:Math.max(...heights)-Math.min(...heights)}]}))}})()`, returnByValue: true });
    if (result.result.value.loading) throw new Error(`${route} retained its loading state after resources completed`);
    const unstable = Object.entries(result.result.value.dimensions).filter(([, delta]) => delta.widthDelta > .5 || delta.heightDelta > .5);
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
  await browser.close();
  await server.close();
}
