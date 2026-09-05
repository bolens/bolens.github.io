import assert from 'node:assert/strict';
import test from 'node:test';
import { startUI } from './lib/ui-fixture.mjs';
import { evaluate, waitFor, waitForFrames, finishFiniteAnimations } from './lib/browser-test.mjs';

const ui = await startUI();
const { send } = ui;
async function settled() {
  await waitFor(send, `document.readyState==='complete'`, 'complete destination');
  await evaluate(send, 'document.fonts.ready.then(()=>true)', { awaitPromise:true });
  await waitForFrames(send);
}
try {
  for (const width of [390,1440]) {
    for (const [path,direction] of [['/','back'],['/about/','forward'],['/work/','back'],['/case-studies/uddns/','forward']]) {
      await test(`${path} ${direction} choreography at ${width}px has unique shared layers and bounded motion`, async () => {
        await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
        await ui.load(path);
        await settled();
        // Native cross-document snapshots may be declined by the browser. Explicit
        // snapshots exercise the same CSS pseudo-elements with a readiness promise.
        await evaluate(send, `document.documentElement.dataset.pageDirection=${JSON.stringify(direction)};document.documentElement.dataset.pageArrived='';document.documentElement.classList.remove('is-loading')`);
        await finishFiniteAnimations(send,'html');
        const names = await evaluate(send, `Array.from(document.querySelectorAll('*'),n=>getComputedStyle(n).viewTransitionName).filter(n=>n!=='none')`);
        assert.equal(new Set(names).size,names.length,'duplicate names reject the whole transition');
        assert.deepEqual([...names].sort(),['root','site-mark','site-nav'],'only the viewport and stable header need snapshots');
        assert.ok(!names.includes('site-footer')&&!names.includes('case-next'));
        assert.equal(await evaluate(send, `getComputedStyle(document.querySelector('.hero-copy,.page-intro h1,.case-intro h1')).animationName`),'none');
        await evaluate(send, `window.styleTransition=document.startViewTransition(()=>{});styleTransition.ready.then(()=>{window.styleEffects=document.getAnimations().filter(a=>a.effect.pseudoElement?.startsWith('::view-transition'));styleEffects.forEach(a=>{a.pause();a.currentTime=0})})`, {awaitPromise:true});
        try {
          const effects = await evaluate(send, `styleEffects.map(a=>({name:a.animationName,pseudo:a.effect.pseudoElement,timing:a.effect.getTiming(),frames:a.effect.getKeyframes()}))`);
          assert.ok(effects.length>0);
          assert.ok(effects.every(a=>a.timing.duration+a.timing.delay<=260));
          assert.ok(effects.every(a=>a.frames.every(frame=>!('width' in frame)&&!('height' in frame))),'transition effects must not interpolate snapshot dimensions');
          assert.ok(!effects.some(a=>/mark-in|route-in/.test(a.name)));
          assert.equal(await evaluate(send, `getComputedStyle(document.documentElement,'::view-transition-new(site-mark)').animationName`),'none');
          const incoming=effects.find(a=>a.pseudo==='::view-transition-new(root)');
          assert.equal(incoming.frames[0].translate,direction==='back'?'-12px':'12px');
          assert.ok(incoming.frames.every(frame=>!frame.clipPath&&!frame.scale),'no cropping or scaling the reading surface');
          for(const time of [0,140,360]) {
            const phase = await evaluate(send, `(()=>{styleEffects.forEach(a=>a.currentTime=${time});const style=getComputedStyle(document.documentElement,'::view-transition-new(root)');return {opacity:Number(style.opacity),width:document.body.scrollWidth,viewport:document.documentElement.clientWidth}})()`);
            assert.ok(phase.width<=phase.viewport,'page content must fit beneath the viewport-sized snapshot overlay: '+JSON.stringify(phase));
            if(time===0) assert.equal(phase.opacity,0);
            if(time===140) assert.ok(phase.opacity>0&&phase.opacity<1);
            if(time===360) assert.equal(phase.opacity,1);
          }
        } finally {
          await evaluate(send, 'styleEffects.forEach(a=>a.finish());styleTransition.finished', {awaitPromise:true});
        }
        assert.equal(await evaluate(send, `getComputedStyle(document.querySelector('.hero-copy,.page-intro h1,.case-intro h1')).animationName`),'none','finishing must not restart a document entrance');
      });
    }
  }
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`addEventListener('pagereveal',event=>{window.navigationRendered=false;if(event.viewTransition)event.viewTransition.finished.then(()=>navigationRendered=true);else navigationRendered=true})`});
  for(const mode of ['normal','saved','system']) {
    await test(`${mode} native links, Back and fragments retain their destinations`, async () => {
      await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:mode==='system'?'reduce':'no-preference'}]});
      await ui.load('/');
      if(mode==='saved') await evaluate(send, `portfolioAppearance.setMotion('reduced')`);
      await settled();
      await evaluate(send, `document.querySelector('nav a[href*="about"]').click()`);
      await waitFor(send, `location.pathname==='/about/'&&window.navigationRendered`, 'native about destination');
      await settled();
      assert.equal(await evaluate(send, `!!document.querySelector('script[src="/assets/page-transitions.js"]:not([async]):not([defer])')`),true,'lifecycle listeners must be registered before first render');
      assert.equal(await evaluate(send, `getComputedStyle(document.querySelector('h1')).visibility`),'visible');
      if(mode!=='normal') assert.equal(await evaluate(send, `document.documentElement.dataset.pageArrived`),undefined,'reduced motion skips choreography');
      await evaluate(send, 'history.back()');
      await waitFor(send, `location.pathname==='/'&&window.navigationRendered`, 'native Back destination');
      await settled();
      await evaluate(send, `window.fragmentDocument=document;document.documentElement.style.scrollBehavior='auto';location.hash='selected-work'`);
      await waitFor(send, `location.hash==='#selected-work'`, 'native fragment');
      assert.equal(await evaluate(send, 'document===fragmentDocument'),true);
    });
  }
  assert.deepEqual(ui.errors,[]);
} finally { await ui.close(); }
