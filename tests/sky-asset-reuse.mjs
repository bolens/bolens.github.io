import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const html = readFileSync(resolve(root, '404.html'), 'utf8');
const css = readFileSync(resolve(root, 'assets/404.css'), 'utf8');
const scene = readFileSync(resolve(root, 'assets/404-scene.js'), 'utf8');

test('tree rows occupy independent parallax depths', () => {
  assert.match(html, /class="horizon-forest depth-back"/);
  assert.match(html, /class="deep-forest depth-mid"/);
  assert.match(css, /\.depth-back \{ translate:var\(--parallax-back-x,0\)/);
  assert.match(scene, /--parallax-back-x/);
  assert.match(scene, /--parallax-back-y/);
});

test('celestial and weather geometry is reusable', () => {
  for (const symbol of ['cloud-bank', 'sky-orb', 'aurora-strand', 'rain-field', 'snow-field', 'drought-field']) {
    assert.match(html, new RegExp(`<symbol id="${symbol}"`), `missing ${symbol}`);
  }
  assert.equal([...html.matchAll(/href="#sky-orb"/g)].length, 2);
  assert.equal([...html.matchAll(/href="#cloud-bank"/g)].length, 4);
  assert.equal([...html.matchAll(/href="#aurora-strand"/g)].length, 5);
  assert.match(css, /data-weather="cloudy"/);
  assert.match(css, /data-weather="rainy"/);
  assert.match(css, /data-weather="snowy"/);
  assert.match(html, /class="weather-snow"[^>]+href="#snow-field"/);
  assert.match(css, /data-weather="drought"/);
  assert.match(html, /class="weather-drought"[^>]+href="#drought-field"/);
});

test('day and night keep one active scene composition', () => {
  assert.match(html, /<use class="scene-orb sky-orb"/);
  assert.match(css, /\.day-scene \{ display:none!important; \}/);
  assert.match(css, /data-theme="day"\] \.scene-orb/);
  assert.doesNotMatch(css, /data-theme="day"\][^{]+\.camper[^}]+display:none/);
  assert.doesNotMatch(css, /data-theme="day"\][^{]+\.campfire[^}]+display:none/);
});
