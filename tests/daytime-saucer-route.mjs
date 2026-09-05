import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {startBrowser} from './lib/cdp-browser.mjs';
import {startSiteServer} from './lib/site-server.mjs';
import {evaluate,navigate,waitFor,finishFiniteAnimations} from './lib/browser-test.mjs';
const artifactDir=mkdtempSync(join(tmpdir(),'404-saucer-'));
console.log('Saucer captures: '+artifactDir);
const server=await startSiteServer(new URL('..',import.meta.url).pathname);
const errors=[];let browser;
try {
 browser=await startBrowser(m=>{if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);});
 const {send}=browser;await send('Runtime.enable');
 for(const [width,height] of [[1440,900],[390,844]]) {
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
  await navigate(send,server.origin+'/404.html');
  await waitFor(send,"document.querySelector('.hybrid-effects-ready')&&!document.documentElement.classList.contains('is-loading')",'sky ready');
  await evaluate(send,"portfolioAppearance.setMotion('auto');portfolioSceneTime.setTime('day');portfolioWeather.setLocationCondition('clear')");
  await finishFiniteAnimations(send,'.cryptid-camp');
  await waitFor(send,"document.querySelector('.day-flight-ufo').getAnimations().length===1",'one owned saucer animation');
  for(const phase of [0,.28,.5,.74,1]) {
   const state=await evaluate(send,`(()=>{
    const ufo=document.querySelector('.day-flight-ufo'),animation=ufo.getAnimations()[0];
    animation.pause();animation.currentTime=animation.effect.getTiming().duration*${phase};
    const b=ufo.getBoundingClientRect(),hit=document.elementsFromPoint(b.x+b.width*.5,b.y+b.height*.5).find(node=>['#alpine-peak','#scout-ufo'].includes(node.getAttribute('href')));
    return {hit:hit?.getAttribute('href'),target:hit?.outerHTML.slice(0,180),bounds:[b.x,b.y,b.width,b.height],opacity:getComputedStyle(ufo).opacity,finite:[b.x,b.y,b.width,b.height].every(Number.isFinite),pilot:document.querySelector('#scout-ufo [href="#alien-face-art"]')!==null};
   })()`);
   assert.equal(state.finite,true);assert.equal(state.pilot,true);assert.equal(state.opacity,'1');
   // This proves center occlusion, not full concealment; edge peeking is intentional.
   if(phase===0||phase===1)assert.equal(state.hit,'#alpine-peak','endpoint center must be covered by retained mountain: '+JSON.stringify({width,phase,...state}));
   if(phase===.5)assert.equal(state.hit,'#scout-ufo','mid-route must be visibly exposed');
   const shot=await send('Page.captureScreenshot',{format:'png',fromSurface:true});writeFileSync(join(artifactDir,`saucer-${width}-${phase}.png`),Buffer.from(shot.data,'base64'));
  }
  await evaluate(send,"portfolioWeather.setLocationCondition('cloudy')");
  await finishFiniteAnimations(send,'.cryptid-camp');
  const cloudOrder=await evaluate(send,`(()=>{const ufo=document.querySelector('.day-flight-ufo'),cloud=document.querySelector('.weather-clouds-front');return {after:!!(ufo.compareDocumentPosition(cloud)&Node.DOCUMENT_POSITION_FOLLOWING),visible:getComputedStyle(cloud).visibility};})()`);
  assert.deepEqual(cloudOrder,{after:true,visible:'visible'});
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await evaluate(send,"portfolioWeather.setLocationCondition('clear')");
  await finishFiniteAnimations(send,'.cryptid-camp');
  assert.equal(await evaluate(send,"document.querySelector('.day-flight-ufo').getAnimations().length"),0);
  assert.equal(await evaluate(send,"getComputedStyle(document.querySelector('.day-flight-ufo')).translate"),'0px 65px');
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
  await evaluate(send,"portfolioAppearance.setMotion('reduced')");
  await finishFiniteAnimations(send,'.cryptid-camp');
  assert.equal(await evaluate(send,"document.querySelector('.day-flight-ufo').getAnimations().length"),0);
  assert.equal(await evaluate(send,"getComputedStyle(document.querySelector('.day-flight-ufo')).translate"),'0px 65px','saved reduced motion retains the same static peek');
 }
 assert.deepEqual(errors,[]);
}finally{await browser?.close();await server.close();}
