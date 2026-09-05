import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {startBrowser} from './lib/cdp-browser.mjs';
import {startSiteServer} from './lib/site-server.mjs';
import {evaluate,navigate,waitFor,finishFiniteAnimations} from './lib/browser-test.mjs';

const server=await startSiteServer(new URL('..',import.meta.url).pathname);
const errors=[];let browser;
try {
 browser=await startBrowser(m=>{if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);});
 const {send}=browser;await send('Runtime.enable');
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 for(const [width,height] of [[1440,900],[390,844]]) {
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  await navigate(send,server.origin+'/404.html');
  await waitFor(send,"document.querySelector('.hybrid-effects-ready')&&!document.documentElement.classList.contains('is-loading')",'scene ready');
  for(const [time,weather,outdoor] of [['day','clear',true],['day','drought',true],['morning','rainy',true],['evening','wet',true],['day','snowy',false],['day','thunderstorm',false],['night','clear',false],['twilight','dry',false]]) {
   await evaluate(send,`portfolioAppearance.setTheme('${outdoor?'night':'day'}');portfolioSceneTime.setTime('${time}');portfolioWeather.setLocationCondition('${weather}')`);
   await finishFiniteAnimations(send,'.cryptid-camp');
   const result=await evaluate(send,`(()=>{
    const visible=el=>!!el&&el.getBoundingClientRect().width>0&&getComputedStyle(el).display!=='none';
    const activities=document.querySelector('[data-region="daytime-camp-activities"]');
    const boxes=['fishing-camper','fishing-companion','mushroom-picker'].map(name=>{const el=document.querySelector('[data-region="'+name+'"]');const b=el?.getBoundingClientRect();return {visible:visible(el),inside:!!b&&b.left>=0&&b.right<=innerWidth&&b.bottom<=innerHeight};});
    const peeks=[...document.querySelectorAll('.daytime-cryptid')].map(g=>{const f=g.querySelector('[data-region="peeking-face"]'),t=g.querySelector('[data-region="cover-tree"]');return f.getBBox().height*f.transform.baseVal.consolidate().matrix.a/t.getBBox().height;});
    const perch=document.querySelector('.daytime-perched'),tree=document.querySelector('[data-region="perch-tree"]');
    const p=perch.getBoundingClientRect(),t=tree.getBoundingClientRect();
    return {activities:visible(activities),boxes,peeks,perchOverlap:p.bottom>t.top+20&&p.top<t.top+40,indoor:['.tent-guy','.tent-girl','.tent-dog','.tent-camera'].map(s=>visible(document.querySelector(s))),overflow:document.documentElement.scrollWidth>innerWidth,running:document.querySelector('.cryptid-camp').getAnimations({subtree:true}).filter(a=>a.playState==='running').length};
   })()`);
   assert.equal(result.activities,outdoor);
   if(outdoor){
    const contacts=await evaluate(send,`(()=>{
     const g=document.querySelector('.riverbank-angler');
     const inWater=(x,y)=>{const p=new DOMPoint(x,y).matrixTransform(g.getScreenCTM());return [...document.querySelectorAll('.river-water > path')].filter(n=>n.getAttribute('fill')!=='none').some(n=>n.isPointInFill(p.matrixTransform(n.getScreenCTM().inverse())));};
     const shift=parseFloat(getComputedStyle(g).getPropertyValue('--fishing-water-shift'))||0;
     return {feet:inWater(420,552),paws:inWater(477,556),float:inWater(325,532+shift)};
    })()`);
    assert.deepEqual(contacts,{feet:false,paws:false,float:true},width+' '+weather+' bank contacts');
    const proportions=await evaluate(send,`(()=>{
     const person=document.querySelector('[data-region="fishing-camper"]'),dog=document.querySelector('[data-region="fishing-companion"]'),picker=document.querySelector('[data-region="mushroom-picker"]');
     const p=person.getBoundingClientRect(),d=dog.getBoundingClientRect(),k=picker.getBoundingClientRect();
     const project=(el,x,y)=>new DOMPoint(x,y).matrixTransform(el.getScreenCTM());
     const tackle=document.querySelector('[data-region="fishing-tackle"]');
     // The matching symbol aspect ratios map these hand/grip coordinates into one ground plane.
     const hand=project(person,390+(66-112/170*100)/2+4*112/170,443+62*112/170);
     const grip=project(tackle,393,484);
     return {dogRatio:d.height/p.height,foregroundRatio:k.height/p.height,gripGap:Math.hypot(hand.x-grip.x,hand.y-grip.y),groundGap:Math.abs(d.bottom-p.bottom)/p.height};
    })()`);
    assert.ok(proportions.dogRatio>.35&&proportions.dogRatio<.5,'seated windhound is knee-to-thigh height beside the adult');
    assert.ok(proportions.foregroundRatio>1&&proportions.foregroundRatio<1.5,'foreground picker follows scene depth');
    assert.ok(proportions.gripGap<1,'fishing hand meets rod grip');
    assert.ok(proportions.groundGap<.08,'dog and angler share bank elevation');
   }
   assert.deepEqual(result.indoor,[!outdoor,!outdoor,!outdoor,!outdoor]);
   if(outdoor){assert.ok(result.boxes.every(b=>b.visible&&b.inside));assert.ok(result.peeks.every(r=>r<.2));assert.equal(result.perchOverlap,true);}
   assert.equal(result.overflow,false);assert.equal(result.running,0);
   if(time==='day'&&weather==='clear'){const shot=await send('Page.captureScreenshot',{format:'png',fromSurface:true});writeFileSync(`/tmp/404-activities-${width}.png`,Buffer.from(shot.data,'base64'));}
  }
 }
 await send('Emulation.setScriptExecutionDisabled',{value:true});
 for(const scheme of ['light','dark']) {
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:scheme},{name:'prefers-reduced-motion',value:'reduce'}]});
  await navigate(send,server.origin+'/404.html');
  const fallback=await evaluate(send,"({outdoor:getComputedStyle(document.querySelector('.daytime-activities')).display,indoor:getComputedStyle(document.querySelector('.tent-guy')).display})");
  assert.deepEqual(fallback,{outdoor:scheme==='light'?'inline':'none',indoor:scheme==='light'?'none':'inline'},'script-disabled '+scheme+' occupancy');
 }
 assert.deepEqual(errors,[]);
}finally{await browser?.close();await server.close();}
