import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startBrowser } from './lib/cdp-browser.mjs';
import { startSiteServer } from './lib/site-server.mjs';
import { evaluate, navigate, waitFor, finishFiniteAnimations } from './lib/browser-test.mjs';

const artifactDir=mkdtempSync(join(tmpdir(),'404-moon-'));
console.log('Moon captures: '+artifactDir);
const server=await startSiteServer(new URL('..',import.meta.url).pathname);
const errors=[];
let browser;
try {
  browser=await startBrowser(message=>{if(message.method==='Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);});
  const {send}=browser;await send('Runtime.enable');
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  for(const [width,height] of [[1440,900],[390,844]]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    await navigate(send,server.origin+'/404.html');
    await waitFor(send,`document.querySelector('.hybrid-effects-ready')&&!document.documentElement.classList.contains('is-loading')`,'phase scene ready');
    await evaluate(send,`portfolioAppearance.setTheme('day');portfolioSceneTime.setTime('night');portfolioWeather.setLocationCondition('clear')`);
    await finishFiniteAnimations(send,'.cryptid-camp');
    let bounds;
    for(const [phase,left,right] of [[0,true,true],[.25,true,false],[.5,false,false],[.75,false,true]]) {
      const state=await evaluate(send,`(()=>{
        portfolioSceneTime.setMoonPhase(${phase});
        const path=document.querySelector('.moon-terminator'),orb=document.querySelector('.scene-orb');
        const b=orb.getBoundingClientRect(),s=getComputedStyle(orb);
        return {left:path.isPointInFill(new DOMPoint(80,100)),right:path.isPointInFill(new DOMPoint(120,100)),bounds:[b.x,b.y,b.width,b.height],glow:parseFloat(s.getPropertyValue('--scene-moon-light')),shadow:s.getPropertyValue('--orb-moon-shadow-opacity'),running:document.querySelector('.cryptid-camp').getAnimations({subtree:true}).filter(a=>a.playState==='running').length};
      })()`);
      assert.equal(state.left,left);assert.equal(state.right,right);
      assert.equal(state.shadow.trim(),'1');assert.equal(state.running,0);
      assert.equal(state.glow,phase===0?0:phase===.5?1:.5);
      if(bounds)assert.deepEqual(state.bounds,bounds);else bounds=state.bounds;
      const shot=await send('Page.captureScreenshot',{format:'png',fromSurface:true});
      writeFileSync(join(artifactDir,`moon-${width}-${phase}.png`),Buffer.from(shot.data,'base64'));
    }
    for(const [environment,eligible] of [[{season:'winter',temperatureC:20},false],[{season:'summer',temperatureC:5},false],[{season:'summer',temperatureC:20,fireflyHabitat:false},false],[{season:'summer',temperatureC:20,fireflyHabitat:true},true],[null,true]]) {
      const state=await evaluate(send,`(()=>{portfolioWeather.setEnvironment(${JSON.stringify(environment)});return {eligible:portfolioWeather.fireflyEligibility,display:getComputedStyle(document.querySelector('.forest-fireflies')).display};})()`);
      assert.equal(state.eligible,Number(eligible));assert.equal(state.display!=='none',eligible);
    }
    await evaluate(send,`portfolioSceneTime.setTime('day');portfolioSceneTime.setMoonPhase(0)`);
    assert.equal(await evaluate(send,`getComputedStyle(document.querySelector('.scene-orb')).getPropertyValue('--orb-moon-shadow-opacity').trim()`),'0');
    assert.equal(await evaluate(send,`document.documentElement.scrollWidth>innerWidth`),false);
  }
  assert.deepEqual(errors,[]);
}finally {await browser?.close();await server.close();}
