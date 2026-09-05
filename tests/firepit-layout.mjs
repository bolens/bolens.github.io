import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { startBrowser } from './lib/cdp-browser.mjs';
import { startSiteServer } from './lib/site-server.mjs';
import { evaluate, navigate, waitFor, finishFiniteAnimations } from './lib/browser-test.mjs';

const server=await startSiteServer(new URL('..',import.meta.url).pathname);
const errors=[];
let browser;
try {
  browser=await startBrowser(message=>{if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails.text);});
  const {send}=browser;
  await send('Runtime.enable');
  for(const [width,height] of [[1440,900],[390,844]]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    await navigate(send,server.origin+'/404.html');
    await waitFor(send,`document.querySelector('.hybrid-effects-ready') && !document.documentElement.classList.contains('is-loading')`,'fire scene ready');
    for(const [time,weather] of [['day','clear'],['morning','clear'],['night','rainy'],['day','drought'],['night','drought']]) {
      await evaluate(send,`portfolioAppearance.setTheme('${time==='night'?'night':'day'}');portfolioSceneTime.setTime('${time}');portfolioWeather.setLocationCondition('${weather}');document.documentElement.dataset.motion='reduced'`);
      await finishFiniteAnimations(send,'.cryptid-camp');
      const state=await evaluate(send,`(()=>{
        const q=s=>document.querySelector(s),visible=s=>getComputedStyle(q(s)).visibility!=='hidden';
        const box=s=>{const b=q(s).getBoundingClientRect();return {x:b.x,y:b.y,right:b.right,bottom:b.bottom,width:b.width,height:b.height};};
        const before=(a,b)=>!!(q(a).compareDocumentPosition(q(b))&Node.DOCUMENT_POSITION_FOLLOWING);
        return {fire:document.documentElement.dataset.sceneFire,flame:visible('.flame-stack'),smoke:visible('.smoke-404'),stove:visible('.drought-camp-stove'),stoveFlame:visible('.stove-flame'),logs:visible('.fire-logs'),bed:box('[href="#fire-bed"]'),fuel:box('.fire-logs'),front:before('.campfire','.fire-ring-front'),rear:before('.fire-ring-stones','.campfire'),coal:getComputedStyle(q('.coal-bed > use')).getPropertyValue('--coal-glow-opacity').trim(),running:q('.cryptid-camp').getAnimations({subtree:true}).filter(a=>a.playState==='running').length};
      })()`);
      const burning=time!=='day',drought=weather==='drought';
      assert.equal(state.fire,burning?'burning':'cold');
      assert.equal(state.flame,burning&&!drought);
      assert.equal(state.smoke,burning&&!drought);
      assert.equal(state.logs,!drought);
      assert.equal(state.stove,drought);
      // The burner lives in a symbol. Its instance inherits the cold-state rule.
      if(!burning) {assert.equal(state.stoveFlame,false);assert.equal(state.coal,'0');}
      assert.equal(state.front,true);assert.equal(state.rear,true);
      assert.ok(state.fuel.x>state.bed.x && state.fuel.right<state.bed.right);
      assert.ok(state.fuel.bottom>state.bed.y && state.fuel.bottom<state.bed.bottom);
      assert.equal(state.running,0);
      const shot=await send('Page.captureScreenshot',{format:'png',fromSurface:true});
      writeFileSync('/tmp/404-firepit-'+width+'-'+time+'-'+weather+'.png',Buffer.from(shot.data,'base64'));
    }
    await evaluate(send,`portfolioSceneTime.setTime('night');portfolioWeather.setLocationCondition('clear');document.documentElement.dataset.motion='full'`);
    await finishFiniteAnimations(send,'.cryptid-camp');
    const phases=await evaluate(send,`(()=>{
      const flame=document.querySelector('.flame-outer'),logs=document.querySelector('.fire-logs');
      const animation=flame.getAnimations()[0];if(!animation)throw new Error('missing flame motion');
      animation.pause();
      return [0,460].map(time=>{animation.currentTime=time;const b=logs.getBoundingClientRect();return {flame:getComputedStyle(flame).scale,logs:[b.x,b.y,b.width,b.height]};});
    })()`);
    assert.notEqual(phases[0].flame,phases[1].flame);
    assert.deepEqual(phases[0].logs,phases[1].logs);
    await evaluate(send,`portfolioSceneTime.setTime('day')`);
    await finishFiniteAnimations(send,'.cryptid-camp');
    assert.equal(await evaluate(send,`document.querySelectorAll('.campfire [data-runtime-motion="live"],.smoke-404 [data-runtime-motion="live"]').length`),0);
    await evaluate(send,`portfolioSceneTime.setTime('evening')`);
    await finishFiniteAnimations(send,'.cryptid-camp');
    assert.ok(await evaluate(send,`document.querySelectorAll('.campfire [data-runtime-motion="live"]').length>0`));
  }
  assert.deepEqual(errors,[]);
} finally {await browser?.close();await server.close();}
