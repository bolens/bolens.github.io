import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const html = fs.readFileSync(new URL('../404.html', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../assets/404.css', import.meta.url), 'utf8');
const renderer = fs.readFileSync(new URL('../assets/404-renderer.js', import.meta.url), 'utf8');

test('the scene renderer starts before animated atmosphere work', () => {
  const rendererIndex = html.indexOf('/assets/404-renderer.js');
  assert.ok(rendererIndex > 0);
  assert.ok(rendererIndex < html.indexOf('/assets/404-scene.js'));
  assert.match(renderer, /dataRenderTier/);
  assert.match(renderer, /ResizeObserver/);
  assert.match(renderer, /hardwareConcurrency/);
  assert.match(renderer, /saveData/);
});

test('render tiers expose deterministic animation and canvas budgets', () => {
  assert.match(renderer, /full:[^\n]+fps:20[^\n]+pixelRatio:\.8/);
  assert.match(renderer, /balanced:[^\n]+fps:15[^\n]+pixelRatio:\.7/);
  assert.match(renderer, /minimal:[^\n]+fps:10[^\n]+pixelRatio:\.5/);
  assert.match(renderer, /width <= 430[^\n]+minimal/);
  assert.match(renderer, /width <= 760[^\n]+balanced/);
});

test('ambient water and bank growth reuse slots without expanding tier allocations', () => {
  const tiers = renderer.split('const liveByTier = Object.freeze({')[1].split('const weatherMotion')[0];
  const lists = [...tiers.matchAll(/(minimal|balanced|full): Object.freeze\(\[([\s\S]*?)\]\)/g)];
  assert.deepEqual(lists.map(([,name,body])=>[name,[...body.matchAll(/'[^']+'/g)].length]), [['minimal',6],['balanced',8],['full',10]]);
  assert.doesNotMatch(lists[0][2], /river-ripples|river-ferns/);
  assert.match(lists[2][2], /river-ripples/);
  assert.match(lists[2][2], /river-ferns/);
});

test('efficient mode stops primitive transition storms and limits live motion', () => {
  assert.match(css, /\.cryptid-camp\[data-render-runtime\] svg :is\(path,rect,circle,ellipse,polygon,polyline,line,stop\) \{ transition:none; \}/);
  assert.match(css, /\.cryptid-camp\[data-render-runtime\] \.terrain-asset \{[^}]*transition:none; \}/);
  assert.match(css, /--asset-light-shadow:none;--asset-time-shadow:none/);
  assert.match(css, /data-render-runtime[^}]+animation:none!important/);
  assert.match(css, /data-render-runtime\] svg \* \{ animation-play-state:paused!important; \}/);
  assert.match(css, /data-runtime-motion="live"/);
});
