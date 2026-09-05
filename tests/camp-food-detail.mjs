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
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    await navigate(send, server.origin + '/404.html');
    await waitFor(send, `document.querySelector('.hybrid-effects-ready') && !document.documentElement.classList.contains('is-loading')`, 'food scene ready');
    for (const [time, weather, cooked] of [['morning', 'clear', 0], ['night', 'rainy', .5], ['night', 'snowy', 1]]) {
      await evaluate(send, `portfolioAppearance.setTheme('${time === 'night' ? 'night' : 'day'}');portfolioAppearance.setMotion('reduced');portfolioSceneTime.setTime('${time}');portfolioWeather.setLocationCondition('${weather}')`);
      await finishFiniteAnimations(send, '.cryptid-camp');
      const state = await evaluate(send, `(() => {
        const q = s => document.querySelector(s), figure = q('.cryptid-camp');
        // Pin exposure for render evidence. Timer progression is tested with the fake clock.
        const levels = {cook:.12+${cooked}*.7,mark:Math.min(.9,${cooked}*1.1),blister:Math.max(0,(${cooked}-.22)*1.4),char:Math.max(0,(${cooked}-.62)*1.8),glint:Math.max(.18,.72-${cooked}*.5)};
        for (const [name,value] of Object.entries(levels)) figure.style.setProperty('--marshmallow-'+name+'-level', value, 'important');
        const food = [...document.querySelectorAll('.roasting-marshmallow')];
        const plate = q('.smores-kit'), b = plate.getBoundingClientRect();
        const before = (a,b) => !!(q('#camp-snack-plate [data-region="'+a+'"]').compareDocumentPosition(q('#camp-snack-plate [data-region="'+b+'"]')) & Node.DOCUMENT_POSITION_FOLLOWING);
        return {bias:food.map(el=>+getComputedStyle(el).getPropertyValue('--food-heat-bias')), refs:food.map(el=>el.getAttribute('href')), inside:b.x>=0&&b.right<=innerWidth&&b.y>=0&&b.bottom<=innerHeight, visible:getComputedStyle(plate).visibility, order:[before('bottom-cracker','melted-chocolate'),before('melted-chocolate','smore-filling'),before('smore-filling','top-cracker')], running:figure.getAnimations({subtree:true}).filter(a=>a.playState==='running').length};
      })()`);
      assert.deepEqual(state.bias, [.82, 1.06, .92, 1.14]);
      assert.deepEqual(state.refs, Array(4).fill('#toasted-marshmallow'));
      assert.equal(state.inside, true);
      assert.equal(state.visible, 'visible');
      assert.deepEqual(state.order, [true, true, true]);
      assert.equal(state.running, 0);
      const shot = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
      writeFileSync(`/tmp/404-food-${width}-${weather}.png`, Buffer.from(shot.data, 'base64'));
    }
    await evaluate(send, `portfolioWeather.setLocationCondition('drought')`);
    await finishFiniteAnimations(send, '.cryptid-camp');
    assert.equal(await evaluate(send, `getComputedStyle(document.querySelector('.smores-kit')).visibility`), 'hidden');
  }
  assert.deepEqual(errors, []);
} finally {
  await browser?.close();
  await server.close();
}
