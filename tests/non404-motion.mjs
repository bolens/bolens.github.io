import assert from 'node:assert/strict';
import test from 'node:test';
import { startUI } from './lib/ui-fixture.mjs';
import { evaluate, finishFiniteAnimations, hoverElement, waitFor, freezeAnimationClock, navigate } from './lib/browser-test.mjs';

const ui = await startUI();
const { send } = ui;
try {
  await test('saved reduced motion keeps the home route and completed project check visible', async () => {
    await ui.load('/', "localStorage.setItem('portfolio-motion','reduced')");
    const state = await evaluate(send, `(()=>{const style=s=>getComputedStyle(document.querySelector(s));return {route:style('.signal-path').strokeDashoffset,check:style('.visual-shield .check').strokeDashoffset,pulse:style('.map-node .pulse').opacity,packet:style('.ddns-packets').display}})()`);
    assert.deepEqual(state, { route: '0px', check: '0px', pulse: '0', packet: 'none' });
  });
  await test('saved reduced motion leaves all case chapter controls visible and the current node emphasized', async () => {
    await ui.load('/case-studies/uddns/', "localStorage.setItem('portfolio-motion','reduced')");
    const state = await evaluate(send, `({opacity:[...document.querySelectorAll('.case-route circle,.case-route text')].map(n=>getComputedStyle(n).opacity),scale:getComputedStyle(document.querySelector('.case-route a[aria-current] circle')).scale})`);
    assert.ok(state.opacity.length >= 8);
    assert.ok(state.opacity.every(value => value === '1'), JSON.stringify(state));
    assert.equal(state.scale, '1.16');
  });
  await test('completed case entrance releases the current and focused node scale', async () => {
    await ui.load('/case-studies/uddns/');
    await finishFiniteAnimations(send, '.case-route');
    await evaluate(send, `document.querySelectorAll('.case-route a')[1].focus({preventScroll:true})`);
    await finishFiniteAnimations(send, '.case-route');
    const scales = await evaluate(send, `[...document.querySelectorAll('.case-route circle')].map(n=>getComputedStyle(n).scale)`);
    assert.equal(scales[0], '1.16');
    assert.equal(scales[1], '1.16');
  });
  await test('native keyboard activation follows SVG chapter links without application exceptions', async () => {
    await ui.load('/case-studies/uddns/', "localStorage.setItem('portfolio-motion','reduced')");
    await evaluate(send, `document.querySelector('.case-route a[href="#correction"]').focus()`);
    await ui.key('Enter', 'Enter');
    await waitFor(send, `location.hash==='#correction'&&document.querySelector('.case-route a[aria-current]').getAttribute('href')==='#correction'&&document.querySelector('#correction').getBoundingClientRect().top<=innerHeight*.38`, 'native chapter activation and alignment');
    assert.deepEqual(ui.errors, []);
  });
  await test('visible home illustrations pause behind overlays and resume only while visible', async () => {
    await send('Emulation.setDeviceMetricsOverride', { width:1440, height:900, deviceScaleFactor:1, mobile:false });
    await ui.load('/');
    await waitFor(send, `document.querySelector('.signal-map').dataset.motion==='running'`, 'visible map running');
    assert.equal(await evaluate(send, `document.querySelector('.signal-map svg').animationsPaused()`), false);
    await evaluate(send, `document.querySelector('.project-visual').scrollIntoView({block:'center',behavior:'instant'})`);
    await waitFor(send, `document.querySelector('.project-visual').dataset.motion==='running'&&document.querySelector('.signal-map').dataset.motion==='paused'`, 'independent illustration visibility');
    const read = `(()=>{const card=document.querySelector('.project-visual');return {css:getComputedStyle(card.querySelector('.endpoint-core')).animationPlayState,svg:card.querySelector('svg').animationsPaused(),map:document.querySelector('.signal-map').dataset.motion}})()`;
    assert.deepEqual(await evaluate(send, read), { css:'running', svg:false, map:'paused' });
    await ui.open();
    assert.deepEqual(await evaluate(send, read), { css:'paused', svg:true, map:'paused' });
    await ui.closeCommands();
    assert.deepEqual(await evaluate(send, read), { css:'running', svg:false, map:'paused' });
    await evaluate(send, `portfolioAppearance.setMotion('reduced')`);
    assert.equal(await evaluate(send, `document.querySelector('.project-visual svg').animationsPaused()`), true);
    assert.equal(await evaluate(send, `getComputedStyle(document.querySelector('.endpoint-core')).animationName`), 'none');
  });
  for (const path of ['/about/', '/work/', '/case-studies/uddns/']) {
    await test(`${path} introduction follows reading order without moving layout`, async () => {
      await freezeAnimationClock(send);
      try {
        await ui.load(path);
        const phases = await evaluate(send, `(()=>{const intro=document.querySelector('.page-intro,.case-intro');const effects=intro.getAnimations({subtree:true}).filter(a=>a.animationName==='intro-settle');return effects.map(a=>{a.pause();const node=a.effect.target;const timing=a.effect.getTiming();a.currentTime=timing.delay;const start=getComputedStyle(node);const first={opacity:Number(start.opacity),y:parseFloat(start.translate.split(' ')[1])};const box=node.getBoundingClientRect();a.currentTime=timing.delay+timing.duration;const end=getComputedStyle(node);const finalBox=node.getBoundingClientRect();return {tag:node.tagName,delay:timing.delay,first,end:Number(end.opacity),widthDelta:finalBox.width-box.width,heightDelta:finalBox.height-box.height}})})()`);
        assert.deepEqual(phases.map(p=>p.tag), ['P','H1','P']);
        assert.equal(phases[0].delay, 0);
        assert.ok(phases[1].delay > phases[0].delay && phases[2].delay > phases[1].delay, 'reading order must be staggered');
        for (const phase of phases) {
          assert.ok(phase.first.opacity >= .5 && phase.first.opacity < 1, 'entrance must retain readable content');
          assert.ok(phase.first.y > 0 && phase.first.y <= 12, 'entrance travel must stay subtle');
          assert.equal(phase.end, 1);
          assert.equal(phase.widthDelta, 0);
          assert.equal(phase.heightDelta, 0);
        }
        await evaluate(send, `portfolioAppearance.setMotion('reduced')`);
        assert.equal(await evaluate(send, `document.querySelector('.page-intro,.case-intro').getAnimations({subtree:true}).length`), 0);
      } finally { await send('Animation.setPlaybackRate', { playbackRate:1 }); }
    });
  }
  await test('system reduced motion and disabled JavaScript retain complete non-404 graphics', async () => {
    await send('Emulation.setEmulatedMedia', { features:[{name:'prefers-reduced-motion',value:'reduce'}] });
    try {
      for (const scripting of [true, false]) {
        await send('Emulation.setScriptExecutionDisabled', { value:!scripting });
        for (const path of ['/', '/about/', '/work/', '/case-studies/uddns/']) {
          await navigate(send, 'about:blank');
          await navigate(send, ui.origin + path);
          const state = await evaluate(send, `(()=>{const selector='.signal-path,.visual-shield .check,.case-route circle,.case-route text,.page-intro h1,.case-intro h1';return [...document.querySelectorAll(selector)].map(n=>{const style=getComputedStyle(n);return {name:n.tagName,opacity:Number(style.opacity),animation:style.animationName,offset:style.strokeDashoffset}})})()`);
          assert.ok(state.length > 0, path);
          assert.ok(state.every(n=>n.opacity===1 && n.animation==='none'), JSON.stringify({path,scripting,state}));
          if (path === '/') assert.ok(state.every(n=>n.offset==='0px'));
        }
      }
    } finally {
      await send('Emulation.setScriptExecutionDisabled', { value:false });
      await send('Emulation.setEmulatedMedia', { features:[{name:'prefers-reduced-motion',value:'no-preference'},{name:'prefers-color-scheme',value:'light'}] });
    }
  });
  await test('hero entrance and completed trace fit the viewport including the scrollbar gutter', async () => {
    await freezeAnimationClock(send);
    try {
      for (const width of [390, 1440]) {
        await send('Emulation.setDeviceMetricsOverride', { width, height:900, deviceScaleFactor:1, mobile:false });
        await ui.load('/');
        for (const phase of ['start', 'finished']) {
          if (phase === 'finished') await finishFiniteAnimations(send, 'html');
          const size = await evaluate(send, `({viewport:document.documentElement.clientWidth,content:document.documentElement.scrollWidth})`);
          assert.ok(size.content <= size.viewport, JSON.stringify({width,phase,...size}));
        }
      }
    } finally { await send('Animation.setPlaybackRate', { playbackRate:1 }); }
  });
  for (const [path, selector, text] of [
    ['/work/', '.index-list a', '.index-list a small'],
    ['/about/', '.about-principles article', '.about-principles article > p:last-child'],
    ['/about/', '.about-field-notes dl div', '.about-field-notes dd'],
    ['/', '.toolbox dl div', '.toolbox dd'],
  ]) {
    await test(`${selector} hover preserves text measure at narrow and desktop widths`, async () => {
      for (const width of [390, 1440]) {
        await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
        await ui.load(path);
        await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 0, y: 0 });
        await evaluate(send, `document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center',behavior:'instant'})`);
        const measure = `(()=>{const box=document.querySelector(${JSON.stringify(text)}).getBoundingClientRect();return {width:box.width,height:box.height}})()`;
        const before = await evaluate(send, measure);
        await hoverElement(send, selector);
        await finishFiniteAnimations(send, selector);
        assert.deepEqual(await evaluate(send, measure), before, `${selector} at ${width}px`);
      }
    });
  }
  assert.deepEqual(ui.errors, []);
} finally { await ui.close(); }
