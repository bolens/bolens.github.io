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
  await send('Emulation.setEmulatedMedia', { features:[{ name:'prefers-reduced-motion', value:'reduce' }] });
  for (const [width, height] of [[1440,900], [390,844]]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor:1, mobile:false });
    await navigate(send, `${server.origin}/404.html`);
    await waitFor(send, `document.querySelector('.hybrid-effects-ready') && !document.documentElement.classList.contains('is-loading')`, 'character scene ready');
    for (const theme of ['day', 'night']) {
      await evaluate(send, `portfolioAppearance.setTheme('${theme}')`);
      for (const time of ['day', 'morning', 'evening', 'twilight', 'night']) {
        for (const weather of [({ day:'clear', morning:'rainy', evening:'snowy', twilight:'drought', night:'clear' })[time]]) {
          await evaluate(send, `portfolioSceneTime.setTime('${time}');portfolioWeather.setLocationCondition('${weather}')`);
          await finishFiniteAnimations(send, '.cryptid-camp');
          const state = await evaluate(send, `(() => {
            const visible = selector => getComputedStyle(document.querySelector(selector)).display !== 'none';
            const peeks = [...document.querySelectorAll('.daytime-cryptid')];
            return {
              peeks:peeks.map(el => getComputedStyle(el.querySelector('[data-region="peeking-face"]')).display !== 'none'),
              seated:['bigfoot','alien','dogman','mothman'].map(name => visible('.camper.' + name)),
              perched:visible('.daytime-perched'),
              perchReference:document.querySelector('.daytime-perched').getAttribute('href'),
              perchHasStick:!!document.querySelector('#mothman-body-art .roasting-arm'),
              arm:visible('.arm-bigfoot'), flying:visible('.day-flight-ufo'),
              rim:visible('.fire-rim-light'),
              references:peeks.map(el => el.querySelector('[data-region="peeking-face"]').getAttribute('href')),
              sharedPlane:peeks.every(el => el.parentElement.matches('.camp-pines')),
              pilots:document.querySelectorAll('#scout-ufo [href="#alien-face-art"]').length,
              pilotOrder:[...document.querySelector('#scout-ufo').children].map(el => el.dataset.region).filter(Boolean),
              inFrame:peeks.every(el => { const r=el.querySelector('[data-region="peeking-face"]').getBoundingClientRect(); return r.width>0 && r.left>=0 && r.right<=innerWidth; }),
              running:document.querySelector('.cryptid-camp').getAnimations({subtree:true}).filter(a => a.playState==='running').length,
              overflow:document.documentElement.scrollWidth>innerWidth
            };
          })()`);
          const day = ['day','morning','evening'].includes(time);
          assert.deepEqual(state.peeks, [day,day]);
          assert.deepEqual(state.seated, [!day,!day,!day,!day]);
          assert.equal(state.perched, day);
          assert.equal(state.perchReference, '#mothman-body-art');
          assert.equal(state.perchHasStick, false);
          assert.equal(state.arm, !day);
          assert.equal(state.rim, !day);
          assert.equal(state.flying, day);
          assert.deepEqual(state.references, ['#bigfoot-face-art','#dogman-face-art']);
          assert.equal(state.sharedPlane, true);
          assert.equal(state.pilots, 1);
          assert.deepEqual(state.pilotOrder, ['cockpit-interior','alien-pilot','cockpit-glass','glass-reflection']);
          if (day) assert.equal(state.inFrame, true);
          assert.equal(state.running, 0);
          assert.equal(state.overflow, false);
          if (theme === 'day' && ['day','night'].includes(time) && weather === 'clear') {
            const shot = await send('Page.captureScreenshot', { format:'png', fromSurface:true });
            writeFileSync(`/tmp/404-cryptid-poses-${width}-${time}.png`, Buffer.from(shot.data,'base64'));
          }
        }
      }
    }
  }
  assert.deepEqual(errors, []);
} finally { await browser?.close(); await server.close(); }
