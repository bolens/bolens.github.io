import assert from 'node:assert/strict';
import { startBrowser } from './lib/cdp-browser.mjs';
import { startSiteServer } from './lib/site-server.mjs';
import { evaluate, navigate, waitFor, waitForFrames } from './lib/browser-test.mjs';

const server = await startSiteServer(new URL('..', import.meta.url).pathname);
let browser;
try {
  browser = await startBrowser();
  const { send } = browser;
  await send('Runtime.enable');
  for (const width of [1440, 390]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
    await navigate(send, server.origin + '/404.html');
    await waitFor(send, `document.querySelector('.hybrid-effects-ready')&&!document.documentElement.classList.contains('is-loading')`, 'picker ready');
    await evaluate(send, `portfolioSceneTime.setTime('day');portfolioWeather.setLocationCondition('clear');portfolioAppearancePicker.open()`);
    await waitForFrames(send, 3);
    await evaluate(send, `window.atmosphereDraws=0;const ctx=document.querySelector('.camp-atmosphere').getContext('2d'),clear=ctx.clearRect.bind(ctx);ctx.clearRect=(...args)=>{atmosphereDraws++;return clear(...args)}`);
    await evaluate(send, `window.allocationWrites=0;window.allocationObserver=new MutationObserver(records=>allocationWrites+=records.length);allocationObserver.observe(document.querySelector('.cryptid-camp'),{subtree:true,attributes:true,attributeFilter:['data-runtime-motion']})`);
    for (const action of [
      `portfolioWeather.setEnvironment({season:'autumn'})`,
      `portfolioSceneTime.setMoonPhase(.25)`,
      `portfolioAppearance.setPalette('forest')`,
      `portfolioWeather.setLocationCondition('clear')`,
    ]) {
      await evaluate(send, `allocationWrites=0;atmosphereDraws=0;${action}`);
      await waitForFrames(send, 3);
      assert.equal(await evaluate(send, 'allocationWrites'), 0, 'unchanged allocation must not rewrite animation targets');
      assert.equal(await evaluate(send, 'atmosphereDraws'), 0, 'unchanged particle inputs must not redraw the paused canvas');
    }
    for (const [time, weather] of [['night', 'windy'], ['night', 'snowy'], ['day', 'rainy'], ['day', 'drought']]) {
      await evaluate(send, `atmosphereDraws=0;portfolioSceneTime.setTime('${time}');portfolioWeather.setLocationCondition('${weather}')`);
      await waitForFrames(send, 3);
      assert.ok(await evaluate(send, 'atmosphereDraws>0'), 'changed particle inputs repaint even while the picker is open');
      assert.equal(await evaluate(send, `document.querySelector('.cryptid-camp').getAnimations({subtree:true}).filter(a=>a.effect.getTiming().iterations===Infinity&&a.playState==='running').length`), 0, 'new weather/time animations stay paused behind the picker');
      await evaluate(send, `portfolioAppearancePicker.close()`);
      await waitForFrames(send, 3);
      assert.ok(await evaluate(send, `document.querySelector('.cryptid-camp').getAnimations({subtree:true}).some(a=>a.effect?.target?.dataset.runtimeMotion==='live'&&a.playState==='running')`), 'current live allocation resumes');
      await evaluate(send, `portfolioAppearancePicker.open()`);
      await waitForFrames(send, 3);
    }
    await evaluate(send, `portfolioAppearance.setMotion('reduced');portfolioAppearancePicker.close()`);
    await waitForFrames(send, 3);
    assert.equal(await evaluate(send, `document.querySelector('.cryptid-camp').getAnimations({subtree:true}).filter(a=>a.effect.getTiming().iterations===Infinity&&a.playState==='running').length`), 0);
    await evaluate(send, `portfolioAppearance.setMotion('auto');portfolioAppearancePicker.open();document.querySelector('.cryptid-camp').removeAttribute('data-render-runtime')`);
    assert.equal(await evaluate(send, `getComputedStyle(document.querySelector('.leaf-litter-piece')).animationPlayState`), 'paused', 'renderer-unavailable CSS fallback still pauses');
  }
} finally { await browser?.close(); await server.close(); }
