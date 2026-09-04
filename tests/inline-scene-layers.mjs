import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../404.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../assets/404.css', import.meta.url), 'utf8');

const namedInlineRegions = [
  ['sky-airglow', 'sky-airglow-bands', 'fine', 'atmosphere'],
  ['camp-stars', 'fixed-star-field', 'fine', 'atmosphere'],
  ['river-ripples', 'river-surface-ripples', 'secondary', 'water'],
  ['river-reflections', 'river-light-reflections', 'fine', 'water'],
  ['river-stones', 'submerged-river-stones', 'secondary', 'water'],
  ['riparian-foliage', 'riparian-fern-line', 'secondary', 'vegetation'],
  ['bank-reeds', 'riverbank-reed-line', 'secondary', 'vegetation'],
  ['water-foam-patches', 'river-foam-patches', 'fine', 'water'],
  ['forest-fireflies', 'forest-firefly-field', 'effect', 'wildlife'],
  ['fire-rim-light', 'campfire-rim-light', 'effect', 'fire'],
  ['campfire scene-layer', 'campfire-assembly', 'base', 'fire'],
  ['fire-logs', 'campfire-log-stack', 'base', 'fire'],
  ['flame-stack', 'open-flame', 'effect', 'fire'],
  ['smoke-404 scene-layer', 'campfire-number-smoke', 'effect', 'smoke'],
];

for (const [className, region, layer, reactiveSystem] of namedInlineRegions) {
  const group = html.match(new RegExp(`<g class="${className}"[^>]*>`))?.[0];
  assert.ok(group, `missing inline group: ${className}`);
  assert.match(group, new RegExp(`data-region="${region}"`));
  assert.match(group, new RegExp(`data-detail-layer="${layer}"`));
  assert.match(group, new RegExp(`data-weather-reactive="${reactiveSystem}"`));
  assert.match(group, /data-light-reactive=/);
}

assert.match(css, /\[data-dynamic-detail\]\s*\{[^}]+--inline-density-opacity/);
assert.match(css, /data-scene-density="compact"[^}]+data-detail-layer="fine"[^}]+--inline-density-opacity:\.42/);
assert.match(css, /data-weather="drought"[^}]+data-weather-reactive="water"[^}]+--inline-weather-opacity:\.4/);
assert.match(css, /data-scene-time="day"[^}]+data-weather-reactive="atmosphere"[^}]+--inline-weather-opacity:0/);

console.log('inline scene layer contracts passed');
