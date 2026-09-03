import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../404.html', import.meta.url), 'utf8');
const css = await readFile(new URL('../assets/404.css', import.meta.url), 'utf8');

test('scene state is resolved before styles can paint default conditions', () => {
  const stylesheet = html.indexOf('<link rel="stylesheet"');
  const weather = html.indexOf('<script src="/assets/404-weather.js"></script>');
  const time = html.indexOf('<script src="/assets/404-time.js"></script>');

  assert.ok(weather > -1 && weather < stylesheet);
  assert.ok(time > weather && time < stylesheet);
  assert.doesNotMatch(html, /404-(?:weather|time)\.js" defer/);
});

test('the scene reveals without a full-frame loading shimmer', () => {
  assert.match(css, /\.cryptid-camp \{[^}]*transition:opacity \.24s ease-out/);
  assert.match(css, /\.is-loading \.cryptid-camp \{ opacity:0; \}/);
  assert.match(css, /\.is-loading \.cryptid-camp::after \{ display:none; \}/);
});

test('small reactive lights avoid abrupt high-contrast flashes', () => {
  assert.doesNotMatch(css, /camera-snapshot/);
  assert.doesNotMatch(css, /rain-flame-flicker [^;]*steps\(/);
  assert.match(css, /rain-flame-flicker 1\.1s ease-in-out infinite/);
});

test('large condition layers crossfade instead of toggling display', () => {
  assert.match(css, /\.weather-clouds,\.weather-overcast,\.weather-rain,\.weather-snow,\.weather-drought \{ display:inline;opacity:0;visibility:hidden;[^}]*transition:opacity \.38s ease/);
  assert.doesNotMatch(css, /\.weather-clouds,\.weather-overcast,\.weather-rain,\.weather-snow,\.weather-drought \{ display:none/);
  assert.match(css, /\.condition-detail \{ display:inline;opacity:0;visibility:hidden;[^}]*transition:opacity \.38s ease/);
  assert.doesNotMatch(css, /data-weather="drought"\] :is\(\.campfire[^}]*display:none/);
});

test('canvas takeover fades matching SVG effects', () => {
  assert.match(html, /\.forest-fireflies,\.embers,\.scene-grain \{ transition:opacity \.28s ease-out; \}/);
  assert.match(html, /\.hybrid-effects-ready \.forest-fireflies,\.hybrid-effects-ready \.embers,\.hybrid-effects-ready \.scene-grain \{ opacity:0; \}/);
});
