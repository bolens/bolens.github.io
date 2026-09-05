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
    await waitFor(send,`document.querySelector('.hybrid-effects-ready') && !document.documentElement.classList.contains('is-loading')`,'weather ready');
    for(const [weather,selector] of [['rainy','.weather-rain'],['snowy','.weather-snow'],['windy','.weather-wind'],['thunderstorm','.weather-rain']]) {
      await evaluate(send,`portfolioAppearance.setTheme('${weather==='thunderstorm'?'night':'day'}');portfolioSceneTime.setTime('${weather==='thunderstorm'?'night':'day'}');portfolioWeather.setLocationCondition('${weather}')`);
      await finishFiniteAnimations(send,'.cryptid-camp');
      const state=await evaluate(send,`(()=>{
        const node=document.querySelector('${selector}'),animation=node.getAnimations().find(a=>a.animationName.startsWith('weather-'));
        if(!animation)throw new Error('weather animation missing');
        for(const a of document.querySelector('.cryptid-camp').getAnimations({subtree:true}))a.pause();
        const duration=animation.effect.getTiming().duration;
        const phases=[0,.25,.5,.75,.999999].map(phase=>{animation.currentTime=phase*duration;const s=getComputedStyle(node);return {xy:s.translate.split(' ').map(parseFloat),opacity:+s.opacity};});
        animation.currentTime=.5*duration;
        const tile=document.querySelector('${weather==='snowy'?'#snow-fall-tile':'#rain-fall-tile'}');
        const gustDurations=['.camp-pines','.river-willows','.camp-tent > use:first-child'].map(s=>document.querySelector(s)).filter(el=>el.dataset.runtimeMotion==='live').map(el=>parseFloat(getComputedStyle(el).animationDuration)*1000);
        return {phases,duration,gustDurations,direction:animation.effect.getTiming().direction,visibility:getComputedStyle(node).visibility,tileHeight:+tile.getAttribute('height'),overflow:document.documentElement.scrollWidth>innerWidth,liveWeather:document.querySelectorAll('.weather-rain[data-runtime-motion="live"],.weather-snow[data-runtime-motion="live"],.weather-wind[data-runtime-motion="live"]').length};
      })()`);
      assert.equal(state.visibility,'visible');assert.equal(state.overflow,false);assert.equal(state.liveWeather,1);
      assert.equal(state.direction,'normal');
      const first=state.phases[0],last=state.phases.at(-1);
      if(weather==='windy') {
        assert.equal(first.opacity,0);assert.ok(last.opacity<.001);
        assert.ok(last.xy[0]>first.xy[0]+240);
        assert.ok(state.gustDurations.every(duration=>Math.abs(duration-state.duration)<.1),'visible vegetation and fabric share the broad gust period');
      } else {
        assert.ok(state.phases.every((p,i)=>!i||p.xy[1]>state.phases[i-1].xy[1]),'precipitation always falls down');
        assert.ok(Math.abs(last.xy[1]-first.xy[1]-state.tileHeight)<.01,'reset equals a complete tile period');
        const dx=last.xy[0]-first.xy[0];
        assert.ok(Math.abs(dx-(weather==='snowy'?0:36))<.01,'horizontal reset matches texture shear');
        assert.ok(state.phases.every(p=>p.opacity===first.opacity),'no whole-field flashing');
      }
      const shot=await send('Page.captureScreenshot',{format:'png',fromSurface:true});
      writeFileSync('/tmp/404-weather-flow-'+width+'-'+weather+'.png',Buffer.from(shot.data,'base64'));
    }
    await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
    for(const weather of ['rainy','snowy','windy']) {
      await evaluate(send,`portfolioWeather.setLocationCondition('${weather}')`);
      await finishFiniteAnimations(send,'.cryptid-camp');
      assert.equal(await evaluate(send,`document.querySelector('.cryptid-camp').getAnimations({subtree:true}).filter(a=>a.playState==='running').length`),0);
    }
    await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
  }
  assert.deepEqual(errors,[]);
} finally {await browser?.close();await server.close();}
