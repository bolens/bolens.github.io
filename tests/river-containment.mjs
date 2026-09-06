import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startBrowser } from './lib/cdp-browser.mjs';
import { startSiteServer } from './lib/site-server.mjs';
import { evaluate, navigate, waitFor, finishFiniteAnimations } from './lib/browser-test.mjs';

const server = await startSiteServer(new URL('..', import.meta.url).pathname);
const captures = mkdtempSync(join(tmpdir(), '404-river-banks-'));
let browser;
try {
  browser = await startBrowser();
  const { send } = browser;
  await send('Runtime.enable');
  for (const width of [1440, 390]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height:900, deviceScaleFactor:1, mobile:false });
    await navigate(send, server.origin + '/404.html');
    await waitFor(send, `document.querySelector('.hybrid-effects-ready')&&!document.documentElement.classList.contains('is-loading')`, 'river ready');
    await evaluate(send, `portfolioAppearance.setMotion('reduced');const probe=document.createElement('style');probe.id='river-hit-probe';probe.textContent='.cryptid-camp *{pointer-events:none!important}.river-channel-boundary *{pointer-events:visiblePainted!important}';document.head.append(probe)`);
    for (const condition of ['clear', 'rainy', 'wet', 'thunderstorm', 'snowy', 'drought']) {
      await evaluate(send, `portfolioWeather.setLocationCondition('${condition}')`);
      await finishFiniteAnimations(send, '.cryptid-camp');
      const result = await evaluate(send, `(()=>{
        const boundary=document.querySelector('.river-channel-boundary');
        if(!boundary)return {missing:true};
        const water=boundary.querySelector('.river-water');
        const outlines=['#river-channel-outline','#river-bend-outline'].map(s=>document.querySelector(s));
        const fixed=boundary.getScreenCTM(),moving=water.getScreenCTM();
        let hits=0,outside=0;
        for(let y=450;y<760;y+=7)for(let x=2;x<554;x+=7){
          const local=new DOMPoint(x,y),screen=local.matrixTransform(fixed);
          if(screen.x<0||screen.x>=innerWidth||screen.y<0||screen.y>=innerHeight)continue;
          const hit=document.elementFromPoint(screen.x,screen.y);
          if(!hit?.closest('.river-channel-boundary'))continue;
          hits++;
          const surface=screen.matrixTransform(moving.inverse());
          if(!outlines.some(p=>p.isPointInFill(local))||!outlines.some(p=>p.isPointInFill(surface)))outside++;
        }
        return {hits,outside,fixed:getComputedStyle(boundary).clipPath,moving:getComputedStyle(water).clipPath,
          accents:['.river-ripples','.river-reflections','.water-foam-patches','.river-current-patches'].every(s=>water.contains(document.querySelector(s))),
          banks:!water.contains(document.querySelector('.riverbank-structure'))&&!water.contains(document.querySelector('.bank-root-patches'))};
      })()`);
      assert.equal(result.missing, undefined, 'river has a stationary bank boundary');
      assert.ok(result.hits > 10, `${width} ${condition}: nonempty visible water`);
      assert.equal(result.outside, 0, `${width} ${condition}: native painted hit regions stay in both channel and water surface`);
      assert.match(result.fixed, /river-channel-clip/);
      assert.match(result.moving, /river-channel-clip/);
      assert.equal(result.accents, true);
      assert.equal(result.banks, true);
      if (['clear','thunderstorm','drought'].includes(condition)) {
        const shot = await send('Page.captureScreenshot', { format:'png', fromSurface:true });
        writeFileSync(join(captures, `${width}-${condition}.png`), Buffer.from(shot.data, 'base64'));
      }
    }
    await evaluate(send, `document.querySelector('#river-hit-probe').remove()`);
  }
  console.log(`River captures: ${captures}`);
} finally { await browser?.close(); await server.close(); }
