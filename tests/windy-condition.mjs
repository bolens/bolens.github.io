import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../404.html', import.meta.url), 'utf8');
const css = await readFile(new URL('../assets/404.css', import.meta.url), 'utf8');
const scene = await readFile(new URL('../assets/404-scene.js', import.meta.url), 'utf8');

test('wind is a reusable front-plane weather accent', () => {
  assert.match(html, /<symbol id="wind-field"[^>]+data-regions="gust-streamers,leaf-debris"/);
  assert.match(html, /class="weather-wind" data-scene-layer="precipitation-front"/);
  assert.match(html, /data-regions="[^"]*wind-sweep"/);
  assert.match(css, /data-weather="windy"[^}]+--asset-wind-opacity:\.38/);
});

test('one gust cadence drives trees, flexible plants, tent, flame, smoke, and embers', () => {
  for (const name of ['wind-tree-gust', 'wind-pliant-growth', 'wind-tent-fabric', 'wind-flame-stack', 'wind-smoke', 'weather-wind-pass']) {
    assert.match(css, new RegExp(`@keyframes ${name}`));
  }
  assert.match(css, /data-weather="windy"[^}]+\.flame-stack[^}]+scale:1\.08 1\.02/);
  assert.match(css, /data-weather="windy"[^}]+\.embers > \*[^}]+--ember-drift-x:18px/);
  assert.match(scene, /windy: Object\.freeze\(\{ stars: \.82, fog: \.48, fireflies: \.35, embers: \.72 \}\)/);
  assert.match(scene, /windy:1\.06/);
});

test('reduced motion retains a static wind-shaped pose', () => {
  assert.match(css, /prefers-reduced-motion: reduce[\s\S]*data-weather="windy"[\s\S]*rotate:1deg/);
  assert.match(css, /prefers-reduced-motion: reduce[\s\S]*\.camp-tent > use:first-child \{ transform:skewX\(\.6deg\)/);
});
