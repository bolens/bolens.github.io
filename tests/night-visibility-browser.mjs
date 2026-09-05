import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { startBrowser } from './lib/cdp-browser.mjs';
import { startSiteServer } from './lib/site-server.mjs';
import { evaluate, navigate, waitFor, finishFiniteAnimations } from './lib/browser-test.mjs';

const server = await startSiteServer(new URL('..', import.meta.url).pathname);
const errors = [];
let browser;
try {
  browser = await startBrowser(message => {
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
  });
  const { send } = browser;
  await send('Runtime.enable');
  for (const [width, height] of [[1440, 900], [390, 844]]) {
    await send('Emulation.setDeviceMetricsOverride', {width, height, deviceScaleFactor:1, mobile:false});
    await navigate(send, server.origin + '/404.html');
    await waitFor(send, `document.querySelector('.hybrid-effects-ready') && !document.documentElement.classList.contains('is-loading')`, 'night scene ready');
    for (const time of ['day', 'morning', 'evening', 'twilight', 'night']) {
      for (const weather of ['clear', 'cloudy', 'overcast', 'rainy', 'snowy', 'thunderstorm', 'drought', 'windy']) {
        await evaluate(send, `portfolioAppearance.setTheme('night');portfolioSceneTime.setTime('${time}');portfolioWeather.setLocationCondition('${weather}')`);
        const state = await evaluate(send, `(() => {
          const display = s => getComputedStyle(document.querySelector(s)).display;
          return {stars:display('.camp-stars'),travelers:display('.night-sky-travelers'),flies:display('.forest-fireflies'),comet:display('.comet'),overflow:document.documentElement.scrollWidth>innerWidth};
        })()`);
        const closedSky = ['overcast', 'rainy', 'snowy', 'thunderstorm'].includes(weather);
        if (closedSky || time === 'day') assert.equal(state.stars, 'none');
        assert.equal(state.travelers !== 'none', !closedSky && ['evening', 'twilight', 'night'].includes(time));
        if (['day', 'morning'].includes(time) || ['rainy', 'snowy', 'thunderstorm', 'drought', 'windy'].includes(weather)) assert.equal(state.flies, 'none');
        assert.equal(state.comet, 'none');
        assert.equal(await evaluate(send, `getComputedStyle(document.querySelector('.camp-aurora')).display`), 'none');
        assert.equal(state.overflow, false);
      }
    }
    await evaluate(send, `portfolioSceneTime.setTime('night');portfolioWeather.setLocationCondition('clear');document.documentElement.dataset.sceneComet='visible'`);
    await finishFiniteAnimations(send, '.cryptid-camp');
    assert.equal(await evaluate(send, `getComputedStyle(document.querySelector('.shooting-star-two')).opacity`), '0');
    const motion = await evaluate(send, `(() => {
      const comet=document.querySelector('.comet'),meteor=document.querySelector('.meteor');
      const animation=meteor.getAnimations()[0];animation.pause();
      const phases=[0,.55].map(p=>{animation.currentTime=p*animation.effect.getTiming().duration;return {opacity:+getComputedStyle(meteor).opacity,comet:getComputedStyle(comet).translate};});
      return {phases,cometAnimations:comet.getAnimations().length,cometDisplay:getComputedStyle(comet).display};
    })()`);
    assert.equal(motion.cometAnimations, 0);
    assert.equal(motion.cometDisplay, 'inline');
    assert.notEqual(motion.phases[0].opacity, motion.phases[1].opacity);
    assert.equal(motion.phases[0].comet, motion.phases[1].comet);
    const shot = await send('Page.captureScreenshot', {format:'png', fromSurface:true});
    writeFileSync(`/tmp/404-night-visibility-${width}.png`, Buffer.from(shot.data,'base64'));
    await send('Emulation.setEmulatedMedia', {features:[{name:'prefers-reduced-motion',value:'reduce'}]});
    await finishFiniteAnimations(send, '.cryptid-camp');
    assert.equal(await evaluate(send, `document.querySelector('.cryptid-camp').getAnimations({subtree:true}).filter(a=>a.playState==='running').length`), 0);
    await send('Emulation.setEmulatedMedia', {features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
    await waitFor(send, `document.querySelector('.meteor').getAnimations().some(a=>a.playState==='running')`, 'meteor resumes after reduced motion');
  }
  assert.deepEqual(errors, []);
} finally { await browser?.close(); await server.close(); }
