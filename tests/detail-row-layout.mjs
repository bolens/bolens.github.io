import assert from 'node:assert/strict';
import test from 'node:test';
import {startUI} from './lib/ui-fixture.mjs';
import {evaluate,hoverElement,freezeAnimationClock} from './lib/browser-test.mjs';

const ui=await startUI();const {send}=ui;
try {
  await freezeAnimationClock(send);
  for(const [path,selector] of [['/about/','.about-field-notes dl > div'],['/','.toolbox dl > div'],['/work/','.index-list > a']]) {
    for(const width of [320,390,781,1024,1440]) {
      await test(`${selector} leaves room for hover accents and content at ${width}px`,async()=>{
        await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
        await ui.load(path);
        await evaluate(send, `document.querySelectorAll(${JSON.stringify(selector)}).forEach(row=>{row.style.animation='none'})`);
        const count=await evaluate(send,`document.querySelectorAll(${JSON.stringify(selector)}).length`);
        for(let index=0;index<count;index++) {
          const row=`${selector}:nth-child(${index+1})`;
          await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:0});
          await evaluate(send,`document.querySelector(${JSON.stringify(row)}).scrollIntoView({block:'center',behavior:'instant'})`);
          const read=`(()=>{const row=document.querySelector(${JSON.stringify(row)});const box=row.getBoundingClientRect();const children=[...row.children].map(n=>{const b=n.getBoundingClientRect();return {tag:n.tagName,left:b.left-box.left,right:box.right-b.right,top:b.top-box.top,bottom:b.bottom-box.top,width:b.width,height:b.height}});return {children,width:box.width,height:box.height}})()`;
          const before=await evaluate(send,read);
          await hoverElement(send,row);
          for(const time of [0,170,340,510,680]) {
            await evaluate(send,`document.querySelector(${JSON.stringify(row)}).getAnimations({subtree:true}).forEach(a=>{if(typeof a.effect.getTiming().duration==='number'){a.pause();a.currentTime=${time}}})`);
            const state=await evaluate(send,read);
            assert.deepEqual(state.children.filter(n=>n.tag!=='STRONG'),before.children.filter(n=>n.tag!=='STRONG'),'hover must not move or resize the text');
            for(const child of state.children) {
              assert.ok(child.left>=7&&child.right>=3,JSON.stringify({path,width,index,time,child}));
              assert.ok(child.bottom<=state.height,'content must stay inside its row');
            }
            if(path==='/work/'&&width<=780) {
              const title=state.children.find(n=>n.tag==='SPAN');const language=state.children.find(n=>n.tag==='I');
              assert.ok(Math.abs(title.left-language.left)<1,'mobile language must align below the project name');
              assert.ok(language.top>=title.bottom,'mobile language must not overlap the title');
            }
            if(path==='/about/') {
              const [term,description]=state.children;
              if(width<=781) assert.ok(description.top>=term.bottom+8,'narrow notes must stack instead of squeezing two columns');
              else assert.ok(Math.abs(term.top-description.top)<1,'wide labels must align with the first description line');
            }
          }
        }
      });
    }
  }
  await test('hovered detail rows retain readable descriptions in every night palette',async()=>{
    for(const [path,selector,text] of [['/about/','.about-field-notes dl > div','dd'],['/','.toolbox dl > div','dd'],['/work/','.index-list > a','small']]) {
      await ui.load(path);await hoverElement(send,selector);
      const ratios=await evaluate(send,`(()=>{const row=document.querySelector(${JSON.stringify(selector)});const text=row.querySelector(${JSON.stringify(text)});const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d');const luminance=color=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=color;ctx.fillRect(0,0,1,1);const channels=[...ctx.getImageData(0,0,1,1).data].slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722};portfolioAppearance.setMotion('reduced');portfolioAppearance.setTheme('night');return Object.keys(portfolioThemeData.palettes).map(palette=>{portfolioAppearance.setPalette(palette);const a=luminance(getComputedStyle(text).color),b=luminance(getComputedStyle(row).backgroundColor);return {palette,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)}})})()`);
      for(const sample of ratios)assert.ok(sample.ratio>=4.5,JSON.stringify({path,...sample}));
    }
  });
  assert.deepEqual(ui.errors,[]);
} finally {await ui.close()}
