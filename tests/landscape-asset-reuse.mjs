import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const html = readFileSync(resolve(root, '404.html'), 'utf8');

test('seating and firewood share one scalable detailed log', () => {
  assert.match(html, /<symbol id="camp-log" viewBox="0 0 320 44"[^>]*>/);
  assert.equal([...html.matchAll(/href="#camp-log"/g)].length, 8);
  assert.doesNotMatch(html, /charred-log-detail/);
});

test('both mountain ranges reuse one scalable detailed peak', () => {
  assert.match(html, /<symbol id="alpine-peak" viewBox="0 0 240 220"[^>]*>/);
  assert.equal([...html.matchAll(/href="#alpine-peak"/g)].length, 13);
  assert.match(html, /class="mountain-range mountain-range-far depth-far scene-layer"/);
  assert.match(html, /class="mountain-range mountain-range-near depth-far scene-layer"/);
  assert.doesNotMatch(html, /class="mountain-faces/);
});

test('landscape brush is layered from horizon to clearing edge', () => {
  const regions = [
    'horizon-tree-line',
    'horizon-brush',
    'midground-tree-line',
    'midstory-brush',
    'clearing-understory',
    'foreground-brush',
  ];
  const positions = regions.map((region) => html.indexOf(`data-region="${region}"`));

  positions.forEach((position, index) => {
    assert.notEqual(position, -1, `${regions[index]} region is required`);
  });
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
  assert.equal([...html.matchAll(/class="midstory-brush depth-mid scene-layer"/g)].length, 1);
  assert.equal([...html.matchAll(/class="understory-shrubs depth-near scene-layer"/g)].length, 1);
});

test('fire ring and forest floor use configurable asset families', () => {
  assert.equal([...html.matchAll(/href="#fire-ring-stone"/g)].length, 10);
  assert.equal([...html.matchAll(/href="#fire-bed"/g)].length, 1);
  assert.equal([...html.matchAll(/href="#woodland-debris"/g)].length, 11);
  assert.equal([...html.matchAll(/href="#ground-sprig"/g)].length, 5);
  assert.equal([...html.matchAll(/href="#moss-clump"/g)].length, 7);
  assert.equal([...html.matchAll(/href="#fungi-cluster"/g)].length, 4);
  assert.equal([...html.matchAll(/href="#shelf-fungi"/g)].length, 2);
  assert.equal([...html.matchAll(/href="#pinecone-sprig"/g)].length, 5);
  assert.equal([...html.matchAll(/href="#wildflower-clump"/g)].length, 3);
  assert.equal([...html.matchAll(/href="#fallen-branch"/g)].length, 6);
  assert.doesNotMatch(html, /class="forest-litter"|class="forest-duff"|class="forest-floor-texture"/);
  assert.doesNotMatch(html, /class="mushroom-detail"|class="shelf-fungi"/);
});

test('riverbank and tent details reuse condition-aware assets', () => {
  assert.equal([...html.matchAll(/href="#reed-clump"/g)].length, 4);
  assert.equal([...html.matchAll(/href="#trail-boots"/g)].length, 2);
  assert.equal([...html.matchAll(/href="#camp-storage"/g)].length, 2);
  assert.doesNotMatch(html, /<g class="bank-reeds"[^>]+fill=/);
  assert.doesNotMatch(html, /<g class="tent-storage"[^>]+stroke-linejoin=/);
});

test('river surface details reuse condition-aware assets', () => {
  assert.equal([...html.matchAll(/href="#river-ripple"/g)].length, 4);
  assert.equal([...html.matchAll(/href="#water-foam"/g)].length, 3);
  assert.doesNotMatch(html, /<g class="river-ripples"[^>]+stroke=/);
  assert.doesNotMatch(html, /<g class="water-foam"/);
});

test('riverbank profile, roots, and pebbles use configurable assets', () => {
  assert.equal([...html.matchAll(/href="#riverbank-profile"/g)].length, 1);
  assert.equal([...html.matchAll(/href="#exposed-root"/g)].length, 3);
  assert.equal([...html.matchAll(/href="#river-pebble-cluster"/g)].length, 5);
  assert.doesNotMatch(html, /class="riverbank-structure"[^>]*>\s*<path/);
  assert.doesNotMatch(html, /class="bank-root-patches"[^>]*>\s*<path/);
  assert.doesNotMatch(html, /class="bank-pebble-patches"[^>]*>\s*<ellipse/);
});

test('firefly phases reuse a configurable light pair', () => {
  assert.equal([...html.matchAll(/href="#firefly-pair"/g)].length, 9);
  assert.equal([...html.matchAll(/class="firefly-phase-(?:one|two|three)"/g)].length, 3);
  assert.doesNotMatch(html, /class="firefly-phase-(?:one|two|three)"[^>]*><circle/);
});

test('campfire coals, ash, and sparks use configurable assets', () => {
  assert.equal([...html.matchAll(/href="#coal-piece"/g)].length, 4);
  assert.equal([...html.matchAll(/href="#ash-scatter"/g)].length, 1);
  assert.equal([...html.matchAll(/href="#ember-spark"/g)].length, 6);
  assert.doesNotMatch(html, /class="coal-bed"[^>]*>\s*<ellipse/);
  assert.doesNotMatch(html, /class="fire-ash"[^>]*>\s*<ellipse/);
  assert.doesNotMatch(html, /class="embers"[^>]*>\s*<(?:circle|path)/);
});

test('tent shell and fire smoke use configurable symbols', () => {
  assert.equal([...html.matchAll(/href="#camp-tent-shell"/g)].length, 1);
  assert.equal([...html.matchAll(/href="#smoke-wisp"/g)].length, 6);
  assert.equal([...html.matchAll(/href="#smoke-puff"/g)].length, 5);
  assert.doesNotMatch(html, /class="camp-tent"[^>]*>\s*<path/);
  assert.doesNotMatch(html, /class="smoke-wisps"[^>]*>\s*<path/);
  assert.doesNotMatch(html, /class="smoke-puffs"[^>]*>\s*<circle/);
});

test('drought cooking reuses a condition-aware camp stove', () => {
  assert.match(html, /<symbol id="camp-stove"[^>]+data-regions="[^"]*cook-pot[^"]*conditions"/);
  assert.equal([...html.matchAll(/href="#camp-stove"/g)].length, 1);
  assert.match(html, /class="condition-detail condition-drought drought-camp-stove[^>]+data-region="drought-cooking-station"/);
});

test('camp food and sky glints use reusable detailed symbols', () => {
  assert.match(html, /<symbol id="toasted-marshmallow"[^>]+data-regions="[^"]*toast-marks[^"]*conditions"/);
  assert.equal([...html.matchAll(/href="#toasted-marshmallow"/g)].length, 4);
  assert.match(html, /<symbol id="camp-snack-plate"[^>]+data-regions="[^"]*graham-crackers[^"]*conditions"/);
  assert.equal([...html.matchAll(/href="#camp-snack-plate"/g)].length, 1);
  assert.match(html, /<symbol id="sky-glint"[^>]+data-regions="vertical-ray,horizontal-ray"/);
  assert.equal([...html.matchAll(/href="#sky-glint"/g)].length, 3);
});

test('tent gear and the distant craft use condition-aware symbols', () => {
  for (const asset of ['scout-ufo', 'sleeping-roll', 'camp-lantern']) {
    assert.match(html, new RegExp(`<symbol id="${asset}"[^>]+data-regions="[^"]*conditions"`));
    assert.equal([...html.matchAll(new RegExp(`href="#${asset}"`, 'g'))].length, 1);
  }
  assert.doesNotMatch(html, /<g class="background-ufo"/);
  assert.doesNotMatch(html, /<g class="tent-sleeping-bag"/);
  assert.doesNotMatch(html, /<g class="tent-lantern"/);
});

test('the camera and windhound use responsive campsite symbols', () => {
  assert.match(html, /<symbol id="trail-camera"[^>]+data-regions="[^"]*lens-glint[^"]*conditions"/);
  assert.equal([...html.matchAll(/href="#trail-camera"/g)].length, 1);
  assert.match(html, /<symbol id="camp-windhound"[^>]+data-regions="[^"]*face-mask[^"]*conditions"/);
  assert.equal([...html.matchAll(/href="#camp-windhound"/g)].length, 2);
  assert.doesNotMatch(html, /<g class="tent-dog"/);
});
