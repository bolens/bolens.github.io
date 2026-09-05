import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const html = readFileSync(resolve(root, '404.html'), 'utf8');
const css = readFileSync(resolve(root, 'assets/404.css'), 'utf8');
const scene = readFileSync(resolve(root, 'assets/404-scene.js'), 'utf8');

test('tree rows occupy independent parallax depths', () => {
  assert.match(html, /class="horizon-forest depth-back scene-layer"/);
  assert.match(html, /class="forest-transition depth-far scene-layer"/);
  assert.match(html, /class="deep-forest depth-mid scene-layer"/);
  assert.match(css, /\.depth-back \{ translate:var\(--parallax-back-x,0\)/);
  assert.match(css, /\.depth-far \{ translate:var\(--parallax-far-x,0\)/);
  assert.match(css, /\.depth-mid \{ translate:var\(--parallax-mid-x,0\)/);
  assert.match(scene, /--parallax-back-x/);
  assert.match(scene, /--parallax-back-y/);
  assert.match(scene, /--parallax-far-x/);
  assert.match(scene, /--parallax-mid-x/);
});

test('celestial and weather geometry is reusable', () => {
  for (const symbol of ['cloud-bank', 'sky-orb', 'aurora-strand', 'rain-field', 'snow-field', 'drought-field']) {
    assert.match(html, new RegExp(`<symbol id="${symbol}"`), `missing ${symbol}`);
  }
  assert.equal([...html.matchAll(/href="#sky-orb"/g)].length, 2);
  assert.equal([...html.matchAll(/href="#cloud-bank"/g)].length, 16);
  assert.equal([...html.matchAll(/href="#aurora-strand"/g)].length, 5);
  assert.match(css, /data-weather="cloudy"/);
  assert.match(css, /data-weather="overcast"/);
  assert.match(html, /class="weather-overcast scene-layer"[^>]+data-region="overcast-cloud-deck"/);
  assert.match(css, /data-weather="rainy"/);
  assert.match(css, /data-weather="snowy"/);
  assert.match(html, /class="weather-snow"[^>]+href="#snow-field"/);
  assert.match(css, /data-weather="drought"/);
  assert.match(html, /class="weather-drought"[^>]+href="#drought-field"/);
  assert.match(html, /<symbol id="wind-field"[^>]+data-regions="gust-streamers,leaf-debris"/);
  assert.match(html, /class="weather-wind"[^>]+href="#wind-field"/);
});

test('cloud formations reuse named geometry across weather states', () => {
  const cloud = html.match(/<symbol id="cloud-bank"[\s\S]*?<\/symbol>/)?.[0];
  for (const [region, variant] of [['cumulus-lobes','cumulus'], ['stratus-sheet','stratus'], ['cirrus-filaments','cirrus'], ['fractus-shreds','fractus']]) {
    assert.ok(cloud.includes(`data-region="${region}"`));
    assert.ok(cloud.includes(`--cloud-${variant}-display`));
  }
  assert.match(css, /\.overcast-cloud,\.mist-bank,\.rain-cloud \{[^}]*--cloud-stratus-display:inline/);
  assert.match(css, /data-weather="snowy"\] \.weather-rain-clouds \{[^}]*visibility:visible/);
});

test('day and night keep one active scene composition', () => {
  assert.match(html, /<use class="scene-orb sky-orb"/);
  assert.match(css, /\.day-scene \{ display:none!important; \}/);
  assert.match(css, /data-theme="day"\] \.scene-orb/);
  // Character poses may swap, but the camp and terrain remain one composition.
  assert.match(html, /data-region="bigfoot-tree-hideout"/);
  assert.match(html, /href="#mothman-body-art"/);
  assert.doesNotMatch(css, /data-theme="day"\][^{]+\.campfire[^}]+display:none/);
});
