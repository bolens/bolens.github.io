import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const html = readFileSync(resolve(import.meta.dirname, '..', '404.html'), 'utf8');
const indexOf = (fragment) => {
  const index = html.indexOf(fragment);
  assert.notEqual(index, -1, `missing ${fragment}`);
  return index;
};
const groupBody = (className) => html.match(new RegExp(`<g class="[^"]*\\b${className}\\b[^"]*"[^>]*>([\\s\\S]*?)</g>`))?.[1] || '';
const widths = (className, asset) => [...groupBody(className).matchAll(new RegExp(`href="#${asset}"[^>]+width="([\\d.]+)"`, 'g'))].map((match) => Number(match[1]));

test('major scene bands publish an explicit paint-order vocabulary', () => {
  const layers = [...html.matchAll(/data-scene-layer="([^"]+)"/g)].map((match) => match[1]);
  assert.ok(layers.length >= 20, 'expected explicit layer ownership on major scene groups');
  assert.ok(new Set(layers).size >= 14, 'expected enough distinct depth bands for safe placement');

  const anchors = [
    'data-scene-layer="sky-base"',
    'data-scene-layer="terrain-far"',
    'data-scene-layer="forest-back"',
    'data-scene-layer="ground-base"',
    'data-scene-layer="water-mid"',
    'data-scene-layer="forest-mid"',
    'data-scene-layer="clearing-ground"',
    'data-scene-layer="campsite-back"',
    'data-scene-layer="campsite-ground"',
    'data-scene-layer="campsite-furniture"',
    'data-scene-layer="campsite-subjects"',
    'data-scene-layer="campsite-effects"',
    'data-scene-layer="air-front"',
    'data-scene-layer="foreground-edge"',
  ].map(indexOf);
  assert.deepEqual([...anchors].sort((a, b) => a - b), anchors);
});

test('tree scale increases from distant rows to the camp frame', () => {
  const distant = widths('horizon-forest', 'distant-pine');
  const mid = widths('deep-forest', 'distant-pine');
  const near = widths('camp-pines', 'distant-pine');
  assert.ok(distant.length >= 10 && mid.length >= 10 && near.length >= 5);
  assert.ok(Math.max(...distant) < Math.max(...near) * .55);
  assert.ok(Math.max(...mid) < Math.max(...near) * .55);
  assert.ok(Math.min(...near) > 80);
});

test('foreground occlusion stays at the edges and in front of atmospheric effects', () => {
  const foreground = groupBody('foreground-occlusion');
  const placements = [...foreground.matchAll(/<use class="terrain-asset"[^>]+x="(-?[\d.]+)"[^>]+width="([\d.]+)"/g)]
    .map((match) => ({ x: Number(match[1]), width: Number(match[2]) }));
  assert.equal(placements.length, 4);
  assert.ok(placements.every(({ x, width }) => x + width < 220 || x > 900));
  assert.ok(indexOf('data-scene-layer="foreground-edge"') > indexOf('data-scene-layer="air-front"'));
  assert.ok(indexOf('data-scene-layer="foreground-edge"') < indexOf('class="palette-wash"'));
});
