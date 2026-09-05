import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {startUI} from './lib/ui-fixture.mjs';
import {evaluate} from './lib/browser-test.mjs';

const sprite=readFileSync(new URL('../assets/trail-glyphs.svg',import.meta.url),'utf8');
const ui=await startUI();
try {
  await ui.load('/case-studies/uddns/');
  // Inline the authored symbol so its internal geometry can be measured;
  // external <use> shadow trees are not exposed to DOM queries.
  await evaluate(ui.send, `(()=>{const parsed=new DOMParser().parseFromString(${JSON.stringify(sprite)},'image/svg+xml');const style=document.createElement('style');style.textContent=[...parsed.querySelectorAll('style')].map(n=>n.textContent).join('');document.head.append(style);const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.id='role-probe';svg.setAttribute('viewBox','0 0 24 24');svg.style.cssText='width:24px;height:24px;fill:none;stroke-width:1.7;--glyph-role-motion:glyph-role-nod 680ms var(--ease-route)';svg.innerHTML=parsed.querySelector('#glyph-role').innerHTML;document.body.append(svg)})()`);
  await test('role nod stays centered and clear of fixed shoulders through its full cycle', async()=>{
    const states=await evaluate(ui.send, `(()=>{const svg=document.querySelector('#role-probe'),head=svg.querySelector('circle'),shoulders=svg.querySelector('path'),a=head.getAnimations()[0];a.pause();return [0,82,180,286,400,517,600,680].map(time=>{a.currentTime=time;const h=head.getBoundingClientRect(),s=shoulders.getBoundingClientRect();return {time,center:h.x+h.width/2,height:h.height,headBottom:h.bottom,shoulderTop:s.top,shoulders:[s.x,s.y,s.width,s.height],shoulderAnimations:shoulders.getAnimations().length}})})()`);
    for(const state of states){
      assert.ok(Math.abs(state.center-states[0].center)<.01,'head must not wag sideways');
      assert.ok(state.shoulderTop-state.headBottom>1.7,'painted head and shoulders must not touch');
      assert.deepEqual(state.shoulders,states[0].shoulders);
      assert.equal(state.shoulderAnimations,0);
    }
    assert.ok(states[3].height<states[0].height*.85,'nod should foreshorten the head');
    assert.ok(Math.abs(states.at(-1).height-states[0].height)<.01,'nod must return to rest');
  });
} finally {await ui.close()}
