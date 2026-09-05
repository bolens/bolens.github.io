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
    await waitFor(send, `document.querySelector('.hybrid-effects-ready') && window.portfolioWeather && !document.documentElement.classList.contains('is-loading')`, 'scene ready');
    await evaluate(send, `document.documentElement.dataset.motion='reduced'`);
    for (const condition of ['clear', 'rainy', 'thunderstorm', 'snowy', 'drought']) {
      await evaluate(send, `portfolioWeather.setLocationCondition('${condition}');portfolioSceneTime.setTime('day')`);
      await finishFiniteAnimations(send, '.cryptid-camp');
      const failures = await evaluate(send, `(()=>{
        const water=document.querySelector('.river-water > path:nth-child(3)');
        const errors=[];
        const targets=document.querySelectorAll('.woodland-plants use, .forest-floor use, .camp-boulders use, .riparian-foliage use, [data-region="wet-growth"] use, [data-region="snow-covered-ground-detail"] use, [data-region="dry-ground-litter"] use, [data-region="drought-ground-debris"] use');
        for(const node of targets){
          const x=+node.getAttribute('x'),y=+node.getAttribute('y'),w=+node.getAttribute('width'),h=+node.getAttribute('height');
          // Root/ground contact, not canopy bounds: foliage may overhang a bank.
          const root=new DOMPoint(x+w*.5,y+h*.92).matrixTransform(node.getScreenCTM());
          const local=root.matrixTransform(water.getScreenCTM().inverse());
          const label=node.getAttribute('href')+' at '+x+','+y;
          if(water.isPointInFill(local))errors.push(label+' rooted in water');
          // Reserve the pitched tent floor and a small perimeter for stakes.
          if(x<1078&&x+w>826&&y<654&&y+h>605)errors.push(label+' intersects tent pad');
        }
        return errors;
      })()`);
      assert.deepEqual(failures, [], `${width}px ${condition} habitat placement`);
      if (condition === 'clear' || condition === 'thunderstorm') {
        const shot = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
        writeFileSync(`/tmp/404-habitat-${width}-${condition}.png`, Buffer.from(shot.data, 'base64'));
      }
    }
  }
} finally {
  await browser?.close();
  await server.close();
}
