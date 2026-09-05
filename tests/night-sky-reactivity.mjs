import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const html = readFileSync(resolve(root, '404.html'), 'utf8');
const css = readFileSync(resolve(root, 'assets/404.css'), 'utf8');

test('night travelers reuse one configurable detailed symbol', () => {
  const symbol = html.match(/<symbol id="sky-traveler"[\s\S]*?<\/symbol>/)?.[0];
  assert.ok(symbol);
  for (const region of ['ion-tail', 'dust-tail', 'heated-head', 'fragment-trail']) assert.match(symbol, new RegExp(region));
  const placements = [...html.matchAll(/<use class="sky-traveler [^"]+"[^>]+href="#sky-traveler"/g)].map(([value]) => value);
  assert.equal(placements.length, 4);
  assert.equal(placements.filter((value) => value.includes('data-traveler-kind="shooting-star"')).length, 2);
  assert.ok(placements.some((value) => value.includes('data-traveler-kind="meteor"')));
  assert.ok(placements.some((value) => value.includes('data-traveler-kind="comet"')));
});

test('traveler timing stays occasional and condition-aware', () => {
  assert.match(css, /@keyframes shooting-star-pass \{ 0%,70% \{ opacity:0;[^}]+\} 73% \{ opacity:\.12; \} 78% \{ opacity:\.72;/);
  assert.match(css, /@keyframes meteor-pass \{ 0%,47% \{ opacity:0;[^}]+\} 51% \{ opacity:\.2; \} 55% \{ opacity:\.78;/);
  assert.doesNotMatch(css, /@keyframes comet-pass/);
  assert.match(css, /data-scene-time="twilight"[^\n]+data-scene-time="night"[^\n]+\.night-sky-travelers \{ display:inline; \}/);
  assert.match(css, /data-scene-time="evening"\] \.night-sky-travelers \{ display:inline;--sky-traveler-visibility:\.18; \}/);
  assert.match(css, /data-weather="overcast"[^\n]+data-weather="rainy"[^\n]+data-weather="snowy"[^\n]+\.night-sky-travelers \{ display:none; \}/);
  assert.match(css, /data-weather="cloudy"\] \.night-sky-travelers \{ --sky-traveler-visibility:\.28; \}/);
  assert.match(css, /prefers-reduced-motion: reduce[\s\S]+\.night-sky-travelers \{ display:none!important; \}/);
});

test('cloud cover softens celestial rays and shared cast shadows', () => {
  assert.match(css, /data-weather="cloudy"\] \.solar-ray-field/);
  assert.match(css, /data-weather="overcast"[^\n]+data-weather="rainy"[^\n]+\.terrain-asset \{ --asset-time-shadow:/);
  assert.match(css, /data-weather="snowy"\] \.terrain-asset \{ --asset-time-shadow:/);
});
