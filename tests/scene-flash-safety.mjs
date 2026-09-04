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

test('time and weather palette changes interpolate instead of repainting in one frame', () => {
  assert.match(css, /\.lost-page \{[^}]*transition:background-color \.55s ease,color \.55s ease/);
  assert.match(css, /\.cryptid-camp svg :is\(path,rect,circle,ellipse,polygon,polyline,line\) \{ transition:fill \.55s ease,stroke \.55s ease; \}/);
  assert.match(css, /\.cryptid-camp svg stop \{ transition:stop-color \.55s ease,stop-opacity \.55s ease; \}/);
  assert.match(css, /\.terrain-asset \{[^}]*transition:filter \.55s ease/);
});

test('large scene washes crossfade without display toggles', () => {
  assert.match(css, /\.theme-light-wash \{ display:inline;[^}]*opacity:0;[^}]*transition:opacity \.55s ease/);
  assert.match(css, /\.scene-time-wash \{ display:inline;opacity:0;transition:opacity \.55s ease; \}/);
  assert.doesNotMatch(css, /\.theme-light-wash \{ display:none/);
  assert.doesNotMatch(css, /\.scene-time-wash \{ display:none/);
});
