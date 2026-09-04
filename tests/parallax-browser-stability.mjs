import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { startBrowser } from './lib/cdp-browser.mjs';
import { evaluate, navigate, waitFor, waitForFrames } from './lib/browser-test.mjs';
import { startSiteServer } from './lib/site-server.mjs';

const root = resolve(import.meta.dirname, '..');
const server = await startSiteServer(root);
const errors = [];
let browser;

try {
  browser = await startBrowser((message) => {
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text);
    if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') errors.push(message.params.entry.text);
    if (message.method === 'Network.loadingFailed' && !message.params.canceled) errors.push(message.params.errorText);
  });
  const { send } = browser;
  await Promise.all(['Runtime.enable', 'Network.enable', 'Log.enable'].map((method) => send(method)));

  for (const viewport of [{ width: 1440, height: 900, name: 'desktop' }, { width: 390, height: 844, name: 'phone' }]) {
    await send('Emulation.setDeviceMetricsOverride', { width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: false });
    await navigate(send, `${server.origin}/404.html`);
    await waitFor(send, `document.querySelector('.cryptid-camp.hybrid-effects-ready')&&!document.documentElement.classList.contains('is-loading')`, `${viewport.name} scene readiness`);
    const result = await evaluate(send, `new Promise(async(resolve)=>{
      const figure=document.querySelector('.cryptid-camp');
      figure.getAnimations({subtree:true}).forEach((animation)=>animation.pause());
      const subjects=[...document.querySelectorAll('.camper,.campfire,.tent-camp')];
      const subjectTransforms=()=>subjects.map((node)=>getComputedStyle(node).translate);
      const planes=[...figure.querySelectorAll('[data-parallax-plane]')];
      const baseline=subjectTransforms();
      const box=figure.getBoundingClientRect();
      const points=Array.from({length:80},(_,index)=>({x:box.left+box.width*(index%2?.92:.08),y:box.top+box.height*((index%5)/4*.84+.08)}));
      for(const point of points){figure.dispatchEvent(new PointerEvent('pointermove',{clientX:point.x,clientY:point.y,pointerType:'mouse',bubbles:true}));await new Promise(requestAnimationFrame)}
      const after=subjectTransforms();
      const transitions=planes.flatMap((node)=>node.getAnimations()).filter((animation)=>animation.constructor.name==='CSSTransition').length;
      const parallaxOffsets=()=>['back','far','mid','near'].flatMap((depth)=>['x','y'].map((axis)=>figure.style.getPropertyValue('--parallax-'+depth+'-'+axis)));
      const stableBefore=parallaxOffsets();
      const point=points.at(-1);for(let index=0;index<20;index++){figure.dispatchEvent(new PointerEvent('pointermove',{clientX:point.x,clientY:point.y,pointerType:'mouse',bubbles:true}));await new Promise(requestAnimationFrame)}
      figure.getAnimations({subtree:true}).forEach((animation)=>animation.play());
      resolve({baseline,after,planeCount:planes.length,planeMotion:planes.map((node)=>getComputedStyle(node).translate),transitions,stableBefore,stableAfter:parallaxOffsets(),density:figure.dataset.sceneDensity});
    })`, { awaitPromise: true });
    assert.equal(result.planeCount, 7);
    assert.ok(result.planeMotion.some((value) => value !== 'none' && value !== '0px'));
    assert.equal(result.transitions, 0);
    assert.deepEqual(result.stableAfter, result.stableBefore);
    assert.deepEqual(result.after, result.baseline);
    assert.equal(result.density, viewport.width <= 430 ? 'compact' : 'full');
    await waitFor(send, `Number.parseFloat(getComputedStyle(document.querySelector('.cryptid-camp')).opacity)>.99`, `${viewport.name} scene reveal`);
    await waitForFrames(send);
    const screenshot = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
    writeFileSync(`/tmp/404-parallax-${viewport.name}.png`, Buffer.from(screenshot.data, 'base64'));
  }

  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }, { name: 'prefers-reduced-motion', value: 'reduce' }] });
  await waitForFrames(send);
  const reduced = await evaluate(send, `(()=>{const figure=document.querySelector('.cryptid-camp');figure.dispatchEvent(new PointerEvent('pointerleave'));document.documentElement.dataset.motion='reduced';const box=figure.getBoundingClientRect();figure.dispatchEvent(new PointerEvent('pointermove',{clientX:box.right-1,clientY:box.bottom-1,pointerType:'mouse',bubbles:true}));const style=getComputedStyle(figure);return {tracking:figure.classList.contains('is-parallax-tracking'),offsets:['back','far','mid','near'].flatMap((depth)=>['x','y'].map((axis)=>Number.parseFloat(style.getPropertyValue('--parallax-'+depth+'-'+axis))))}})()`);
  assert.equal(reduced.tracking, false);
  assert.ok(reduced.offsets.every((value) => value === 0));
  assert.deepEqual(errors, []);
  console.log('Parallax browser stability passed repeated pointer sweeps, bounded paint planes, stationary subjects, responsive layouts, and reduced motion.');
} finally {
  await browser?.close();
  await server.close();
}
