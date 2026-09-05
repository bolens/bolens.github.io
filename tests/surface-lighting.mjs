import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { startBrowser } from './lib/cdp-browser.mjs';
import { startSiteServer } from './lib/site-server.mjs';
import { evaluate, navigate, waitFor, finishFiniteAnimations } from './lib/browser-test.mjs';

const server = await startSiteServer(new URL('..', import.meta.url).pathname);
let browser;
try {
  browser = await startBrowser();
  const { send } = browser;
  await send('Runtime.enable');
  for (const [width, height] of [[1440, 900], [390, 844]]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    await navigate(send, `${server.origin}/404.html`);
    await waitFor(send, `document.querySelector('.hybrid-effects-ready') && !document.documentElement.classList.contains('is-loading')`, 'lighting ready');
    await evaluate(send, `document.documentElement.dataset.motion='reduced'`);
    for (const time of ['day', 'night', 'morning', 'evening', 'twilight']) {
      await evaluate(send, `portfolioAppearance.setTheme('${['night', 'twilight'].includes(time) ? 'night' : 'day'}')`);
      for (const condition of ['clear', 'cloudy', 'overcast', 'rainy', 'thunderstorm', 'snowy', 'wet', 'misty', 'drought']) {
        await evaluate(send, `portfolioSceneTime.setTime('${time}');portfolioWeather.setLocationCondition('${condition}')`);
        await finishFiniteAnimations(send, '.cryptid-camp');
        const state = await evaluate(send, `(()=>{
          const style=getComputedStyle(document.querySelector('.cryptid-camp'));
          const exposure=selector=>getComputedStyle(document.querySelector(selector)).getPropertyValue('--surface-exposure').trim();
          return {strength:+style.getPropertyValue('--surface-light-strength'),cloud:+style.getPropertyValue('--surface-cloud'),color:style.getPropertyValue('--surface-light-color').trim(),shelter:exposure('[data-weather-exposure="sheltered"]'),canopy:exposure('.woodland-plants'),open:exposure('.camp-boulders'),layers:document.querySelectorAll('symbol .surface-light').length,gradient:getComputedStyle(document.querySelector('[data-light-facing="left"]')).getPropertyValue('--surface-gradient').trim()};
        })()`);
        assert.equal(state.layers, 5);
        assert.equal(state.shelter, '0');
        assert.ok(+state.canopy < +state.open);
        assert.ok(state.strength > 0 && state.strength <= .34);
        assert.equal(state.cloud, ({ clear:1, cloudy:.38, overcast:.08, rainy:.08, thunderstorm:.025, snowy:.08, wet:1, misty:.2, drought:1 })[condition]);
        assert.ok(state.gradient.includes('surface-light-left'));
        if (time === 'night') { assert.equal(state.color, '#b8d1f2'); assert.ok(state.strength < .15); }
        if (['day', 'night'].includes(time) && condition === 'clear') {
          const shot = await send('Page.captureScreenshot', { format:'png', fromSurface:true });
          writeFileSync(`/tmp/404-surface-light-${width}-${time}.png`, Buffer.from(shot.data, 'base64'));
        }
      }
    }
  }
} finally { await browser?.close(); await server.close(); }
