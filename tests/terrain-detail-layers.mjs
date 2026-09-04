import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../404.html', import.meta.url), 'utf8');
const css = await readFile(new URL('../assets/404.css', import.meta.url), 'utf8');
const symbols = Object.fromEntries([...html.matchAll(/<symbol id="([^"]+)"[\s\S]*?<\/symbol>/g)].map((match) => [match[1], match[0]]));

test('woody glyphs expose independently addressable detail layers', () => {
  const manifests = {
    'bare-tree': ['branch-scars', 'bark-grain'],
    'aspen-copse': ['twig-tips', 'leaf-speckles', 'bark-marks'],
    'willow-clump': ['leaf-veins', 'catkins'],
    'tree-stump': ['growth-rings', 'wood-grain', 'moss-rim', 'insect-holes'],
  };

  for (const [id, regions] of Object.entries(manifests)) {
    assert.ok(symbols[id], `${id} symbol is required`);
    for (const region of regions) assert.match(symbols[id], new RegExp(`data-regions="[^"]*${region}`));
    assert.match(symbols[id], /class="asset-detail-secondary"/);
    assert.match(symbols[id], /class="asset-detail-fine"/);
  }
});

test('forest-floor glyphs expose natural surface detail', () => {
  const manifests = {
    'moss-clump': ['sporophyte-stems', 'spore-caps'],
    'woodland-debris': ['twig-nodes', 'leaf-veins'],
    'ground-sprig': ['side-blades', 'seed-grains'],
    'fallen-branch': ['bark-plates', 'broken-tips', 'lichen-spots'],
    'river-stone': ['stone-facet', 'mineral-vein', 'lichen-specks'],
    'fern-spray': ['fern-pinnae', 'fiddlehead'],
  };

  for (const [id, regions] of Object.entries(manifests)) {
    assert.ok(symbols[id], `${id} symbol is required`);
    for (const region of regions) assert.match(symbols[id], new RegExp(`data-regions="[^"]*${region}`));
    assert.match(symbols[id], /class="asset-detail-secondary"/);
    assert.match(symbols[id], /class="asset-detail-fine"/);
  }
});

test('small botanical glyphs expose anatomical detail layers', () => {
  const manifests = {
    'fungi-cluster': ['stem-striations', 'cap-mottling', 'mycelium'],
    'shelf-fungi': ['attachment-scars', 'growth-bands', 'cap-pores'],
    'pinecone-sprig': ['twig', 'needle-highlights', 'scale-tips', 'resin-drops'],
    'wildflower-clump': ['stem-leaves', 'petal-veins', 'pollen-dots'],
    'reed-clump': ['stem-nodes', 'reed-blades', 'seed-heads', 'seed-grains'],
  };

  for (const [id, regions] of Object.entries(manifests)) {
    assert.ok(symbols[id], `${id} symbol is required`);
    for (const region of regions) assert.match(symbols[id], new RegExp(`data-regions="[^"]*${region}`));
    assert.match(symbols[id], /class="asset-detail-secondary"/);
    assert.match(symbols[id], /class="asset-detail-fine"/);
  }
});

test('campsite gear exposes construction and wear detail', () => {
  const manifests = {
    'trail-boots': ['toe-caps', 'eyelets', 'tread-lugs', 'scuff-marks'],
    'camp-storage': ['panel-ribs', 'lid-seam', 'corner-guards', 'latches'],
    'sleeping-roll': ['compression-straps', 'buckles', 'zipper-pull', 'fabric-creases'],
    'trail-camera': ['camera-camouflage', 'infrared-array', 'status-light', 'controls'],
  };

  for (const [id, regions] of Object.entries(manifests)) {
    assert.ok(symbols[id], `${id} symbol is required`);
    for (const region of regions) assert.match(symbols[id], new RegExp(`data-regions="[^"]*${region}`));
    assert.match(symbols[id], /class="asset-detail-secondary"/);
    assert.match(symbols[id], /class="asset-detail-fine"/);
  }
});

test('rock and fire-bed glyphs expose material detail layers', () => {
  const manifests = {
    'alpine-boulder': ['fracture-lines', 'mineral-veins', 'lichen-specks'],
    'fire-ring-stone': ['mineral-specks', 'soot-band'],
    'fire-bed': ['scorched-edge', 'coal-fissures', 'char-dust'],
    'coal-piece': ['char-flakes', 'ash-dust'],
    'ash-scatter': ['ash-ridges', 'char-flecks'],
  };

  for (const [id, regions] of Object.entries(manifests)) {
    assert.ok(symbols[id], `${id} symbol is required`);
    for (const region of regions) assert.match(symbols[id], new RegExp(`data-regions="[^"]*${region}`));
    assert.match(symbols[id], /class="asset-detail-secondary"/);
    assert.match(symbols[id], /class="asset-detail-fine"/);
  }
});

test('detail density can vary by placement without changing geometry', () => {
  for (const tier of ['simple', 'standard', 'rich']) {
    assert.match(css, new RegExp(`terrain-asset\\[data-detail="${tier}"\\]`));
    assert.match(html, new RegExp(`data-detail="${tier}"`));
  }
  assert.match(css, /\.asset-detail-secondary \{ opacity:var\(--asset-detail-secondary-opacity/);
  assert.match(css, /\.asset-detail-fine \{ opacity:var\(--asset-detail-fine-opacity/);
  assert.doesNotMatch(css, /terrain-asset\[data-detail="(?:simple|standard|rich)"\][^{]+\{[^}]*display:/);
});

test('weather and lighting tune fine detail through inherited variables', () => {
  assert.match(css, /terrain-asset\[data-light="shadow"\] \{ --asset-detail-fine-opacity:\.18; \}/);
  assert.match(css, /data-weather="overcast"[^}]+--asset-detail-fine-opacity:\.24/);
  assert.match(css, /data-weather="wet"[^}]+terrain-asset\[data-detail="rich"\][^}]+--asset-detail-fine-opacity:1/);
});
