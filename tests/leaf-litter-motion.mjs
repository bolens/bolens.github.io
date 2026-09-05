import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../404.html', import.meta.url), 'utf8');
const css = await readFile(new URL('../assets/404.css', import.meta.url), 'utf8');
const debris = html.match(/<symbol id="woodland-debris"[\s\S]*?<\/symbol>/)?.[0] ?? '';

test('woodland debris scatters independently movable leaves around planted material', () => {
  assert.equal([...debris.matchAll(/class="leaf-litter-piece/g)].length, 5);
  assert.match(debris, /data-region="branch-fragments"[\s\S]*data-region="leaf-litter"/);
  for (const phase of ['one', 'two', 'three', 'four', 'five']) assert.match(debris, new RegExp(`leaf-litter-${phase}`));
});

test('leaf litter responds to breeze rain snow and dry ground without moving whole debris glyphs', () => {
  for (const animation of ['leaf-litter-breathe', 'leaf-litter-skitter', 'leaf-litter-rain-tap', 'leaf-litter-snow-settle', 'leaf-litter-dry-curl']) {
    assert.match(css, new RegExp(`@keyframes ${animation}`));
  }
  assert.match(css, /data-weather="windy"[^}]+leaf-litter-skitter/);
  assert.match(css, /data-weather="rainy"[^}]+leaf-litter-rain-tap/);
  assert.match(css, /data-weather="snowy"[^}]+leaf-litter-snow-settle/);
  assert.doesNotMatch(css, /\.floor-debris\s*\{[^}]*animation:/);
});

test('floor debris placements use irregular gaps sizes heights and rotations', () => {
  const placements = [...html.matchAll(/<use class="terrain-asset floor-debris"[^>]+>/g)].map(([source]) => ({
    x: Number(source.match(/ x="([\d.]+)"/)?.[1]),
    y: Number(source.match(/ y="([\d.]+)"/)?.[1]),
    width: Number(source.match(/ width="([\d.]+)"/)?.[1]),
    rotated: source.includes('transform="rotate('),
  }));
  const gaps = placements.slice(1).map((placement, index) => placement.x - placements[index].x);
  assert.equal(placements.length, 9);
  assert.ok(new Set(gaps).size >= 6);
  assert.ok(new Set(placements.map(({ y }) => y)).size >= 7);
  assert.ok(new Set(placements.map(({ width }) => width)).size >= 8);
  assert.ok(placements.filter(({ rotated }) => rotated).length >= 8);
});

test('reduced motion leaves every scattered leaf in its complete resting pose', () => {
  assert.match(css, /prefers-reduced-motion: reduce[\s\S]*animation:none !important/);
});
