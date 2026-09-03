import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const html = readFileSync(resolve(root, '404.html'), 'utf8');
const css = readFileSync(resolve(root, 'assets/404.css'), 'utf8');
const scene = readFileSync(resolve(root, 'assets/404-scene.js'), 'utf8');

test('rain scales and flickers only the flame geometry', () => {
  assert.match(html, /<g class="flame-stack" data-region="open-flame">/);
  assert.match(css, /data-weather="rainy"\] \.flame-stack \{ scale:\.68 \.58;animation:rain-flame-flicker \.68s steps\(4,end\) infinite; \}/);
  assert.match(css, /data-weather="rainy"\] :is\(\.flame-inner,\.flame-core\) \{ animation-duration:\.31s; \}/);
  assert.match(scene, /rainy: Object\.freeze\(\{ stars: \.08, fog: 1\.4, fireflies: \.25, embers: \.18 \}\)/);
});

test('drought swaps the open fire for the stove', () => {
  assert.match(css, /data-weather="drought"\] :is\(\.campfire,\.campfire-glow,\.fire-ring-stones,\.firelight-rings,\.fire-rim-light,\.smoke-404\) \{ display:none; \}/);
  assert.match(css, /data-weather="drought"\] :is\(\.roasting-marshmallow,\.smores-kit\) \{ display:none; \}/);
  assert.match(html, /data-region="drought-cooking-station"/);
  assert.match(scene, /drought: Object\.freeze\(\{ stars: \.7, fog: \.08, fireflies: \.55, embers: 0 \}\)/);
});

test('drought lowers the river and exposes its bed', () => {
  assert.match(html, /class="river-water" data-region="river-water-level"/);
  assert.match(html, /class="condition-detail condition-drought drought-riverbed" data-region="exposed-riverbed"/);
  assert.match(css, /data-weather="drought"\] \.river-water \{ scale:1 \.88;translate:0 9px;opacity:\.78; \}/);
  assert.match(css, /data-weather="rainy"[^\n]+\.river-water \{ scale:1 1\.02;translate:0 -3px; \}/);
});

test('reusable camp props react to visibility and shelter conditions', () => {
  assert.match(css, /data-weather="cloudy"[^\n]+\.background-ufo \{ display:none; \}/);
  assert.match(css, /data-weather="rainy"[^\n]+\.tent-lantern \{ --lantern-outer-opacity:\.14;--lantern-inner-opacity:\.32; \}/);
  assert.match(css, /data-weather="drought"\] \.tent-lantern \{ --lantern-outer-opacity:\.06;--lantern-inner-opacity:\.15;--lantern-light:#efb95c; \}/);
  assert.match(css, /\.lantern-halo \{[^}]+animation:lantern-glow/);
  assert.doesNotMatch(css, /\.tent-lantern circle/);
});
