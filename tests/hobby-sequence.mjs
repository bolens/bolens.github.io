import assert from 'node:assert/strict';
import test from 'node:test';
import { startUI } from './lib/ui-fixture.mjs';
import { evaluate, waitFor, finishFiniteAnimations, freezeAnimationClock, navigate } from './lib/browser-test.mjs';

const ui = await startUI();
const { send } = ui;
const seek = async (time) => evaluate(send, `(()=>{const section=document.querySelector('.hobbies');section.getAnimations({subtree:true}).forEach(a=>{if(typeof a.effect.getTiming().duration==='number'){a.pause();a.currentTime=${time}}});section.querySelectorAll('svg').forEach(s=>{s.pauseAnimations();s.setCurrentTime(${time}/1000)})})()`);
const load = async (width = 1440, theme = 'day') => {
  await send('Emulation.setDeviceMetricsOverride', { width, height:900, deviceScaleFactor:1, mobile:false });
  await ui.load('/', `localStorage.setItem('portfolio-theme',${JSON.stringify(theme)})`);
  await evaluate(send, `document.querySelector('.hobbies').scrollIntoView({block:'center',behavior:'instant'})`);
  await waitFor(send, `document.querySelector('.hobbies').dataset.motion==='running'`, 'visible hobby sequence');
  await finishFiniteAnimations(send, 'html');
  await evaluate(send, `dispatchEvent(new CustomEvent('ui-overlay-change',{detail:{active:true}}))`);
};
try {
  await freezeAnimationClock(send);
  await test('badge color choreography retains its scene colors in day and night modes', async () => {
    for (const theme of ['day','night']) {
      await load(1440, theme);
      for (const [time, selector, property, token] of [
        [1000,'.hike-night-sky','fill','scene-sky'],
        [1000,'.hike-pines','stroke','art-forest'],
        [4800,'.camp-tent','stroke','art-hot'],
        [4800,'.camp-ground','stroke','art-forest'],
        [7000,'.bike-wheel','stroke','art-cool'],
        [14000,'.beer-liquid','fill','art-warm'],
        [21000,'.disc-pin','stroke','scene-celestial'],
        [21000,'.disc-basket','stroke','art-hot'],
        [23990,'.camp-tent','stroke','ink'],
      ]) {
        await seek(time);
        const colors = await evaluate(send, `(()=>{const rgba=color=>{const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data]};return {actual:rgba(getComputedStyle(document.querySelector(${JSON.stringify(selector)}))[${JSON.stringify(property)}]),expected:rgba(getComputedStyle(document.documentElement).getPropertyValue('--${token}'))}})()`);
        assert.deepEqual(colors.actual, colors.expected, `${theme} ${selector} at ${time}ms`);
      }
    }
  });
  await test('hobby choreography uses at most 85 CSS effects without losing its five stages', async () => {
    await load();
    const state = await evaluate(send, `({effects:document.querySelector('.hobbies').getAnimations({subtree:true}).length,labels:[...document.querySelectorAll('.hobby-route li>span')].map(n=>n.textContent)})`);
    assert.deepEqual(state.labels, ['Hiking','Camping','Cycling','Craft beer','Disc golf']);
    assert.ok(state.effects <= 85, `${state.effects} CSS effects exceed the choreography budget`);
  });
  await test('foreground figures retain proportions and clear the labels across responsive widths', async () => {
    for (const width of [390,768,1440]) {
      await load(width); await seek(4800);
      const state = await evaluate(send, `(()=>{const matrix=document.querySelector('.hobby-flight-layer').getScreenCTM();return {x:matrix.a,y:matrix.d,treeBottom:document.querySelector('.route-camp-tree-foreground').getBoundingClientRect().bottom,labelTop:document.querySelector('.hobby-camping>span').getBoundingClientRect().top,overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth}})()`);
      assert.ok(Math.abs(state.x-state.y)<.001, `distorted foreground at ${width}px: ${JSON.stringify(state)}`);
      assert.ok(state.treeBottom < state.labelTop, `tree overlaps the camping label at ${width}px`);
      assert.equal(state.overflow, false);
    }
  });
  await test('disc-to-tap handoff stays attached at mobile and desktop sizes', async () => {
    for (const width of [390,768,1440]) {
      await load(width); await seek(11800);
      const gap = await evaluate(send, `(()=>{const a=document.querySelector('.traveler-disc .disc-body').getBoundingClientRect();const b=document.querySelector('.beer-disc-handoff ellipse').getBoundingClientRect();return Math.hypot(a.x+a.width/2-b.x-b.width/2,a.y+a.height/2-b.y-b.height/2)})()`);
      assert.ok(gap < 5, `${width}px handoff gap: ${gap}px`);
    }
  });
  await test('the flight and reduced-motion landing marker meet the basket after resizing', async () => {
    await load();
    for (const width of [390,768,1440,390]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height:900, deviceScaleFactor:1, mobile:false });
      await seek(21840);
      await waitFor(send, `(()=>{const flight=document.querySelector('.traveler-disc .disc-body').getBoundingClientRect();const caught=document.querySelector('.basket-caught-disc').getBoundingClientRect();return Math.hypot(flight.x+flight.width/2-caught.x-caught.width/2,flight.y+flight.height/2-caught.y-caught.height/2)<1})()`, `basket catch after resizing to ${width}px`);
    }
    await evaluate(send, `portfolioAppearance.setMotion('reduced')`);
    const gap = await evaluate(send, `(()=>{const a=document.querySelector('.hobby-landed-disc').getBoundingClientRect();const b=document.querySelector('.basket-caught-disc').getBoundingClientRect();return Math.hypot(a.x+a.width/2-b.x-b.width/2,a.y+a.height/2-b.y-b.height/2)})()`);
    assert.ok(gap < 1, `static catch gap: ${gap}px`);
  });
  await test('the catch remains visible before the celebration fades into the next loop', async () => {
    await load();
    const read = () => evaluate(send, `({caught:Number(getComputedStyle(document.querySelector('.basket-caught-disc')).opacity),cheer:Number(getComputedStyle(document.querySelector('.hobby-cheerers')).opacity)})`);
    await seek(22800); const celebration = await read();
    assert.ok(celebration.caught>.9 && celebration.cheer>.9);
    await seek(23990); const ending = await read();
    assert.ok(ending.caught<.05 && ending.cheer<.05, JSON.stringify(ending));
  });
  await test('saved and system reduced motion stop mid-sequence without hiding the hobby labels', async () => {
    for (const mode of ['saved','system']) {
      await load(); await seek(14000);
      if (mode === 'saved') await evaluate(send, `portfolioAppearance.setMotion('reduced')`);
      else await send('Emulation.setEmulatedMedia', { features:[{name:'prefers-color-scheme',value:'light'},{name:'prefers-reduced-motion',value:'reduce'}] });
      const state = await evaluate(send, `(()=>{const scene=document.querySelector('.hobby-route');return {effects:scene.getAnimations({subtree:true}).length,paused:[...scene.querySelectorAll('svg')].every(s=>s.animationsPaused()),travelers:[...scene.querySelectorAll('.hobby-traveler,.route-bigfoot,.route-bike')].map(n=>getComputedStyle(n).display),landed:getComputedStyle(scene.querySelector('.hobby-landed-disc')).display,labels:[...scene.querySelectorAll('li>span')].every(n=>getComputedStyle(n).visibility==='visible'&&n.getBoundingClientRect().height>0)}})()`);
      assert.deepEqual(state, {effects:0,paused:true,travelers:['none','none','none'],landed:'block',labels:true});
      await send('Emulation.setEmulatedMedia', { features:[{name:'prefers-color-scheme',value:'light'},{name:'prefers-reduced-motion',value:'no-preference'}] });
    }
  });
  await test('the static disc stays in the basket with JavaScript disabled', async () => {
    await send('Emulation.setEmulatedMedia', { features:[{name:'prefers-color-scheme',value:'light'},{name:'prefers-reduced-motion',value:'reduce'}] });
    await send('Emulation.setScriptExecutionDisabled', { value:true });
    try {
      for (const width of [390,1440]) {
        await send('Emulation.setDeviceMetricsOverride', { width,height:900,deviceScaleFactor:1,mobile:false });
        await navigate(send, 'about:blank'); await navigate(send, ui.origin + '/');
        const state = await evaluate(send, `(()=>{const disc=document.querySelector('.hobby-landed-disc');const a=disc.getBoundingClientRect();const b=document.querySelector('.disc-basket-rim').getBoundingClientRect();return {display:getComputedStyle(disc).display,gap:Math.hypot(a.x+a.width/2-b.x-b.width/2,a.y+a.height/2-b.y-b.height/2),effects:document.querySelector('.hobby-route').getAnimations({subtree:true}).length}})()`);
        assert.equal(state.display, 'block');
        assert.ok(state.gap < 1, JSON.stringify(state));
        assert.equal(state.effects, 0);
      }
    } finally { await send('Emulation.setScriptExecutionDisabled', { value:false }); }
  });
  assert.deepEqual(ui.errors, []);
} finally { await ui.close(); }
