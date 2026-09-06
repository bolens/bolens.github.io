import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startBrowser } from './lib/cdp-browser.mjs';
import { startSiteServer } from './lib/site-server.mjs';
import { evaluate, navigate, waitFor, finishFiniteAnimations } from './lib/browser-test.mjs';

const server = await startSiteServer(new URL('..', import.meta.url).pathname);
const captures = mkdtempSync(join(tmpdir(), '404-trail-clearance-'));
let browser;
try {
  browser = await startBrowser();
  const { send } = browser;
  await send('Runtime.enable');
  const failures = new Set();
  for (const width of [1440, 390]) {
    await send('Emulation.setDeviceMetricsOverride', {width,height:900,deviceScaleFactor:1,mobile:false});
    await navigate(send, server.origin + '/404.html');
    await waitFor(send, `document.querySelector('.hybrid-effects-ready')&&!document.documentElement.classList.contains('is-loading')`, 'trail ready');
    for (const condition of ['clear','rainy','snowy','drought']) {
      await evaluate(send, `portfolioWeather.setLocationCondition('${condition}')`);
      await finishFiniteAnimations(send, '.cryptid-camp');
      const conflicts = await evaluate(send, `(()=>{
        const trail=document.querySelector('.background-trail');
        const bed=document.querySelector('#forest-trail > path');
        const inverse=trail.getScreenCTM().inverse();
        const types=new Set(['#distant-pine','#aspen-copse','#willow-clump','#bare-tree','#tree-stump','#evergreen-shrub','#berry-shrub','#alpine-boulder','#fern-spray','#reed-clump','#wildflower-clump','#grass-tuft','#fly-agaric']);
        const errors=[];
        const figure=document.querySelector('.cryptid-camp');
        for(const direction of [-1,0,1]){
        for(const [depth,x,y] of [['back',-.35,-.15],['far',-.75,-.35],['mid',1.3,.65],['near',2.6,1.25]]){
          figure.style.setProperty('--parallax-'+depth+'-x',x*direction+'px');
          figure.style.setProperty('--parallax-'+depth+'-y',y*direction+'px');
        }
        for(const node of document.querySelectorAll('use.terrain-asset')){
          const href=node.getAttribute('href');
          if(node.closest('symbol')||!(types.has(href)||href==='#fungi-cluster'||(href==='#river-stone'&&+node.getAttribute('width')>=40))||!node.getClientRects().length)continue;
          let hidden=false;
          for(let parent=node;parent&&parent!==figure;parent=parent.parentElement){
            if(getComputedStyle(parent).display==='none'){hidden=true;break;}
          }
          if(hidden)continue;
          const x=+node.getAttribute('x'),y=+node.getAttribute('y'),w=+node.getAttribute('width'),h=+node.getAttribute('height');
          // Test ground contact, not crowns: foliage may lean over the path.
          const wide=['#tree-stump','#alpine-boulder','#river-stone','#evergreen-shrub','#berry-shrub','#aspen-copse','#willow-clump','#fungi-cluster'].includes(href);
          const fractions=wide?[.2,.35,.5,.65,.8]:[.45,.5,.55];
          const vb=document.querySelector(href).viewBox.baseVal;
          const scale=Math.min(w/vb.width,h/vb.height);
          const insetX=(w-vb.width*scale)/2,insetY=(h-vb.height*scale)/2;
          const blocked=fractions.some(f=>[.88,.95].some(d=>{
            const p=new DOMPoint(x+insetX+vb.width*scale*f,y+insetY+vb.height*scale*d).matrixTransform(node.getScreenCTM()).matrixTransform(inverse);
            p.x-=+trail.getAttribute('x');p.y-=+trail.getAttribute('y');
            return bed.isPointInFill(p);
          }));
          if(blocked)errors.push(href+' at '+x+','+y+' weather='+document.documentElement.dataset.weather);
        }
        }
        return errors;
      })()`);
      for (const conflict of conflicts) failures.add(conflict);
      if (condition === 'clear' || condition === 'snowy') {
        const shot = await send('Page.captureScreenshot', {format:'png',fromSurface:true});
        writeFileSync(join(captures, `${width}-${condition}.png`), Buffer.from(shot.data,'base64'));
      }
    }
  }
  assert.deepEqual([...failures], [], 'rooted plants and large obstacles must not occupy the trail');
  console.log(`Trail captures: ${captures}`);
} finally { await browser?.close(); await server.close(); }
