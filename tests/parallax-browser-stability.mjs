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
      const points=Array.from({length:24},(_,index)=>({x:box.left+box.width*(index%2?.92:.08),y:box.top+box.height*((index%5)/4*.84+.08)}));
      for(const point of points){figure.dispatchEvent(new PointerEvent('pointermove',{clientX:point.x,clientY:point.y,pointerType:'mouse',bubbles:true}));await new Promise(requestAnimationFrame)}
      const after=subjectTransforms();
      const transitions=planes.flatMap((node)=>node.getAnimations()).filter((animation)=>animation.constructor.name==='CSSTransition').length;
      const parallaxOffsets=()=>['back','far','mid','near'].flatMap((depth)=>['x','y'].map((axis)=>figure.style.getPropertyValue('--parallax-'+depth+'-'+axis)));
      const stableBefore=parallaxOffsets();
      const point=points.at(-1);for(let index=0;index<8;index++){figure.dispatchEvent(new PointerEvent('pointermove',{clientX:point.x,clientY:point.y,pointerType:'mouse',bubbles:true}));await new Promise(requestAnimationFrame)}
      figure.getAnimations({subtree:true}).forEach((animation)=>animation.play());
      const canvas=figure.querySelector('.camp-atmosphere');
      resolve({baseline,after,planeCount:planes.length,planeMotion:planes.map((node)=>getComputedStyle(node).translate),transitions,stableBefore,stableAfter:parallaxOffsets(),density:figure.dataset.sceneDensity,renderTier:figure.dataset.renderTier,expectedTier:portfolio404Renderer.tierForWidth(figure.clientWidth),animationCount:figure.getAnimations({subtree:true}).length,canvasPixels:canvas.width*canvas.height,displayPixels:Math.round(figure.clientWidth*figure.clientHeight)});
    })`, { awaitPromise: true });
    assert.equal(result.planeCount, 7);
    assert.ok(result.planeMotion.some((value) => value !== 'none' && value !== '0px'));
    assert.equal(result.transitions, 0);
    assert.deepEqual(result.stableAfter, result.stableBefore);
    assert.deepEqual(result.after, result.baseline);
    assert.equal(result.density, viewport.width <= 430 ? 'compact' : 'full');
    assert.equal(result.renderTier, result.expectedTier);
    assert.ok(result.animationCount <= ({ minimal:11, balanced:14, full:14 })[result.renderTier], `runtime animation budget exceeded: ${result.animationCount}`);
    assert.ok(result.canvasPixels <= result.displayPixels * ({ minimal:.26, balanced:.5, full:.65 })[result.renderTier], `canvas pixel budget exceeded: ${result.canvasPixels}/${result.displayPixels}`);
    await waitFor(send, `Number.parseFloat(getComputedStyle(document.querySelector('.cryptid-camp')).opacity)>.99`, `${viewport.name} scene reveal`);
    await waitForFrames(send);
    const screenshot = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
    writeFileSync(`/tmp/404-parallax-${viewport.name}.png`, Buffer.from(screenshot.data, 'base64'));
    if (viewport.name === 'desktop') {
      const motionMatrix = await evaluate(send, `(async()=>{const result={};for(const time of ['day','night','morning','evening','twilight'])for(const condition of ['clear','cloudy','misty','overcast','rainy','wet','dry','snowy','drought','windy']){portfolioSceneTime.setTime(time);portfolioWeather.setLocationCondition(condition);await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);result[time+'-'+condition]=document.querySelector('.cryptid-camp').getAnimations({subtree:true}).filter((animation)=>animation.playState==='running').length}return result})()`, { awaitPromise:true });
      assert.ok(Math.max(...Object.entries(motionMatrix).filter(([name])=>!name.endsWith('-windy')).map(([,count])=>count)) <= 15, `standard motion budget exceeded: ${JSON.stringify(motionMatrix)}`);
      assert.ok(Math.max(...Object.entries(motionMatrix).filter(([name])=>name.endsWith('-windy')).map(([,count])=>count)) <= 20, `wind motion budget exceeded: ${JSON.stringify(motionMatrix)}`);
      const rainLayering = await evaluate(send, `(()=>{
        portfolioWeather.setLocationCondition('rainy');
        const rain=document.querySelector('.weather-rain');
        const mountains=[...document.querySelectorAll('.mountain-range')];
        return {
          rainAfterTerrain:[...rain.ownerSVGElement.children].indexOf(rain)>Math.max(...mountains.map((node)=>[...node.ownerSVGElement.children].indexOf(node))),
          mountainOpacity:mountains.map((node)=>getComputedStyle(node).opacity),
        };
      })()`);
      assert.equal(rainLayering.rainAfterTerrain, true);
      assert.ok(rainLayering.mountainOpacity.every((value) => value === '1'));
      await waitForFrames(send);
      const rainyScreenshot = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
      writeFileSync('/tmp/404-rain-desktop.png', Buffer.from(rainyScreenshot.data, 'base64'));
      const snowLayering = await evaluate(send, `(()=>{
        portfolioWeather.setLocationCondition('snowy');
        const snow=document.querySelector('.weather-snow');
        const animation=snow.getAnimations().find((item)=>item.animationName==='weather-snow-drift');
        animation.pause();animation.currentTime=0;const start=getComputedStyle(snow).translate;
        animation.currentTime=3750;const middle=getComputedStyle(snow).translate;
        return {
          start,middle,
          flakes:document.querySelector('#snow-field').querySelectorAll('circle').length,
          rainStrokes:document.querySelector('#rain-field').querySelectorAll('path').length,
          front:[...snow.ownerSVGElement.children].indexOf(snow)>Math.max(...[...document.querySelectorAll('.mountain-range')].map((node)=>[...node.ownerSVGElement.children].indexOf(node))),
        };
      })()`);
      assert.notEqual(snowLayering.start, snowLayering.middle);
      assert.ok(snowLayering.flakes >= 30);
      assert.ok(snowLayering.rainStrokes >= 2);
      assert.equal(snowLayering.front, true);
      await waitForFrames(send);
      const snowyScreenshot = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
      writeFileSync('/tmp/404-snow-desktop.png', Buffer.from(snowyScreenshot.data, 'base64'));
      const windMotion = await evaluate(send, `(()=>{
        portfolioWeather.setLocationCondition('windy');
        const names=(selector)=>getComputedStyle(document.querySelector(selector)).animationName;
        return {
          field:names('.weather-wind'), tree:names('.camp-pines'),
          willow:names('.river-willows'), tent:names('.camp-tent > use:first-child'),
          flame:names('.flame-stack'), smoke:names('.smoke-character'),
        };
      })()`);
      assert.deepEqual(windMotion, {
        field: 'weather-wind-pass', tree: 'runtime-wind-canopy', willow: 'wind-pliant-growth',
        tent: 'wind-tent-fabric', flame: 'wind-flame-stack', smoke: 'wind-smoke',
      });
      const windPhases = await evaluate(send, `(()=>{
        const selectors=['.weather-wind','.camp-pines','.river-willows','.camp-tent > use:first-child','.flame-stack','.smoke-character'];
        const sample=(time)=>selectors.map((selector)=>{
          const node=document.querySelector(selector);
          const animation=node.getAnimations().find((item)=>item.animationName?.startsWith('wind-')||item.animationName==='weather-wind-pass'||item.animationName==='runtime-wind-canopy');
          animation.pause();animation.currentTime=time;
          const style=getComputedStyle(node);return [style.transform,style.rotate,style.translate,style.opacity];
        });
        return {start:sample(0),gust:sample(1900)};
      })()`);
      assert.ok(windPhases.start.every((value, index) => JSON.stringify(value) !== JSON.stringify(windPhases.gust[index])));
      await waitForFrames(send);
      const windyScreenshot = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
      writeFileSync('/tmp/404-windy-desktop.png', Buffer.from(windyScreenshot.data, 'base64'));
    }
  }

  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }, { name: 'prefers-reduced-motion', value: 'reduce' }] });
  await waitForFrames(send);
  const reduced = await evaluate(send, `(()=>{const figure=document.querySelector('.cryptid-camp');figure.dispatchEvent(new PointerEvent('pointerleave'));document.documentElement.dataset.motion='reduced';portfolioWeather.setLocationCondition('windy');const box=figure.getBoundingClientRect();figure.dispatchEvent(new PointerEvent('pointermove',{clientX:box.right-1,clientY:box.bottom-1,pointerType:'mouse',bubbles:true}));const style=getComputedStyle(figure);return {tracking:figure.classList.contains('is-parallax-tracking'),offsets:['back','far','mid','near'].flatMap((depth)=>['x','y'].map((axis)=>Number.parseFloat(style.getPropertyValue('--parallax-'+depth+'-'+axis)))),windAnimations:['.weather-wind','.camp-pines > use','.river-willows','.camp-tent > use:first-child','.flame-stack','.smoke-character'].map((selector)=>getComputedStyle(document.querySelector(selector)).animationName)}})()`);
  assert.equal(reduced.tracking, false);
  assert.ok(reduced.offsets.every((value) => value === 0));
  assert.ok(reduced.windAnimations.every((value) => value === 'none'));
  assert.deepEqual(errors, []);
  console.log('Parallax browser stability passed repeated pointer sweeps, bounded paint planes, stationary subjects, responsive layouts, and reduced motion.');
} finally {
  await browser?.close();
  await server.close();
}
