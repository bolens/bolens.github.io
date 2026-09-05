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
        const bend=document.querySelector('[data-region="distant-river-bend"]').getBBox();
        const glint=document.querySelector('[data-region="distant-river-glint"]').getBBox();
        // The upstream reach follows the forest floor, not the tall tree canopy.
        if(bend.y<400||bend.height>36||bend.width<60)errors.push('distant river climbs above its ground-level bend');
        if(glint.y<bend.y||glint.y+glint.height>bend.y+bend.height)errors.push('distant glint escapes the river bend');
        const channels=[...document.querySelectorAll('.river-water > path')].filter(path=>path.getAttribute('fill')!=='none');
        const woody=[...document.querySelectorAll('use')].filter(node=>!node.closest('symbol')&&['#distant-pine','#aspen-copse','#willow-clump','#bare-tree','#evergreen-shrub','#berry-shrub','#fern-spray'].includes(node.getAttribute('href')));
        for(const node of woody){
          const x=+node.getAttribute('x'),y=+node.getAttribute('y'),w=+node.getAttribute('width'),h=+node.getAttribute('height');
          // Tree crowns can overhang water; permanent trunks/root crowns cannot.
          const roots=[.45,.5,.55].map(fraction=>new DOMPoint(x+w*fraction,y+h*.98).matrixTransform(node.getScreenCTM()));
          if(roots.some(root=>channels.some(channel=>channel.isPointInFill(root.matrixTransform(channel.getScreenCTM().inverse())))))errors.push(node.getAttribute('href')+' at '+x+','+y+' has roots in river');
        }
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
