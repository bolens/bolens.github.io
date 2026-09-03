import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const html = readFileSync(resolve(root, '404.html'), 'utf8');
const css = readFileSync(resolve(root, 'assets/404.css'), 'utf8');
const assets = [
  'alpine-boulder',
  'river-stone',
  'fern-spray',
  'berry-shrub',
  'evergreen-shrub',
  'fire-ring-stone',
  'fire-bed',
  'moss-clump',
  'woodland-debris',
  'ground-sprig',
  'fungi-cluster',
  'fly-agaric',
  'shelf-fungi',
  'pinecone-sprig',
  'wildflower-clump',
  'fallen-branch',
  'reed-clump',
  'trail-boots',
  'camp-storage',
  'river-ripple',
  'water-foam',
  'firefly-pair',
  'coal-piece',
  'ash-scatter',
  'ember-spark',
  'camp-tent-shell',
  'camp-stove',
  'toasted-marshmallow',
  'camp-snack-plate',
  'riverbank-profile',
  'exposed-root',
  'river-pebble-cluster',
];
const lightModes = ['ambient', 'sun', 'moon', 'fire', 'shadow'];
const weatherModes = ['clear', 'cloudy', 'rainy', 'wet', 'dry', 'snowy', 'drought'];

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
  assert.equal(lightModes.length * weatherModes.length * assets.length, 1120);
});

test('snow supports asset-level selection and scene-wide accumulation', () => {
  assert.match(html, /class="asset-snow-mark"/);
  assert.match(css, /\.terrain-asset\[data-weather="snowy"\],:root\[data-weather="snowy"\] \.terrain-asset/);
  assert.match(css, /:root\[data-weather="snowy"\] \.terrain-asset\[data-light="fire"\]/);
});

test('drought supports asset-level selection and scene-wide stress', () => {
  assert.match(html, /class="asset-drought-mark"/);
  assert.match(css, /\.terrain-asset\[data-weather="drought"\],:root\[data-weather="drought"\] \.terrain-asset/);
  assert.match(css, /:root\[data-weather="drought"\] \.terrain-asset\[data-light="fire"\]/);
});

test('every terrain placement opts into valid light and weather modes', () => {
  const placements = [...html.matchAll(/<use class="[^"]*\bterrain-asset\b[^"]*"[^>]+href="#([^"]+)"[^>]*>/g)].map((match) => match[0]);
  assert.equal(placements.length, 149);
  for (const placement of placements) {
    const asset = placement.match(/href="#([^"]+)"/)?.[1];
    const light = placement.match(/data-light="([^"]+)"/)?.[1];
    const weather = placement.match(/data-weather="([^"]+)"/)?.[1];
    assert.ok(assets.includes(asset), `unknown terrain asset ${asset}`);
    assert.ok(lightModes.includes(light), `invalid light mode ${light}`);
    assert.ok(weatherModes.includes(weather), `invalid weather mode ${weather}`);
  }
});

test('scene conditions swap secondary details without moving the campsite', () => {
  const conditionRegions = {
    wet: 'wet-growth',
    dry: 'dry-ground-litter',
    snow: 'snow-covered-ground-detail',
    drought: 'drought-ground-debris',
  };
  for (const [condition, region] of Object.entries(conditionRegions)) {
    assert.match(html, new RegExp(`class="condition-detail condition-${condition}[^>]+data-region="${region}"`));
    assert.match(css, new RegExp(`condition-${condition} \\{ display:inline; \\}`));
  }
  for (const mode of weatherModes) {
    assert.match(css, new RegExp(`data-weather="${mode}"\\] \\.terrain-asset`), `${mode} must override reusable assets scene-wide`);
  }
  assert.match(css, /data-weather="rainy"[^\n]+\.forest-fireflies/);
  assert.match(css, /data-weather="drought"[^\n]+\.river-ferns/);
});
