import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { startBrowser } from './lib/cdp-browser.mjs';
import { evaluate, navigate, waitFor, waitForFrames, finishFiniteAnimations } from './lib/browser-test.mjs';
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
      const motionMatrix = await evaluate(send, `(()=>{const result={};for(const time of ['day','night','morning','evening','twilight'])for(const condition of portfolioWeather.conditions){portfolioSceneTime.setTime(time);portfolioWeather.setLocationCondition(condition);result[time+'-'+condition]=document.querySelector('.cryptid-camp').getAnimations({subtree:true}).filter((animation)=>animation.effect?.target?.dataset.runtimeMotion==='live').length}return result})()`);
      assert.ok(Math.max(...Object.entries(motionMatrix).filter(([name])=>!/(windy|thunderstorm)$/.test(name)).map(([,count])=>count)) <= 15, `standard motion budget exceeded: ${JSON.stringify(motionMatrix)}`);
      assert.ok(Math.max(...Object.entries(motionMatrix).filter(([name])=>/(windy|thunderstorm)$/.test(name)).map(([,count])=>count)) <= 21, `wind motion budget exceeded: ${JSON.stringify(motionMatrix)}`);
      const incompatibleAccents = await evaluate(send, `(()=>{
        const failures=[];
        const supported={snow:['snowy'],rain:['rainy','thunderstorm'],wet:['rainy','thunderstorm','wet','snowy','misty'],dry:['dry','drought'],drought:['drought']};
        for(const condition of portfolioWeather.conditions){
          portfolioWeather.setLocationCondition(condition);
          for(const node of document.querySelectorAll('.terrain-asset')){
            const style=getComputedStyle(node);
            for(const [accent,conditions] of Object.entries(supported)){
              if(!conditions.includes(condition)&&parseFloat(style.getPropertyValue('--asset-'+accent+'-opacity'))>0) failures.push(condition+':'+node.getAttribute('href')+':'+accent);
            }
          }
        }
        return failures;
      })()`);
      assert.deepEqual(incompatibleAccents, [], 'scene weather must clear incompatible placement accents');
      const exposureErrors = await evaluate(send, `(()=>{
        const errors=[];
        for(const condition of portfolioWeather.conditions){
          portfolioWeather.setLocationCondition(condition);
          for(const node of document.querySelectorAll('[data-weather-exposure="sheltered"] .terrain-asset')){
            const style=getComputedStyle(node);
            for(const accent of ['rain','snow','wet','dry','drought','wind']) if(Number(style.getPropertyValue('--asset-'+accent+'-opacity'))!==0) errors.push(condition+':shelter:'+accent);
          }
          const tent=getComputedStyle(document.querySelector('use[href="#camp-tent-shell"]'));
          for(const accent of ['dry','drought']) if(Number(tent.getPropertyValue('--asset-'+accent+'-opacity'))!==0) errors.push(condition+':fabric:'+accent);
          if(condition==='snowy'&&Number(tent.getPropertyValue('--asset-snow-opacity'))<=0) errors.push('exposed tent must still collect snow');
        }
        return errors;
      })()`);
      assert.deepEqual(exposureErrors, [], 'shelter and material must constrain weather deposits');
      await evaluate(send, `portfolioWeather.setLocationCondition('windy')`);
      await finishFiniteAnimations(send, '.cryptid-camp');
      const windyGround = await evaluate(send, `({cover:getComputedStyle(document.querySelector('.ground-dry-cover')).visibility,tint:getComputedStyle(document.querySelector('.ground-weather-states')).getPropertyValue('--condition-ground-opacity')})`);
      assert.equal(windyGround.cover, 'hidden', 'wind alone does not expose dry ground');
      assert.equal(Number(windyGround.tint), 0, 'wind alone does not brown the ground');
      const plantStates = await evaluate(send, `(()=>{
        const states={};
        for(const condition of ['clear','rainy','drought','snowy','clear']){
          portfolioWeather.setLocationCondition(condition);
          const banks=getComputedStyle(document.querySelector('.river-ferns use'));
          const exposed=getComputedStyle(document.querySelector('.dry-ferns use'));
          const moss=getComputedStyle(document.querySelector('.moss-patches use'));
          states[condition]={bank:Number(banks.getPropertyValue('--fern-upright')||1),exposed:Number(exposed.getPropertyValue('--fern-upright')||1),dormant:moss.getPropertyValue('--moss-condition-fill').trim(),visible:['.river-ferns','.dry-ferns','.moss-patches'].every(selector=>getComputedStyle(document.querySelector(selector)).display!=='none')};
        }
        return states;
      })()`);
      assert.ok(Object.values(plantStates).every(state=>state.visible), 'perennial ground plants remain in place');
      assert.ok(plantStates.drought.exposed < plantStates.drought.bank, 'sheltered ferns retain more height under drought');
      assert.ok(plantStates.snowy.bank < plantStates.rainy.bank, 'snow loads fronds more than rain');
      assert.ok(plantStates.drought.dormant, 'dry moss retains a dormant material');
      assert.equal(plantStates.clear.bank, 1, 'fronds recover on return to clear conditions');
      assert.equal(plantStates.clear.dormant, '', 'moss restores its placement palette');
      await evaluate(send, `portfolioWeather.setLocationCondition('thunderstorm')`);
      await finishFiniteAnimations(send, '.cryptid-camp');
      const storm = await evaluate(send, `(()=>{
        const style=selector=>getComputedStyle(document.querySelector(selector));
        return {condition:portfolioWeather.condition,formation:style('.rain-cloud').getPropertyValue('--cloud-storm-display').trim(),rain:style('.weather-rain').visibility,flame:style('.flame-stack').scale,water:style('.river-water').translate,motion:portfolioSceneMotion.profile.signature};
      })()`);
      assert.equal(storm.condition, 'thunderstorm');
      assert.equal(storm.formation, 'inline');
      assert.equal(storm.rain, 'visible');
      assert.equal(storm.flame, '0.48 0.34');
      assert.equal(storm.water, '0px -5px');
      assert.ok(storm.motion.endsWith('-thunderstorm'));
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
          tier:portfolio404Renderer.tier,
          field:names('.weather-wind'), tree:names('.camp-pines'),
          willow:names('.river-willows'), tent:names('.camp-tent > use:first-child'),
          flame:names('.flame-stack'), smoke:names('.smoke-character'),
        };
      })()`);
      assert.deepEqual(windMotion, {
        tier: windMotion.tier, field: 'weather-wind-pass', tree: windMotion.tier === 'minimal' ? 'none' : 'runtime-wind-canopy', willow: windMotion.tier === 'minimal' ? 'none' : 'wind-pliant-growth',
        tent: 'wind-tent-fabric', flame: 'wind-flame-stack', smoke: 'wind-smoke',
      });
      const windPhases = await evaluate(send, `(()=>{
        const selectors=['.weather-wind',...(portfolio404Renderer.tier==='minimal'?[]:['.camp-pines','.river-willows']),'.camp-tent > use:first-child','.flame-stack','.smoke-character'];
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
