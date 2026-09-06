import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startBrowser } from './lib/cdp-browser.mjs';
import { startSiteServer } from './lib/site-server.mjs';
import { evaluate, navigate, waitFor, finishFiniteAnimations } from './lib/browser-test.mjs';

const captures = mkdtempSync(join(tmpdir(), '404-fishing-rendering-'));
console.log('Fishing glyph captures: ' + captures);
const server = await startSiteServer(new URL('..', import.meta.url).pathname);
const errors = [];
let browser;
try {
  browser = await startBrowser(message => {
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
  });
  const { send } = browser;
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {width:1440,height:900,deviceScaleFactor:1,mobile:false});
  await send('Emulation.setEmulatedMedia', {features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await navigate(send, server.origin + '/404.html');
  await waitFor(send, `document.querySelector('.hybrid-effects-ready')&&!document.documentElement.classList.contains('is-loading')`, 'fishing scene ready');
  // Keep the real symbol and its CSS consumers. Only isolate its placement and
  // give the rod, line and ripples distinct colors for native pixel measurements.
  await evaluate(send, `(()=>{
    const still=document.createElement('style');still.textContent='* { transition:none!important; }';document.head.append(still);
    const proof=document.createElement('div');proof.id='fishing-proof';
    proof.style.cssText='position:fixed;left:0;top:0;width:240px;height:380px;background:white;z-index:1000';
    proof.innerHTML='<svg width="240" height="380" viewBox="0 0 120 190"><g class="riverbank-angler" style="translate:none"><use href="#fishing-kit" width="120" height="190" style="--fishing-rod:#ff00ff;--fishing-line:#00ffff;--ripple-color:#00ff00;--asset-detail-secondary-opacity:1;--asset-detail-fine-opacity:1"/></g></svg>';
    document.body.append(proof);
  })()`);
  const paint = async (time, condition) => {
    await evaluate(send, `(()=>{
      portfolioAppearance.setTheme('day');portfolioSceneTime.setTime('${time}');portfolioWeather.setLocationCondition('${condition}');
      document.querySelector('#fishing-proof use').setAttribute('class','${time === 'night' ? 'stowed-fishing-rod' : ''}');
    })()`);
    await finishFiniteAnimations(send, 'html');
    const shot = await send('Page.captureScreenshot', {format:'png',clip:{x:0,y:0,width:240,height:380,scale:1}});
    writeFileSync(join(captures, `${time}-${condition}.png`), Buffer.from(shot.data, 'base64'));
    return evaluate(send, `new Promise((resolve,reject)=>{
      const image=new Image();image.onload=()=>{
        const canvas=document.createElement('canvas');canvas.width=240;canvas.height=380;
        const context=canvas.getContext('2d');context.drawImage(image,0,0);
        const pixels=context.getImageData(0,0,240,380).data;
        const rod=[],line=[],ripples=[],bobber=[];
        for(let y=0;y<380;y++)for(let x=0;x<240;x++){
          const i=(y*240+x)*4,r=pixels[i],g=pixels[i+1],b=pixels[i+2];
          if(r>220&&g<80&&b>220)rod.push(y);
          if(r<180&&g>220&&b>220)line.push(y);
          if(r<230&&g>240&&b<230&&y>180)ripples.push(y);
          if(Math.abs(r-199)<5&&Math.abs(g-117)<5&&Math.abs(b-75)<5)bobber.push(y);
        }
        const bounds=values=>values.length?{min:Math.min(...values),max:Math.max(...values),count:values.length}:null;
        resolve({rod:bounds(rod),line:bounds(line),ripples:bounds(ripples),bobber:bounds(bobber)});
      };image.onerror=reject;image.src='data:image/png;base64,${shot.data}';
    })`, {awaitPromise:true});
  };
  const clear = await paint('day', 'clear');
  assert.ok(clear.rod?.count > 100 && clear.rod.min > 35, 'loaded rod paints its downward curved pose');
  assert.ok(clear.line && clear.ripples && clear.bobber, 'cast line, ripple contours and float all paint');
  for (const [condition, shift] of [['wet',-16],['drought',72]]) {
    const moved = await paint('day', condition);
    assert.deepEqual(moved.rod, clear.rod, 'water level leaves the rod fixed');
    for (const part of ['bobber','ripples']) {
      assert.equal(moved[part]?.min, clear[part].min + shift, condition + ' moves painted ' + part + ' to the water level');
      assert.equal(moved[part]?.max, clear[part].max + shift, condition + ' preserves painted ' + part + ' height');
    }
    assert.equal(moved.line.max, clear.line.max + shift, condition + ' painted line follows the float');
  }
  const stored = await paint('night', 'clear');
  assert.ok(stored.rod?.count > 100 && stored.rod.min < 24, 'stored instance paints the relaxed rod tip');
  assert.equal(stored.line, null, 'stored instance paints no cast line');
  assert.equal(stored.ripples, null, 'stored instance paints no ripple contours');
  assert.equal(stored.bobber, null, 'stored instance paints no float');
  assert.deepEqual(errors, []);
} finally { await browser?.close(); await server.close(); }
