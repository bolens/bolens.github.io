import { mkdirSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { startBrowser } from './lib/cdp-browser.mjs';
import { startSiteServer } from './lib/site-server.mjs';

const root = resolve(import.meta.dirname, '..');
const server = await startSiteServer(root);
const browser = await startBrowser(() => {});
const { send } = browser;
const captureEvidence = process.argv.includes('--capture-evidence');
const glyphs = {
  trailhead: 'glyph-sign-flip', compass: null, map: null, cairn: null,
  switchback: null, shelter: null, lantern: null, binoculars: null,
  fire: null, pine: 'glyph-pine-sway', summit: null, boot: 'glyph-boot-step', stars: 'glyph-stars-twinkle',
  'arrow-east': 'glyph-arrow-glide', 'arrow-north-east': 'glyph-arrow-glide', 'arrow-north': 'glyph-arrow-glide', 'arrow-north-west': 'glyph-arrow-glide',
  'arrow-west': 'glyph-arrow-glide', 'arrow-south-west': 'glyph-arrow-glide', 'arrow-south': 'glyph-arrow-glide', 'arrow-south-east': 'glyph-arrow-glide',
  waypoint: 'glyph-waypoint-hop', search: 'glyph-search-look', close: 'glyph-close-snap', command: 'glyph-command-prompt',
  keyboard: 'glyph-keyboard-tap', palette: 'glyph-palette-mix', role: null, layers: null, repository: null, backpack: null,
  shield: null, terminal: null, network: null, wrench: null,
};
const internalMotions = {
  compass: ['--glyph-compass-motion', 'glyph-compass-spin'],
  fire: ['--glyph-fire-motion', 'glyph-fire-flicker'],
  binoculars: ['--glyph-binocular-motion', 'glyph-binoculars-zoom'],
  summit: ['--glyph-summit-motion', 'glyph-summit-snow'],
  switchback: ['--glyph-switchback-motion', 'glyph-switchback-trace'],
  cairn: ['--glyph-cairn-top-motion', 'glyph-cairn-top-stack'],
  shelter: ['--glyph-shelter-motion', 'glyph-shelter-pitch'],
  map: ['--glyph-map-left-motion', 'glyph-map-left-unfold'],
  role: ['--glyph-role-motion', 'glyph-role-nod'],
  layers: ['--glyph-layers-motion', 'glyph-layers-settle'],
  repository: ['--glyph-repository-motion', 'glyph-repository-write'],
  backpack: ['--glyph-backpack-motion', 'glyph-backpack-pack'],
  lantern: ['--glyph-lantern-motion', 'glyph-lantern-glow'],
  shield: ['--glyph-shield-motion', 'glyph-shield-check-draw'],
  terminal: ['--glyph-terminal-motion', 'glyph-terminal-cursor-run'],
  network: ['--glyph-network-motion', 'glyph-network-connect'],
  wrench: ['--glyph-wrench-motion', 'glyph-wrench-tighten'],
};
const arrowVectors = {
  'arrow-east': [1, 0], 'arrow-north-east': [1, -1], 'arrow-north': [0, -1], 'arrow-north-west': [-1, -1],
  'arrow-west': [-1, 0], 'arrow-south-west': [-1, 1], 'arrow-south': [0, 1], 'arrow-south-east': [1, 1],
};
const sprite = await readFile(resolve(root, 'assets/trail-glyphs.svg'), 'utf8');
if (!/class="glyph-compass-housing"[\s\S]*class="glyph-accent glyph-compass-needle"/.test(sprite)) throw new Error('compass housing and needle must have independent geometry');
if (!/class="glyph-fire-logs"[\s\S]*class="glyph-accent glyph-fire-flame"/.test(sprite)) throw new Error('fire logs and flame must have independent geometry');
if (!/class="glyph-primary glyph-binocular-body"[\s\S]*class="glyph-binocular-lenses"/.test(sprite)) throw new Error('binocular body and lenses must have independent geometry');
if (!/class="glyph-primary glyph-summit-mountains"[\s\S]*class="glyph-cool glyph-summit-snow" pathLength="1"/.test(sprite)) throw new Error('summit terrain and snowcap must have independent geometry');
if (!/class="glyph-primary glyph-switchback-route" pathLength="1"/.test(sprite)) throw new Error('switchback route must support deterministic stroke tracing');
if (!/glyph-cairn-base[\s\S]*glyph-cairn-middle[\s\S]*glyph-cairn-upper[\s\S]*glyph-cairn-top/.test(sprite)) throw new Error('cairn stones must have independent stacking geometry');
if (!/glyph-shelter-canvas[\s\S]*glyph-shelter-stakes/.test(sprite)) throw new Error('shelter canvas and stakes must have independent geometry');
if (!/glyph-map-left[\s\S]*glyph-map-center[\s\S]*glyph-map-right[\s\S]*glyph-map-route" pathLength="1"/.test(sprite)) throw new Error('map panels and route must have independent unfolding geometry');
if (!/glyph-role-head[\s\S]*glyph-role-shoulders/.test(sprite) || !/glyph-layers-top[\s\S]*glyph-layers-base/.test(sprite) || !/glyph-repository-cover[\s\S]*glyph-repository-lines" pathLength="1"/.test(sprite)) throw new Error('field markers must animate internal geometry while their frames remain fixed');
if (!/glyph-backpack-body[\s\S]*glyph-backpack-flap/.test(sprite)) throw new Error('backpack body and flap must have independent geometry');
if (!/glyph-lantern-housing[\s\S]*glyph-lantern-flame[\s\S]*glyph-lantern-rays/.test(sprite)) throw new Error('lantern housing, flame, and rays must have independent geometry');
for (const glyph of ['shield', 'terminal', 'network', 'wrench']) if (!sprite.includes(`id="glyph-${glyph}"`)) throw new Error(`missing ${glyph} suite glyph`);
for (const motion of ['glyph-compass-spin', 'glyph-fire-flicker', 'glyph-binoculars-zoom', 'glyph-summit-snow', 'glyph-switchback-trace', 'glyph-cairn-top-stack', 'glyph-shelter-pitch', 'glyph-map-left-unfold', 'glyph-role-nod', 'glyph-layers-settle', 'glyph-repository-write', 'glyph-backpack-pack', 'glyph-lantern-glow', 'glyph-shield-check-draw', 'glyph-terminal-cursor-run', 'glyph-network-connect', 'glyph-wrench-tighten']) if (!sprite.includes(`@keyframes ${motion}`)) throw new Error(`${motion} must be defined inside the external sprite`);

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
    ['.hero-actions .button', '.hero-actions .button use', 'glyph-arrow-glide'],
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

  await send('Page.navigate', { url: `${server.origin}/case-studies/uddns/` });
  await pause(500);
  const factGlyphs = await send('Runtime.evaluate', { expression: `(()=>{const terms=[...document.querySelectorAll('.case-facts dt')];return {labels:terms.map((term)=>term.textContent.trim()),glyphs:terms.map((term)=>({hidden:term.querySelector('svg')?.getAttribute('aria-hidden'),focusable:term.querySelector('svg')?.getAttribute('focusable'),href:term.querySelector('use')?.getAttribute('href')}))}})()`, returnByValue: true });
  if (factGlyphs.result.value.labels.join('|') !== 'Role|Interfaces|Project' || factGlyphs.result.value.glyphs.some((glyph) => glyph.hidden !== 'true' || glyph.focusable !== 'false') || factGlyphs.result.value.glyphs.map((glyph) => glyph.href.split('#').pop()).join('|') !== 'glyph-role|glyph-layers|glyph-repository') throw new Error(`case fact glyph semantics failed: ${JSON.stringify(factGlyphs.result.value)}`);
  await hover('.case-facts div');
  const factMotion = await send('Runtime.evaluate', { expression: `(()=>{const use=document.querySelector('.case-facts use');return {outer:use.getAnimations()[0]?.animationName,inner:getComputedStyle(use).getPropertyValue('--glyph-role-motion').trim()}})()`, returnByValue: true });
  if ((factMotion.result.value.outer && factMotion.result.value.outer !== 'none') || !factMotion.result.value.inner.startsWith('glyph-role-nod 680ms')) throw new Error(`case fact glyph hover motion failed: ${JSON.stringify(factMotion.result.value)}`);

  await send('Page.navigate', { url: `${server.origin}/about/` });
  await pause(500);
  const fieldGlyphs = await send('Runtime.evaluate', { expression: `(()=>{const terms=[...document.querySelectorAll('.about-field-notes dt')];return {labels:terms.map((term)=>term.textContent.trim()),intro:document.querySelector('.about-intro .trail-glyph use')?.getAttribute('href'),glyphs:terms.map((term)=>({hidden:term.querySelector('svg')?.getAttribute('aria-hidden'),focusable:term.querySelector('svg')?.getAttribute('focusable'),href:term.querySelector('use')?.getAttribute('href')}))}})()`, returnByValue: true });
  if (fieldGlyphs.result.value.labels.join('|') !== 'Preferred terrain|Working bias|Outside' || !fieldGlyphs.result.value.intro.endsWith('#glyph-backpack') || fieldGlyphs.result.value.glyphs.some((glyph) => glyph.hidden !== 'true' || glyph.focusable !== 'false') || fieldGlyphs.result.value.glyphs.map((glyph) => glyph.href.split('#').pop()).join('|') !== 'glyph-pine|glyph-compass|glyph-fire') throw new Error(`field-note glyph semantics failed: ${JSON.stringify(fieldGlyphs.result.value)}`);

  await send('Page.navigate', { url: `${server.origin}/` });
  await pause(500);

  await send('Runtime.evaluate', { expression: `(()=>{const gallery=document.createElement('section');gallery.id='glyph-motion-gallery';gallery.setAttribute('aria-label','Glyph motion test gallery');gallery.innerHTML=${JSON.stringify(Object.keys(glyphs).map((name) => `<button class="overlay-close" data-glyph="${name}" aria-label="Animate ${name}"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="/assets/trail-glyphs.svg#glyph-${name}"></use></svg><small>${name}</small></button>`).join(''))};gallery.style.cssText='position:fixed;z-index:100;inset:1rem;display:grid;grid-template-columns:repeat(7,1fr);gap:.65rem;padding:1rem;overflow:auto;background:var(--paper)';gallery.querySelectorAll('button').forEach((button)=>button.style.cssText='width:auto;height:5.4rem;border-radius:5px;display:grid;place-items:center;gap:.25rem');gallery.querySelectorAll('svg').forEach((svg)=>svg.style.cssText='width:2rem;height:2rem');gallery.querySelectorAll('small').forEach((label)=>label.style.cssText='font:600 10px var(--mono)');document.body.append(gallery)})()` });

  const idle = await send('Runtime.evaluate', { expression: `document.querySelectorAll('#glyph-motion-gallery use').length===${Object.keys(glyphs).length}&&[...document.querySelectorAll('#glyph-motion-gallery use')].every((use)=>use.getAnimations().length===0&&getComputedStyle(use).transform==='none')`, returnByValue: true });
  if (!idle.result.value) throw new Error('glyphs must remain static before hover');

  await hover('[data-glyph="trailhead"]');
  const signVisibility = await send('Runtime.evaluate', { expression: `(()=>{const use=document.querySelector('[data-glyph="trailhead"] use');const animation=use.getAnimations()[0];animation.pause();animation.currentTime=0;const idleWidth=use.getBoundingClientRect().width;const widths=[258,306,374].map((time)=>{animation.currentTime=time;return use.getBoundingClientRect().width});return {idleWidth,widths,minimumRatio:Math.min(...widths)/idleWidth}})()`, returnByValue: true });
  if (signVisibility.result.value.minimumRatio < .3) throw new Error(`trailhead flip becomes visually edge-on: ${JSON.stringify(signVisibility.result.value)}`);
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 0, y: 0 });

  await hover('[data-glyph="waypoint"]');
  const waypointVisibility = await send('Runtime.evaluate', { expression: `(()=>{const svg=document.querySelector('[data-glyph="waypoint"] svg');const use=svg.querySelector('use');const animation=use.getAnimations()[0];animation.pause();animation.currentTime=258;const svgRect=svg.getBoundingClientRect();const glyphRect=use.getBoundingClientRect();return {overflow:getComputedStyle(svg).overflow,glyphClearsTop:glyphRect.top<svgRect.top}})()`, returnByValue: true });
  if (waypointVisibility.result.value.overflow !== 'visible' || !waypointVisibility.result.value.glyphClearsTop) throw new Error(`waypoint hop is clipped: ${JSON.stringify(waypointVisibility.result.value)}`);
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 0, y: 0 });

  for (const [name, expectedAnimation] of Object.entries(glyphs)) {
    const selector = `[data-glyph="${name}"]`;
    await hover(selector);
    const state = await send('Runtime.evaluate', { expression: `(()=>{const use=document.querySelector(${JSON.stringify(`${selector} use`)});const animation=use.getAnimations()[0];if(!animation)return {missing:true};animation.pause();animation.currentTime=220;const first=getComputedStyle(use).transform;animation.currentTime=470;const second=getComputedStyle(use).transform;return {name:animation.animationName,duration:animation.effect.getTiming().duration,first,second}})()`, returnByValue: true });
    const value = state.result.value;
    if (expectedAnimation === null) {
      if (!value.missing && value.name !== 'none') throw new Error(`${name} must keep its outer symbol stationary: ${JSON.stringify(value)}`);
      const [property, expectedInternalMotion] = internalMotions[name];
      const internalMotion = await send('Runtime.evaluate', { expression: `getComputedStyle(document.querySelector(${JSON.stringify(`${selector} use`)})).getPropertyValue(${JSON.stringify(property)}).trim()`, returnByValue: true });
      if (!internalMotion.result.value.startsWith(`${expectedInternalMotion} 680ms`)) throw new Error(`${name} did not trigger ${expectedInternalMotion}`);
    } else if (value.missing || value.name !== expectedAnimation || value.duration !== 680 || value.first === 'none' || value.first === value.second) throw new Error(`${name} hover motion failed: ${JSON.stringify(value)}`);
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 0, y: 0 });
  }

  for (const [name, [expectedX, expectedY]] of Object.entries(arrowVectors)) {
    await hover(`[data-glyph="${name}"]`);
    const vector = await send('Runtime.evaluate', { expression: `(()=>{const animation=document.querySelector('[data-glyph="${name}"] use').getAnimations()[0];animation.pause();animation.currentTime=354;const matrix=new DOMMatrix(getComputedStyle(animation.effect.target).transform);return {x:matrix.e,y:matrix.f}})()`, returnByValue: true });
    const { x, y } = vector.result.value;
    if ((expectedX === 0 ? Math.abs(x) > .05 : Math.sign(x) !== expectedX) || (expectedY === 0 ? Math.abs(y) > .05 : Math.sign(y) !== expectedY)) throw new Error(`${name} moved against its direction: ${JSON.stringify(vector.result.value)}`);
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 0, y: 0 });
  }

  await send('Runtime.evaluate', { expression: `document.querySelector('[data-glyph="compass"]').focus()` });
  const keyboardMotion = await send('Runtime.evaluate', { expression: `document.querySelector('[data-glyph="compass"] use').getAnimations()[0]?.animationName`, returnByValue: true });
  if (keyboardMotion.result.value && keyboardMotion.result.value !== 'none') throw new Error('keyboard focus must keep the compass housing stationary');

  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await hover('[data-glyph="fire"]');
  await pause(30);
  const reduced = await send('Runtime.evaluate', { expression: `(()=>{const svg=document.querySelector('[data-glyph="fire"] svg');const use=svg.querySelector('use');return {visible:svg.getBoundingClientRect().width>0,duration:getComputedStyle(use).animationDuration,animations:use.getAnimations().length}})()`, returnByValue: true });
  if (!reduced.result.value.visible || (Number.parseFloat(reduced.result.value.duration) > .00001 && reduced.result.value.animations !== 0)) throw new Error(`reduced motion failed: ${JSON.stringify(reduced.result.value)}`);

  if (captureEvidence) {
    const evidenceDir = '/tmp/bolens-glyph-motion';
    mkdirSync(evidenceDir, { recursive: true });
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
    await send('Runtime.evaluate', { expression: `(()=>{const style=document.createElement('style');style.textContent='#glyph-motion-gallery use{--glyph-compass-motion:glyph-compass-spin 680ms var(--ease-pop);--glyph-fire-motion:glyph-fire-flicker 680ms var(--ease-pop);--glyph-binocular-motion:glyph-binoculars-zoom 680ms var(--ease-pop);--glyph-summit-motion:glyph-summit-snow 680ms var(--ease-route);--glyph-switchback-motion:glyph-switchback-trace 680ms var(--ease-route);--glyph-cairn-middle-motion:glyph-cairn-middle-stack 680ms var(--ease-route);--glyph-cairn-upper-motion:glyph-cairn-upper-stack 680ms var(--ease-route);--glyph-cairn-top-motion:glyph-cairn-top-stack 680ms var(--ease-route);--glyph-shelter-motion:glyph-shelter-pitch 680ms var(--ease-pop);--glyph-map-left-motion:glyph-map-left-unfold 680ms var(--ease-pop);--glyph-map-right-motion:glyph-map-right-unfold 680ms var(--ease-pop);--glyph-map-route-motion:glyph-map-route-reveal 680ms var(--ease-route);--glyph-role-motion:glyph-role-nod 680ms var(--ease-pop);--glyph-layers-motion:glyph-layers-settle 680ms var(--ease-pop);--glyph-repository-motion:glyph-repository-write 680ms var(--ease-route);--glyph-backpack-motion:glyph-backpack-pack 680ms var(--ease-pop);--glyph-lantern-motion:glyph-lantern-glow 680ms var(--ease-pop);--glyph-shield-motion:glyph-shield-check-draw 680ms var(--ease-route);--glyph-terminal-motion:glyph-terminal-cursor-run 680ms var(--ease-route);--glyph-network-motion:glyph-network-connect 680ms var(--ease-route);--glyph-wrench-motion:glyph-wrench-tighten 680ms var(--ease-pop);animation:var(--glyph-motion) 680ms var(--ease-pop)}';document.head.append(style)})()` });
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
