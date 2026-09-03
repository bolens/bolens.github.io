import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { startBrowser } from './lib/cdp-browser.mjs';
import { waitFor } from './lib/browser-test.mjs';
import { startSiteServer } from './lib/site-server.mjs';

const root = resolve(import.meta.dirname, '..');
const server = await startSiteServer(root);
const browser = await startBrowser(() => {});
const { send } = browser;
const captureEvidence = process.argv.includes('--capture-evidence');

const pages = [
  ['/', [
    ['#currently .eyebrow', 'clock', '--glyph-clock-motion', 'glyph-clock-minute-sweep'],
    ['#off-the-clock .eyebrow', 'owl', '--glyph-owl-motion', 'glyph-owl-eye-a-blink'],
    ['#contact .eyebrow', 'radio', '--glyph-radio-motion', 'glyph-radio-note-a-float'],
    ['.toolbox dl div:nth-child(1) dt', 'hard-drive', '--glyph-hard-drive-motion', 'glyph-hard-drive-arm-seek'],
    ['.toolbox dl div:nth-child(2) dt', 'code', '--glyph-code-motion', 'glyph-code-slash-compile'],
    ['.toolbox dl div:nth-child(3) dt', 'wrench', '--glyph-wrench-motion', 'glyph-wrench-tighten'],
  ]],
  ['/about/', [
    ['.about-field-notes header .eyebrow', 'journal', '--glyph-journal-motion', 'glyph-journal-check-draw'],
    ['.availability .eyebrow', 'repository', '--glyph-repository-motion', 'glyph-repository-write'],
  ]],
  ['/work/', [
    ['[data-project-name="uddns"]', 'cloud', '--glyph-cloud-motion', 'glyph-cloud-drop-a-fall'],
    ['[data-project-name="aur response toolkit"]', 'shield', '--glyph-shield-motion', 'glyph-shield-check-draw'],
    ['[data-project-name="launch layer"]', 'terminal', '--glyph-terminal-motion', 'glyph-terminal-cursor-run'],
    ['[data-project-name="millennium helpers"]', 'wrench', '--glyph-wrench-motion', 'glyph-wrench-tighten'],
    ['[data-project-name="privacy devices"]', 'lock', '--glyph-lock-motion', 'glyph-lock-release'],
    ['[data-project-name="p2p services"]', 'network', '--glyph-network-motion', 'glyph-network-link-a-draw'],
    ['[data-project-name="app drawer"]', 'package', '--glyph-package-motion', 'glyph-package-fold-close'],
    ['[data-project-name="multi-monitor workspaces"]', 'monitor', '--glyph-monitor-motion', 'glyph-monitor-cursor-blink'],
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
const workControls = [
  ['.work-search', '[name="project-search"]', 'search', '--glyph-search-motion', 'glyph-search-scan-sweep'],
  ['label:has([name="project-language"])', '[name="project-language"]', 'code', '--glyph-code-motion', 'glyph-code-slash-compile'],
  ['label:has([name="project-kind"])', '[name="project-kind"]', 'filter', '--glyph-filter-motion', 'glyph-filter-particle-a-drop'],
  ['label:has([name="project-sort"])', '[name="project-sort"]', 'sort', '--glyph-sort-motion', 'glyph-sort-bar-a-settle'],
  ['.work-reset', '.work-reset', 'refresh', '--glyph-refresh-motion', 'glyph-refresh-cycle'],
];

const hover = async (selector) => {
  await send('Runtime.evaluate', {
    expression: `(()=>{document.documentElement.style.scrollBehavior='auto';document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center',behavior:'auto'})})()`,
  });
  await waitFor(send, `(()=>{const box=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return box.bottom>0&&box.top<innerHeight})()`, `${selector} visible after scroll`);
  const point = await send('Runtime.evaluate', {
    expression: `(()=>{const box=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:box.left+box.width/2,y:Math.max(0,box.top)+Math.min(box.height,innerHeight-Math.max(0,box.top))/2}})()`,
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
        expression: `(()=>{const target=document.querySelector(${JSON.stringify(selector)});const icons=target?.querySelectorAll(':scope>svg');const svg=icons?.[0];const use=svg?.querySelector('use');return {count:icons?.length??0,href:use?.getAttribute('href'),hidden:svg?.getAttribute('aria-hidden'),focusable:svg?.getAttribute('focusable'),outer:use?.getAnimations()[0]?.animationName??'none',motion:use?getComputedStyle(use).getPropertyValue(${JSON.stringify(property)}).trim():''}})()`,
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

    if (path === '/' && captureEvidence) {
      for (const [width, height, name] of [[1440, 1000, 'desktop'], [390, 844, 'mobile']]) {
        await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 });
        await send('Runtime.evaluate', { expression: `document.querySelector('.toolbox').scrollIntoView({block:'center',behavior:'instant'})` });
        const capture = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
        writeFileSync(`/tmp/bolens-context-glyphs-home-${name}.png`, Buffer.from(capture.data, 'base64'));
      }
      await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
    }

    if (path === '/work/') {
      const arrows = await send('Runtime.evaluate', {
        expression: `(()=>[...document.querySelectorAll('.index-list>a')].map((row)=>({href:row.href,glyph:row.querySelector('.trail-arrow use')?.getAttribute('href')})))()`,
        returnByValue: true,
      });
      if (arrows.result.value.length !== 8 || arrows.result.value.some(({ glyph }) => glyph !== '/assets/trail-glyphs.svg#glyph-arrow-east')) {
        throw new Error(`work rows must use one consistent forward arrow: ${JSON.stringify(arrows.result.value)}`);
      }
      for (const [selector, , property, motion] of placements) {
        const focused = await send('Runtime.evaluate', {
          expression: `(()=>{const row=document.querySelector(${JSON.stringify(selector)});row.focus();const use=row.querySelector(':scope>.project-glyph use');return {focused:document.activeElement===row,motion:getComputedStyle(use).getPropertyValue(${JSON.stringify(property)}).trim()}})()`,
          returnByValue: true,
        });
        if (!focused.result.value.focused || !focused.result.value.motion.startsWith(`${motion} 680ms`)) {
          throw new Error(`${selector} keyboard motion failed: ${JSON.stringify(focused.result.value)}`);
        }
      }
      for (const [trigger, focusTarget, glyph, property, motion] of workControls) {
        const idle = await send('Runtime.evaluate', {
          expression: `(()=>{const trigger=document.querySelector(${JSON.stringify(trigger)});const svg=trigger.querySelector('.control-glyph');const use=svg?.querySelector('use');return {count:trigger.querySelectorAll('.control-glyph').length,href:use?.getAttribute('href'),hidden:svg?.getAttribute('aria-hidden'),focusable:svg?.getAttribute('focusable'),motion:use?getComputedStyle(use).getPropertyValue(${JSON.stringify(property)}).trim():''}})()`,
          returnByValue: true,
        });
        if (idle.result.value.count !== 1 || idle.result.value.href !== `/assets/trail-glyphs.svg#glyph-${glyph}` || idle.result.value.hidden !== 'true' || idle.result.value.focusable !== 'false' || idle.result.value.motion) {
          throw new Error(`${trigger} control glyph idle state failed: ${JSON.stringify(idle.result.value)}`);
        }
        await hover(trigger);
        const hovered = await send('Runtime.evaluate', { expression: `getComputedStyle(document.querySelector(${JSON.stringify(trigger)}).querySelector('.control-glyph use')).getPropertyValue(${JSON.stringify(property)}).trim()`, returnByValue: true });
        if (!hovered.result.value.startsWith(`${motion} 680ms`)) throw new Error(`${trigger} control glyph hover failed: ${hovered.result.value}`);
        await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 0, y: 0 });
        const focused = await send('Runtime.evaluate', { expression: `(()=>{document.querySelector(${JSON.stringify(focusTarget)}).focus();return getComputedStyle(document.querySelector(${JSON.stringify(trigger)}).querySelector('.control-glyph use')).getPropertyValue(${JSON.stringify(property)}).trim()})()`, returnByValue: true });
        if (!focused.result.value.startsWith(`${motion} 680ms`)) throw new Error(`${trigger} control glyph keyboard focus failed: ${focused.result.value}`);
      }
      await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
      const mobile = await send('Runtime.evaluate', {
        expression: `new Promise((resolve)=>requestAnimationFrame(()=>requestAnimationFrame(()=>{const row=document.querySelector('.index-list>a');const icon=row.querySelector(':scope>.project-glyph').getBoundingClientRect();const copy=row.querySelector(':scope>span').getBoundingClientRect();const arrow=row.querySelector(':scope>.trail-arrow').getBoundingClientRect();resolve({overflow:document.documentElement.scrollWidth-innerWidth,order:icon.right<copy.left&&copy.right<arrow.left})})))`,
        awaitPromise: true,
        returnByValue: true,
      });
      if (mobile.result.value.overflow > 0 || !mobile.result.value.order) throw new Error(`work row mobile layout failed: ${JSON.stringify(mobile.result.value)}`);
      await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
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

  console.log(`Glyph site placement passed ${pages.reduce((count, [, placements]) => count + placements.length, workControls.length)} semantic placements with idle, hover, keyboard, mobile-layout, and reduced-motion checks.`);
} finally {
  await browser.close();
  await server.close();
}
