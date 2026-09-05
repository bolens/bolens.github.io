import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../404.html', import.meta.url), 'utf8');
const css = await readFile(new URL('../assets/404.css', import.meta.url), 'utf8');
const symbol = (id) => html.match(new RegExp(`<symbol id="${id}"[\\s\\S]*?</symbol>`))?.[0] || '';

test('rain snow and wind share the front weather plane without sharing geometry', () => {
  for (const [className, asset] of [['weather-rain', 'rain-field'], ['weather-snow', 'snow-field'], ['weather-wind', 'wind-field']]) {
    assert.match(html, new RegExp(`class="${className}" data-scene-layer="precipitation-front"[^>]+href="#${asset}"`));
  }
  assert.match(symbol('rain-field'), /<path /);
  assert.doesNotMatch(symbol('rain-field'), /<circle /);
  assert.match(symbol('snow-field'), /<circle /);
  assert.doesNotMatch(symbol('snow-field'), /<path /);
  assert.match(symbol('wind-field'), /data-region="gust-streamers"[\s\S]*data-region="leaf-debris"/);
});

test('each airborne condition has its own bounded motion and crossfade selector', () => {
  assert.match(css, /\.weather-rain \{[^}]+animation:weather-rain-fall 1\.1s linear infinite/);
  assert.match(css, /\.weather-snow \{[^}]+animation:weather-snow-drift 8s linear infinite/);
  assert.match(css, /\.weather-mist \{[^}]+animation:weather-mist-drift 16s ease-in-out infinite alternate/);
  assert.match(css, /\.weather-wind \{[^}]+animation:weather-wind-pass 3\.8s ease-in-out infinite/);
  for (const condition of ['misty', 'rainy', 'snowy', 'windy']) assert.match(css, new RegExp(`data-weather="${condition}"[^}]+\\.weather-`));
  assert.match(css, /\.weather-clouds,\.weather-rain-clouds,\.weather-mist,\.weather-overcast,\.weather-rain,\.weather-snow,\.weather-drought,\.weather-wind \{ display:inline;opacity:0;visibility:hidden;[^}]+transition:opacity \.38s ease/);
});
