import assert from 'node:assert/strict';
import test from 'node:test';
import {startUI} from './lib/ui-fixture.mjs';
import {evaluate,freezeAnimationClock,hoverElement} from './lib/browser-test.mjs';

const ui=await startUI();const {send}=ui;
try {
  await freezeAnimationClock(send);
  for(const width of [320,390,780,781,1024,1440]) {
    await test(`selected-work evidence clears dividers at ${width}px`,async()=>{
      await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
      await ui.load('/');
      await evaluate(send,`document.querySelectorAll('.project,.project-copy').forEach(n=>n.style.animation='none')`);
      const count=await evaluate(send,`document.querySelectorAll('.project').length`);
      assert.ok(count>0);
      for(let index=1;index<=count;index++) {
        const selector=`.project:nth-child(${index}) .project-link`;
        await evaluate(send,`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center',behavior:'instant'})`);
        for(const state of ['rest','hover','focus']) {
          await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:0});
          if(state==='hover')await hoverElement(send,selector);
          if(state==='focus')await evaluate(send,`document.querySelector(${JSON.stringify(selector)}).focus({preventScroll:true})`);
          for(const time of [0,170,340,680]) {
            const cells=await evaluate(send,`(()=>{const card=document.querySelector(${JSON.stringify(selector)});card.getAnimations({subtree:true}).forEach(a=>{if(typeof a.effect.getTiming().duration==='number'){a.pause();a.currentTime=${time}}});return [...card.querySelectorAll('.project-evidence > div')].map(cell=>{const b=cell.getBoundingClientRect();return {left:b.left,right:b.right,top:b.top,bottom:b.bottom,text:[...cell.children].flatMap(n=>{const r=document.createRange();r.selectNodeContents(n);return [...r.getClientRects()].map(b=>({left:b.left,right:b.right,top:b.top,bottom:b.bottom}))})}})})()`);
            assert.equal(cells.length,2);
            for(const [i,cell] of cells.entries())for(const rect of cell.text) {
              const context=JSON.stringify({width,index,state,time,i,cell,rect});
              assert.ok(rect.left>=cell.left+(i===1?12:0)-.1,context);
              assert.ok(rect.right<=cell.right-(i===0?12:0)+.1,context);
              assert.ok(rect.top>=cell.top&&rect.bottom<=cell.bottom+.1,context);
            }
          }
          await evaluate(send,`document.activeElement.blur()`);
        }
      }
    });
  }
  assert.deepEqual(ui.errors,[]);
} finally {await ui.close()}
