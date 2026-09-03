import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { startBrowser } from './lib/cdp-browser.mjs';
import { startSiteServer } from './lib/site-server.mjs';

const root = resolve(import.meta.dirname, '..');
const server = await startSiteServer(root);
const browser = await startBrowser(() => {});
const { send } = browser;
const captureEvidence = process.argv.includes('--capture-evidence');
const glyphs = {
  trailhead: 'glyph-sign-flip', compass: 'glyph-compass-spin', map: 'glyph-map-unfold', cairn: 'glyph-cairn-balance',
  switchback: 'glyph-switchback-trace', shelter: 'glyph-shelter-pop', lantern: 'glyph-lantern-swing', binoculars: 'glyph-binoculars-peek',
  fire: 'glyph-fire-flicker', pine: 'glyph-pine-sway', summit: 'glyph-summit-rise', boot: 'glyph-boot-step', stars: 'glyph-stars-twinkle',
  'arrow-east': 'glyph-arrow-dash', 'arrow-north-east': 'glyph-arrow-dash', 'arrow-north': 'glyph-arrow-dash', 'arrow-north-west': 'glyph-arrow-dash',
  'arrow-west': 'glyph-arrow-dash', 'arrow-south-west': 'glyph-arrow-dash', 'arrow-south': 'glyph-arrow-dash', 'arrow-south-east': 'glyph-arrow-dash',
  waypoint: 'glyph-waypoint-hop', search: 'glyph-search-look', close: 'glyph-close-snap', command: 'glyph-command-prompt',
  keyboard: 'glyph-keyboard-tap', palette: 'glyph-palette-mix',
};

const pause = (duration = 50) => new Promise((done) => setTimeout(done, duration));
const hover = async (selector) => {
  const point = await send('Runtime.evaluate', { expression: `(()=>{const element=document.querySelector(${JSON.stringify(selector)});element.scrollIntoView({block:'center',behavior:'instant'});const box=element.getBoundingClientRect();return {x:box.left+box.width/2,y:box.top+box.height/2}})()`, returnByValue: true });
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point.result.value });
  await pause(32);
};

