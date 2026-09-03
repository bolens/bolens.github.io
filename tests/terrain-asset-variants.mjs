import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const html = readFileSync(resolve(root, '404.html'), 'utf8');
const css = readFileSync(resolve(root, 'assets/404.css'), 'utf8');
const assets = ['alpine-boulder', 'river-stone', 'fern-spray', 'berry-shrub', 'fly-agaric'];
const lightModes = ['ambient', 'sun', 'moon', 'fire', 'shadow'];
const weatherModes = ['clear', 'cloudy', 'rainy', 'wet', 'dry'];

test('every reusable terrain symbol exposes shared condition marks', () => {
  for (const asset of assets) {
    const symbol = html.match(new RegExp(`<symbol id="${asset}"[\\s\\S]*?</symbol>`))?.[0];
    assert.ok(symbol, `missing ${asset} symbol`);
    assert.match(symbol, /href="#terrain-condition-marks"/, `${asset} has no condition layer`);
  }
});

test('lighting and weather modes form an orthogonal variant matrix', () => {
  for (const mode of lightModes) assert.match(css, new RegExp(`data-light="${mode}"`), `missing ${mode} light mode`);
  for (const mode of weatherModes) assert.match(css, new RegExp(`data-weather="${mode}"`), `missing ${mode} weather mode`);
  assert.equal(lightModes.length * weatherModes.length * assets.length, 125);
});

test('every terrain placement opts into valid light and weather modes', () => {
  const placements = [...html.matchAll(/<use class="terrain-asset"[^>]+href="#([^"]+)"[^>]*>/g)].map((match) => match[0]);
  assert.equal(placements.length, 25);
  for (const placement of placements) {
    const asset = placement.match(/href="#([^"]+)"/)?.[1];
    const light = placement.match(/data-light="([^"]+)"/)?.[1];
    const weather = placement.match(/data-weather="([^"]+)"/)?.[1];
    assert.ok(assets.includes(asset), `unknown terrain asset ${asset}`);
    assert.ok(lightModes.includes(light), `invalid light mode ${light}`);
    assert.ok(weatherModes.includes(weather), `invalid weather mode ${weather}`);
  }
});
