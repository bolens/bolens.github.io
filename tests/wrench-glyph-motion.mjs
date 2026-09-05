import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {startUI} from './lib/ui-fixture.mjs';
import {evaluate} from './lib/browser-test.mjs';

const sprite=readFileSync(new URL('../assets/trail-glyphs.svg',import.meta.url),'utf8');
const ui=await startUI();
try {
  await ui.load('/');
  // Inline the authored symbol to measure its otherwise inaccessible use shadow tree.
  await evaluate(ui.send, `(()=>{const parsed=new DOMParser().parseFromString(${JSON.stringify(sprite)},'image/svg+xml');const style=document.createElement('style');style.textContent=[...parsed.querySelectorAll('style')].map(n=>n.textContent).join('');document.head.append(style);const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.id='wrench-probe';svg.setAttribute('viewBox','0 0 24 24');svg.style.cssText='width:24px;height:24px;fill:none;stroke-width:1.7;--glyph-wrench-motion:glyph-wrench-tighten 680ms var(--ease-route)';svg.innerHTML=parsed.querySelector('#glyph-wrench').innerHTML;document.body.append(svg)})()`);
  await test('wrench turns around a stationary fastener without scaling or leaving its viewport', async()=>{
    const states=await evaluate(ui.send, `(()=>{const svg=document.querySelector('#wrench-probe'),body=svg.querySelector('.glyph-wrench-body'),bolt=svg.querySelector('.glyph-wrench-bolt'),a=body.getAnimations()[0];a.pause();return [0,136,313,354,510,612,680].map(time=>{a.currentTime=time;const m=body.getCTM(),b=bolt.getBBox(),pivot=new DOMPoint(b.x+b.width/2,b.y+b.height/2).matrixTransform(m);const length=body.getTotalLength();const points=Array.from({length:201},(_,i)=>body.getPointAtLength(length*i/200).matrixTransform(m));return {time,pivot:[pivot.x,pivot.y],boltAnimations:bolt.getAnimations().length,scale:Math.hypot(m.a,m.b),angle:Math.atan2(m.b,m.a),bounds:[Math.min(...points.map(p=>p.x)),Math.min(...points.map(p=>p.y)),Math.max(...points.map(p=>p.x)),Math.max(...points.map(p=>p.y))]}})})()`);
    for(const state of states){
      state.pivot.forEach((v,i)=>assert.ok(Math.abs(v-states[0].pivot[i])<.01,'handle must stay centered on the fastener'));
      assert.equal(state.boltAnimations,0,'fastener must remain still');
      assert.ok(Math.abs(state.scale-1)<.001,'tool must not swell');
      assert.ok(state.bounds[0]>.85 && state.bounds[1]>.85 && state.bounds[2]<23.15 && state.bounds[3]<23.15,`stroke clips at ${state.time}ms: ${state.bounds}`);
      assert.ok(state.angle>=-.001,'return must not overshoot backwards');
    }
    assert.ok(states[2].angle>.2,'tightening turn should be visible');
    assert.ok(Math.abs(states[2].angle-states[3].angle)<.001,'brief torque hold should stay still');
    assert.ok(Math.abs(states.at(-1).angle)<.001,'tool must return to rest');
  });
} finally {await ui.close()}