try {
  await Promise.all(['Page.enable', 'Runtime.enable'].map((method) => send(method)));
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: `${server.origin}/` });
  await pause(1200);

  const realContexts = [
    ['.hero-actions .button', '.hero-actions .button use', 'glyph-arrow-dash'],
    ['.principles li', '.principles li use', 'glyph-waypoint-hop'],
    ['.section-heading .eyebrow', '.section-heading .eyebrow use', 'glyph-sign-flip'],
  ];
  for (const [trigger, target, expected] of realContexts) {
    await hover(trigger);
    const animation = await send('Runtime.evaluate', { expression: `document.querySelector(${JSON.stringify(target)}).getAnimations()[0]?.animationName`, returnByValue: true });
    if (animation.result.value !== expected) throw new Error(`${trigger} did not trigger ${expected}`);
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 0, y: 0 });
  }
  await send('Runtime.evaluate', { expression: `portfolioAppearancePicker.open()` });
  await hover('.palette-picker summary');
  const paletteMotion = await send('Runtime.evaluate', { expression: `document.querySelector('.palette-picker summary use').getAnimations()[0]?.animationName`, returnByValue: true });
  if (paletteMotion.result.value !== 'glyph-palette-mix') throw new Error('appearance summary did not trigger glyph-palette-mix');
  await send('Runtime.evaluate', { expression: `portfolioAppearancePicker.close()` });
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 0, y: 0 });
  await send('Runtime.evaluate', { expression: `document.querySelector('.command-palette').showModal()` });
  for (const [trigger, target, expected] of [
    ['.command-palette .overlay-heading', '.command-palette .overlay-heading-glyph use', 'glyph-command-prompt'],
    ['.command-search', '.command-search-glyph use', 'glyph-search-look'],
    ['.command-palette .overlay-close', '.command-palette .overlay-close use', 'glyph-close-snap'],
  ]) {
    await hover(trigger);
    const animation = await send('Runtime.evaluate', { expression: `document.querySelector(${JSON.stringify(target)}).getAnimations()[0]?.animationName`, returnByValue: true });
    if (animation.result.value !== expected) throw new Error(`${trigger} did not trigger ${expected}`);
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 0, y: 0 });
  }
  await send('Runtime.evaluate', { expression: `document.querySelector('.command-palette').close()` });

  await send('Runtime.evaluate', { expression: `(()=>{const gallery=document.createElement('section');gallery.id='glyph-motion-gallery';gallery.setAttribute('aria-label','Glyph motion test gallery');gallery.innerHTML=${JSON.stringify(Object.keys(glyphs).map((name) => `<button class="overlay-close" data-glyph="${name}" aria-label="Animate ${name}"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="/assets/trail-glyphs.svg#glyph-${name}"></use></svg><small>${name}</small></button>`).join(''))};gallery.style.cssText='position:fixed;z-index:100;inset:1rem;display:grid;grid-template-columns:repeat(7,1fr);gap:.65rem;padding:1rem;overflow:auto;background:var(--paper)';gallery.querySelectorAll('button').forEach((button)=>button.style.cssText='width:auto;height:5.4rem;border-radius:5px;display:grid;place-items:center;gap:.25rem');gallery.querySelectorAll('svg').forEach((svg)=>svg.style.cssText='width:2rem;height:2rem');gallery.querySelectorAll('small').forEach((label)=>label.style.cssText='font:600 10px var(--mono)');document.body.append(gallery)})()` });

  const idle = await send('Runtime.evaluate', { expression: `document.querySelectorAll('#glyph-motion-gallery use').length===${Object.keys(glyphs).length}&&[...document.querySelectorAll('#glyph-motion-gallery use')].every((use)=>use.getAnimations().length===0&&getComputedStyle(use).transform==='none')`, returnByValue: true });
  if (!idle.result.value) throw new Error('glyphs must remain static before hover');

  for (const [name, expectedAnimation] of Object.entries(glyphs)) {
    const selector = `[data-glyph="${name}"]`;
    await hover(selector);
    const state = await send('Runtime.evaluate', { expression: `(()=>{const use=document.querySelector(${JSON.stringify(`${selector} use`)});const animation=use.getAnimations()[0];if(!animation)return {missing:true};animation.pause();animation.currentTime=220;const first=getComputedStyle(use).transform;animation.currentTime=470;const second=getComputedStyle(use).transform;return {name:animation.animationName,duration:animation.effect.getTiming().duration,first,second}})()`, returnByValue: true });
    const value = state.result.value;
    if (value.missing || value.name !== expectedAnimation || value.duration !== 680 || value.first === 'none' || value.first === value.second) throw new Error(`${name} hover motion failed: ${JSON.stringify(value)}`);
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 0, y: 0 });
  }

  await send('Runtime.evaluate', { expression: `document.querySelector('[data-glyph="compass"]').focus()` });
  const keyboardMotion = await send('Runtime.evaluate', { expression: `document.querySelector('[data-glyph="compass"] use').getAnimations()[0]?.animationName`, returnByValue: true });
  if (keyboardMotion.result.value !== 'glyph-compass-spin') throw new Error('keyboard focus must trigger the same compass motion');

  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await hover('[data-glyph="fire"]');
  await pause(30);
  const reduced = await send('Runtime.evaluate', { expression: `(()=>{const svg=document.querySelector('[data-glyph="fire"] svg');const use=svg.querySelector('use');return {visible:svg.getBoundingClientRect().width>0,duration:getComputedStyle(use).animationDuration,animations:use.getAnimations().length}})()`, returnByValue: true });
  if (!reduced.result.value.visible || (Number.parseFloat(reduced.result.value.duration) > .00001 && reduced.result.value.animations !== 0)) throw new Error(`reduced motion failed: ${JSON.stringify(reduced.result.value)}`);

  if (captureEvidence) {
    const evidenceDir = '/tmp/bolens-glyph-motion';
    mkdirSync(evidenceDir, { recursive: true });
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
    await send('Runtime.evaluate', { expression: `(()=>{const style=document.createElement('style');style.textContent='#glyph-motion-gallery use{animation:var(--glyph-motion) 680ms var(--ease-pop)}';document.head.append(style)})()` });
    for (const [width, height, viewport] of [[1440, 1000, 'desktop'], [390, 844, 'mobile']]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 });
      await send('Runtime.evaluate', { expression: `document.querySelector('#glyph-motion-gallery').style.gridTemplateColumns='repeat(${width < 600 ? 3 : 7},1fr)'` });
      await send('Runtime.evaluate', { expression: `[...document.querySelectorAll('#glyph-motion-gallery use')].forEach((use)=>{const animation=use.getAnimations()[0];if(animation){animation.pause();animation.currentTime=340}})` });
      const capture = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
      writeFileSync(`${evidenceDir}/${viewport}-phase-mid.png`, Buffer.from(capture.data, 'base64'));
      await send('Runtime.evaluate', { expression: `[...document.querySelectorAll('#glyph-motion-gallery use')].forEach((use)=>{const animation=use.getAnimations()[0];if(animation)animation.currentTime=560})` });
      const lateCapture = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
      writeFileSync(`${evidenceDir}/${viewport}-phase-late.png`, Buffer.from(lateCapture.data, 'base64'));
    }
  }

  console.log(`Glyph hover motion passed ${Object.keys(glyphs).length} glyphs, keyboard parity, idle-state, phase, and reduced-motion checks.`);
} finally {
  await browser.close();
  await server.close();
}
