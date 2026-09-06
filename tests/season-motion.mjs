import assert from 'node:assert/strict';
import { startBrowser } from './lib/cdp-browser.mjs';
import { startSiteServer } from './lib/site-server.mjs';
import { evaluate, navigate, waitFor, finishFiniteAnimations } from './lib/browser-test.mjs';

const server = await startSiteServer(new URL('..', import.meta.url).pathname);
let browser;
try {
  browser = await startBrowser();
  const { send } = browser;
  await send('Runtime.enable');
  // This test samples the full tier's pine sway, not the host's CPU budget.
  await send('Emulation.setHardwareConcurrencyOverride', { hardwareConcurrency: 8 });
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  await navigate(send, server.origin + '/404.html');
  await waitFor(send, `document.querySelector('.hybrid-effects-ready')&&!document.documentElement.classList.contains('is-loading')`, 'motion scene ready');
  await evaluate(send, `portfolioAppearance.setMotion('auto');portfolioSceneTime.setTime('day');portfolioWeather.setLocationCondition('windy')`);
  const results = [];
  for (const season of [null, 'spring', 'summer', 'autumn', 'winter']) {
    await evaluate(send, `portfolioWeather.setEnvironment({season:${JSON.stringify(season)}})`);
    await finishFiniteAnimations(send, '.cryptid-camp');
    results.push(await evaluate(send, `(()=>{
      const camp=document.querySelector('.cryptid-camp');
      const animations=camp.getAnimations({subtree:true}).filter(a=>a.effect.getTiming().iterations===Infinity);
      const growth=document.querySelector('.camp-pines');
      const sway=growth.getAnimations().find(a=>a.effect.getTiming().iterations===Infinity);
      if(!sway)throw new Error('live pine sway missing');
      sway.pause();const duration=sway.effect.getTiming().duration,delay=sway.effect.getTiming().delay;
      const phases=[.2,.65].map(phase=>{sway.currentTime=delay+duration*phase;const s=getComputedStyle(growth);return [s.transform,s.rotate,s.translate].join('|')});
      sway.play();
      return {count:animations.length,density:camp.dataset.sceneDensity,phases};
    })()`));
  }
  assert.ok(results[0].count > 0);
  for (const result of results) {
    assert.ok(result.count <= results[0].count, 'season adds no continuous animation');
    assert.equal(result.density, results[0].density);
    assert.notEqual(result.phases[0], result.phases[1], 'existing wind motion remains live');
  }
  for (const preference of ['saved', 'system']) {
    await evaluate(send, `portfolioAppearance.setMotion('${preference === 'saved' ? 'reduced' : 'auto'}');portfolioWeather.setEnvironment({season:'autumn'})`);
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: preference === 'system' ? 'reduce' : 'no-preference' }] });
    await finishFiniteAnimations(send, '.cryptid-camp');
    assert.equal(await evaluate(send, `document.querySelector('.cryptid-camp').getAnimations({subtree:true}).filter(a=>a.playState==='running').length`), 0);
  }
  for (const [width, height] of [[320, 568], [844, 390]]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    await evaluate(send, `portfolioAppearancePicker.open();document.querySelector('input[name="portfolio-moon-phase"][value="0.875"]').focus()`);
    await finishFiniteAnimations(send, '.palette-picker');
    const bounds = await evaluate(send, `(()=>{const panel=document.querySelector('.palette-panels').getBoundingClientRect(),input=document.activeElement.getBoundingClientRect();return {panel:[panel.left,panel.top,panel.right,panel.bottom],input:[input.left,input.top,input.right,input.bottom],overflow:document.documentElement.scrollWidth>innerWidth}})()`);
    for (const b of [bounds.panel, bounds.input]) assert.ok(b[0] >= 0 && b[1] >= 0 && b[2] <= width && b[3] <= height, JSON.stringify(bounds));
    assert.equal(bounds.overflow, false);
    await evaluate(send, `portfolioAppearancePicker.close()`);
  }
} finally { await browser?.close(); await server.close(); }
