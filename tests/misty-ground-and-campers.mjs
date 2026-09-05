import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const html = fs.readFileSync(new URL('../404.html', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../assets/404.css', import.meta.url), 'utf8');
const themes = JSON.parse(fs.readFileSync(new URL('../data/themes.json', import.meta.url), 'utf8'));

test('misty is a first-class weather condition', () => {
  assert.ok(themes.weatherModes.includes('misty'));
  assert.match(html, /class="weather-mist\b/);
  assert.match(css, /data-weather="misty"/);
  assert.match(css, /--asset-mist-opacity:/);
});

test('cloudy and rainy skies have condition-specific cloud depth', () => {
  const generalClouds = html.match(/class="weather-cloud[^" ]*/g) ?? [];
  const rainClouds = html.match(/class="rain-cloud\b/g) ?? [];
  assert.ok(generalClouds.length >= 5, 'cloudy should have several cloud banks');
  assert.ok(rainClouds.length >= 2, 'rain should add storm cloud banks');
});

test('weather changes the ground itself through layered condition detail', () => {
  assert.match(html, /data-scene-layer="ground-condition"/);
  for (const layer of ['wet-sheen', 'muted-duff', 'dry-cover', 'snow-cover', 'drought-soil', 'mist-pockets']) {
    assert.match(html, new RegExp(`data-region="${layer}"`), `missing ${layer}`);
  }
  for (const weather of themes.weatherModes) {
    if (weather === 'windy') {
      assert.match(css, /data-weather="windy"\] \.ground-weather-states \{ --condition-ground-opacity:0; \}/, 'wind alone does not change soil moisture');
      continue;
    }
    assert.match(css, new RegExp(`data-weather="${weather}"[^}]*--condition-ground-color:`), `${weather} has no ground palette`);
  }
});

test('the woman has no facial hair and the man has a restrained goatee', () => {
  assert.match(html, /class="terrain-asset tent-girl"[^>]*--camper-facial-hair-opacity:0/);
  assert.match(html, /data-region="mustache"/);
  assert.match(html, /data-region="goatee"/);
  assert.doesNotMatch(html, /M17 43q10 14 20 0v9/);
});
