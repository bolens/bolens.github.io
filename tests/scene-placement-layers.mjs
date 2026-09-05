import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const html = readFileSync(resolve(import.meta.dirname, '..', '404.html'), 'utf8');
const css = readFileSync(resolve(import.meta.dirname, '..', 'assets/404.css'), 'utf8');
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
    'data-scene-layer="sky-subject"',
    'data-scene-layer="terrain-far"',
    'data-scene-layer="terrain-middle"',
    'data-scene-layer="terrain-near"',
    'data-scene-layer="forest-back"',
    'data-scene-layer="forest-far"',
    'data-scene-layer="ground-base"',
    'data-scene-layer="water-mid"',
    'data-scene-layer="forest-path"',
    'data-scene-layer="forest-mid"',
    'data-scene-layer="clearing-ground"',
    'data-scene-layer="campsite-back"',
    'data-scene-layer="campsite-ground"',
    'data-scene-layer="campsite-furniture"',
    'data-scene-layer="campsite-subjects"',
    'data-scene-layer="campsite-effects"',
    'data-scene-layer="air-front"',
    'data-scene-layer="precipitation-front"',
    'data-scene-layer="foreground-edge"',
  ].map(indexOf);
  assert.deepEqual([...anchors].sort((a, b) => a - b), anchors);
});

test('solid terrain blocks rear layers while precipitation paints in front', () => {
  for (const className of ['mountain-range-far', 'mountain-range-middle', 'forest-transition', 'horizon-brush']) {
    const openingTag = html.match(new RegExp(`<g class="[^"]*\\b${className}\\b[^"]*"[^>]*>`))?.[0] || '';
    assert.ok(openingTag, `missing ${className}`);
    assert.doesNotMatch(openingTag, /\sopacity=/, `${className} must not make solid terrain translucent`);
  }

  assert.ok(indexOf('data-scene-layer="precipitation-front"') > indexOf('data-scene-layer="air-front"'));
  assert.ok(indexOf('data-scene-layer="precipitation-front"') < indexOf('data-scene-layer="foreground-edge"'));
});

test('tree scale increases from distant rows to the camp frame', () => {
  const distant = widths('horizon-forest', 'distant-pine');
  const transition = widths('forest-transition', 'distant-pine');
  const mid = widths('deep-forest', 'distant-pine');
  const near = widths('camp-pines', 'distant-pine');
  assert.ok(distant.length >= 10 && transition.length >= 10 && mid.length >= 10 && near.length >= 5);
  assert.ok(Math.min(...transition) > Math.min(...distant));
  assert.ok(Math.max(...transition) > Math.max(...mid));
  assert.ok(Math.max(...transition) < Math.max(...near));
  assert.ok(Math.max(...distant) < Math.max(...near) * .55);
  assert.ok(Math.max(...mid) < Math.max(...near) * .55);
  assert.ok(Math.min(...near) > 80);
});

test('ridge and forest placements form deterministic irregular compositions', () => {
  for (const pattern of ['broken-saddle', 'offset-ridge', 'clearing-saddle', 'edge-clusters', 'staggered-groves', 'trail-pocket', 'asymmetric-frame']) {
    assert.match(html, new RegExp(`data-placement-pattern="${pattern}"`));
  }
  for (const className of ['mountain-range-far', 'mountain-range-middle', 'mountain-range-near']) {
    const body = groupBody(className);
    const rotations = [...body.matchAll(/transform="rotate\((-?[\d.]+)/g)].map((match) => Number(match[1]));
    assert.ok(rotations.length >= 6 && new Set(rotations).size >= 6, `${className} should vary peak lean`);
    assert.ok(rotations.some((value) => value < 0) && rotations.some((value) => value > 0), `${className} should lean both ways`);
  }
  for (const className of ['horizon-forest', 'forest-transition', 'deep-forest', 'camp-pines']) {
    const baselines = [...groupBody(className).matchAll(/y="([\d.]+)"[^>]+height="([\d.]+)"/g)].map((match) => Number(match[1]) + Number(match[2]));
    assert.ok(new Set(baselines).size >= 4, `${className} should stagger its planted baseline`);
  }
  assert.match(css, /--tree-motion-duration:10\.8s;--tree-wind-duration:4\.35s;--tree-motion-delay:-3\.1s/);
  assert.match(css, /@keyframes ambient-tree-sway \{ from \{ rotate:calc\(var\(--motion-sway-negative\) \* var\(--tree-sway-out,/);
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
