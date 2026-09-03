import { resolve } from 'node:path';
import { startBrowser } from './lib/cdp-browser.mjs';
import { waitFor } from './lib/browser-test.mjs';
import { startSiteServer } from './lib/site-server.mjs';

const root = resolve(import.meta.dirname, '..');
const server = await startSiteServer(root);
const browser = await startBrowser(() => {});
const { send } = browser;

const pages = [
  ['/', [
    ['#currently .eyebrow', 'clock', '--glyph-clock-motion', 'glyph-clock-minute-sweep'],
    ['#off-the-clock .eyebrow', 'owl', '--glyph-owl-motion', 'glyph-owl-eye-a-blink'],
    ['#contact .eyebrow', 'radio', '--glyph-radio-motion', 'glyph-radio-note-a-float'],
  ]],
  ['/about/', [
    ['.about-field-notes header .eyebrow', 'journal', '--glyph-journal-motion', 'glyph-journal-check-draw'],
    ['.availability .eyebrow', 'repository', '--glyph-repository-motion', 'glyph-repository-write'],
  ]],
  ['/case-studies/uddns/', [
    ['.case-intro>.eyebrow', 'globe', '--glyph-globe-motion', 'glyph-globe-route-draw'],
    ['.case-facts div:nth-child(2) dt', 'network', '--glyph-network-motion', 'glyph-network-link-a-draw'],
  ]],
  ['/case-studies/aur-response-toolkit/', [
    ['.case-intro>.eyebrow', 'shield', '--glyph-shield-motion', 'glyph-shield-check-draw'],
    ['.case-facts div:nth-child(2) dt', 'sort', '--glyph-sort-motion', 'glyph-sort-bar-a-settle'],
  ]],
  ['/case-studies/privacy-devices/', [
    ['.case-intro>.eyebrow', 'microphone', '--glyph-microphone-motion', 'glyph-microphone-level-a-rise'],
    ['.case-facts div:nth-child(2) dt', 'layers', '--glyph-layers-motion', 'glyph-layers-top-settle'],
  ]],
  ['/case-studies/launch-layer/', [
    ['.case-intro>.eyebrow', 'command', '--glyph-command-motion', 'glyph-command-chevron-type'],
    ['.case-facts div:nth-child(2) dt', 'layers', '--glyph-layers-motion', 'glyph-layers-top-settle'],
  ]],
  ['/case-studies/millennium-helpers/', [
    ['.case-intro>.eyebrow', 'wrench', '--glyph-wrench-motion', 'glyph-wrench-tighten'],
    ['.case-facts div:nth-child(2) dt', 'layers', '--glyph-layers-motion', 'glyph-layers-top-settle'],
  ]],
];

const hover = async (selector) => {
  const point = await send('Runtime.evaluate', {
    expression: `(()=>{const element=document.querySelector(${JSON.stringify(selector)});element.scrollIntoView({block:'center',behavior:'instant'});const box=element.getBoundingClientRect();return {x:box.left+box.width/2,y:box.top+box.height/2}})()`,
    returnByValue: true,
  });
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point.result.value });
  await waitFor(send, `document.querySelector(${JSON.stringify(selector)}).matches(':hover')`, `${selector} hover state`);
};

try {
  await Promise.all(['Page.enable', 'Runtime.enable'].map((method) => send(method)));
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });

  for (const [path, placements] of pages) {
    await send('Page.navigate', { url: `${server.origin}${path}` });
    await waitFor(send, `document.readyState==='complete'&&document.querySelectorAll('.trail-glyph,.fact-glyph').length>0`, `${path} glyph placements`);

    for (const [selector, glyph, property, motion] of placements) {
      const idle = await send('Runtime.evaluate', {
        expression: `(()=>{const target=document.querySelector(${JSON.stringify(selector)});const icons=target?.querySelectorAll(':scope>svg');const svg=icons?.[0];const use=svg?.querySelector('use');return {count:icons?.length??0,href:use?.getAttribute('href'),hidden:svg?.getAttribute('aria-hidden'),focusable:svg?.getAttribute('focusable'),outer:use?.getAnimations()[0]?.animationName??'none',motion:getComputedStyle(use).getPropertyValue(${JSON.stringify(property)}).trim()}})()`,
        returnByValue: true,
      });
      const expectedHref = `/assets/trail-glyphs.svg#glyph-${glyph}`;
      if (idle.result.value.count !== 1 || idle.result.value.href !== expectedHref || idle.result.value.hidden !== 'true' || idle.result.value.focusable !== 'false' || idle.result.value.outer !== 'none' || idle.result.value.motion) {
        throw new Error(`${path} ${selector} idle placement failed: ${JSON.stringify(idle.result.value)}`);
      }

      await hover(selector);
      const active = await send('Runtime.evaluate', {
        expression: `(()=>{const use=document.querySelector(${JSON.stringify(selector)})?.querySelector(':scope>svg use');return {outer:use?.getAnimations()[0]?.animationName??'none',motion:getComputedStyle(use).getPropertyValue(${JSON.stringify(property)}).trim()}})()`,
        returnByValue: true,
      });
      if (active.result.value.outer !== 'none' || !active.result.value.motion.startsWith(`${motion} 680ms`)) {
        throw new Error(`${path} ${selector} hover motion failed: ${JSON.stringify(active.result.value)}`);
      }
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 0, y: 0 });
    }
  }

  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await send('Page.navigate', { url: `${server.origin}/` });
  await waitFor(send, `document.readyState==='complete'&&document.querySelector('#currently .trail-glyph')`, 'reduced-motion placement');
  await hover('#currently .eyebrow');
  const reduced = await send('Runtime.evaluate', {
    expression: `(()=>{const use=document.querySelector('#currently .trail-glyph use');return {visible:use.getBoundingClientRect().width>0,duration:getComputedStyle(use).animationDuration,animations:use.getAnimations().length}})()`,
    returnByValue: true,
  });
  if (!reduced.result.value.visible || (Number.parseFloat(reduced.result.value.duration) > 0.00001 && reduced.result.value.animations !== 0)) {
    throw new Error(`contextual glyph reduced motion failed: ${JSON.stringify(reduced.result.value)}`);
  }

  console.log(`Glyph site placement passed ${pages.reduce((count, [, placements]) => count + placements.length, 0)} semantic placements with idle, hover, and reduced-motion checks.`);
} finally {
  await browser.close();
  await server.close();
}
