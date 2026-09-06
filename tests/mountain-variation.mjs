import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startBrowser } from './lib/cdp-browser.mjs';
import { startSiteServer } from './lib/site-server.mjs';
import { evaluate, navigate, waitFor, finishFiniteAnimations } from './lib/browser-test.mjs';

const captures=mkdtempSync(join(tmpdir(),'404-mountains-'));
console.log('Mountain captures: '+captures);
const server=await startSiteServer(new URL('..',import.meta.url).pathname);
const errors=[];
let browser;
try {
  browser=await startBrowser(message=>{if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails.text);});
  const {send}=browser;
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await navigate(send,server.origin+'/404.html');
  await waitFor(send,`document.querySelector('.hybrid-effects-ready')&&!document.documentElement.classList.contains('is-loading')`,'mountains ready');
  const structure=await evaluate(send,`(()=>{
    const symbol=document.querySelector('#alpine-peak');
    return {regions:symbol.dataset.regions.split(','),targets:[...symbol.querySelectorAll('[data-region]')].map(n=>n.dataset.region),
      rows:[...document.querySelectorAll('.mountain-range')].map(row=>({count:row.children.length,variants:[...new Set([...row.children].map(n=>n.dataset.summit))].sort()})),
      bodies:[...symbol.querySelectorAll('[data-region$="-summit"] > path:first-child')].map(n=>({opacity:getComputedStyle(n).opacity,fillOpacity:getComputedStyle(n).fillOpacity,bounds:[n.getBBox().x,n.getBBox().y,n.getBBox().width,n.getBBox().height]}))};
  })()`);
  assert.deepEqual(structure.targets,structure.regions,'each named region resolves once');
  assert.deepEqual(structure.rows.map(row=>row.count),[7,7,6],'unchanged instance budget');
  for(const row of structure.rows)assert.deepEqual(row.variants,['crag','dome','horn']);
  for(const body of structure.bodies){assert.equal(body.opacity,'1');assert.equal(body.fillOpacity,'1');assert.ok(body.bounds[0]>=0&&body.bounds[1]>=0&&body.bounds[0]+body.bounds[2]<=240&&body.bounds[1]+body.bounds[3]<=220);}
  assert.equal(await evaluate(send,`[...document.querySelectorAll('#alpine-peak [data-region$="-summit"]')].every(group=>group.querySelector('.surface-light').getAttribute('d')===group.firstElementChild.getAttribute('d'))`),true,'direct illumination fits each exact rock silhouette');
  await evaluate(send,`portfolioAppearance.setTheme('day');portfolioSceneTime.setTime('day');portfolioWeather.setLocationCondition('clear');const proof=document.createElement('div');proof.id='mountain-proof';proof.style.cssText='position:fixed;left:0;top:0;width:240px;height:220px;background:#d5e3e6;z-index:1000';proof.innerHTML='<svg width="240" height="220"><g class="mountain-range mountain-range-near"><use href="#alpine-peak" width="240" height="220"/></g></svg>';document.body.append(proof)`);
  const shapes=[];
  // CSS transitions inside a use shadow tree are not enumerated by
  // document.getAnimations(). This material fixture samples settled paint.
  await evaluate(send,`(()=>{const style=document.createElement('style');style.id='mountain-proof-still';style.textContent='* { transition:none!important; }';document.head.append(style);const proof=document.querySelector('#mountain-proof');proof.style.setProperty('--surface-cloud','1');proof.style.setProperty('--surface-exposure','1');proof.style.setProperty('--surface-light-strength','0');proof.style.setProperty('--peak-fill','#6f8d91')})()`);
  for(const variant of ['horn','crag','dome']) {
    let captureIndex=0;
    const paint=async(condition,detail='rich')=>{
      await evaluate(send,`(()=>{portfolioWeather.setLocationCondition('${condition}');const use=document.querySelector('#mountain-proof use');use.dataset.summit='${variant}';use.style.setProperty('--asset-detail-secondary-opacity','${detail==='simple'?0:1}');use.style.setProperty('--asset-detail-fine-opacity','${detail==='simple'?0:1}')})()`);
      // Shared gradient stops live in the scene defs, outside the proof wrapper.
      await finishFiniteAnimations(send,'html');
      const shot=await send('Page.captureScreenshot',{format:'png',clip:{x:0,y:0,width:240,height:220,scale:1}});
      writeFileSync(join(captures,`${variant}-${captureIndex++}-${condition}-${detail}.png`),Buffer.from(shot.data,'base64'));
      const hash=await evaluate(send,`new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>{const canvas=document.createElement('canvas');canvas.width=240;canvas.height=220;const context=canvas.getContext('2d');context.drawImage(image,0,0);let hash=2166136261;for(const byte of context.getImageData(0,0,240,220).data)hash=Math.imul(hash^byte,16777619);resolve(hash)};image.onerror=reject;image.src='data:image/png;base64,${shot.data}'})`,{awaitPromise:true});
      const state=await evaluate(send,`(()=>{const use=document.querySelector('#mountain-proof use'),style=getComputedStyle(use);return {variant:use.dataset.summit,values:['--peak-snow-retention','--peak-pocket-opacity','--peak-wet-opacity','--asset-detail-secondary-opacity','--asset-detail-fine-opacity'].map(name=>style.getPropertyValue(name).trim()),bounds:[use.getBBox().x,use.getBBox().y,use.getBBox().width,use.getBBox().height]}})()`);
      return {hash,state};
    };
    const clear=await paint('clear');shapes.push(clear.hash);
    assert.deepEqual(clear.state.values,['1','.18','0','1','1']);
    assert.notEqual((await paint('clear','simple')).hash,clear.hash,variant+' detail layers render');
    for(const [condition,values] of [['snowy',['1.65','.85','0']],['rainy',['1','.18','.6']],['drought',['.22','.02','0']]]) {
      const result=await paint(condition);
      assert.notEqual(result.hash,clear.hash,variant+' '+condition+' surface renders');
      assert.deepEqual(result.state.values.slice(0,3),values);
      assert.deepEqual(result.state.bounds,clear.state.bounds,'weather does not move or reshape the rock');
    }
    // State restoration is exact. Screenshots prove visible state differences,
    // not byte-identical rasterization across independent compositor frames.
    assert.deepEqual((await paint('clear')).state,clear.state,'clear restores material values, variant, detail, and geometry');
  }
  assert.equal(new Set(shapes).size,3,'all summit silhouettes render differently');
  await evaluate(send,`document.querySelector('#mountain-proof').remove();document.querySelector('#mountain-proof-still').remove()`);
  for(const width of [1440,390])for(const theme of ['day','night']) {
    await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
    await evaluate(send,`portfolioAppearance.setTheme('${theme}');portfolioSceneTime.setTime('${theme}');portfolioWeather.setLocationCondition('${theme==='night'?'snowy':'clear'}')`);
    await finishFiniteAnimations(send,'.cryptid-camp');
    const state=await evaluate(send,`({rows:[...document.querySelectorAll('.mountain-range')].filter(n=>getComputedStyle(n).display!=='none').length,running:document.querySelector('.cryptid-camp').getAnimations({subtree:true}).filter(a=>a.playState==='running').length,overflow:document.documentElement.scrollWidth>innerWidth})`);
    assert.equal(state.rows,width===390?1:3);assert.equal(state.running,0);assert.equal(state.overflow,false);
    const shot=await send('Page.captureScreenshot',{format:'png',fromSurface:true});
    writeFileSync(join(captures,`${width}-${theme}.png`),Buffer.from(shot.data,'base64'));
  }
  assert.deepEqual(errors,[]);
} finally {await browser?.close();await server.close();}
