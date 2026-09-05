import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../404.html', import.meta.url), 'utf8');
const symbols = Object.fromEntries([...html.matchAll(/<symbol id="([^"]+)"[\s\S]*?<\/symbol>/g)].map((match) => [match[1], match[0]]));
const before = (symbol, rear, front) => {
  const rearIndex = symbol.indexOf(rear);
  const frontIndex = symbol.indexOf(front);
  assert.notEqual(rearIndex, -1, `missing ${rear}`);
  assert.notEqual(frontIndex, -1, `missing ${front}`);
  assert.ok(rearIndex < frontIndex, `${rear} must paint behind ${front}`);
};

test('opaque glyph bodies cover structural details that sit behind them', () => {
  before(symbols['distant-pine'], 'data-region="bark-segments"', 'data-region="needle-tiers"');
  before(symbols['aspen-copse'], 'data-region="bark-marks"', 'data-region="leaf-clusters"');
  before(symbols['camp-bench'], 'stroke="var(--bench-support', 'href="#camp-log"');
  before(symbols['river-pebble-cluster'], 'stroke="var(--bank-silt', 'fill="var(--bank-pebble');
});

test('light halos paint behind their crisp emitters', () => {
  before(symbols['firefly-pair'], 'stroke="var(--firefly-glow', 'fill="var(--firefly-fill');
  before(symbols['ember-spark'], 'stroke="var(--ember-halo', 'fill="var(--ember-fill');
});

test('weather condition overlays are the final paint operation in reusable terrain glyphs', () => {
  for (const [id, symbol] of Object.entries(symbols)) {
    if (!symbol.includes('href="#terrain-condition-marks"')) continue;
    const lastCondition = symbol.lastIndexOf('href="#terrain-condition-marks"');
    const lastGraphic = Math.max(...['<path', '<rect', '<circle', '<ellipse', '<polygon', '<polyline', '<line', '<g', '<use']
      .map((tag) => symbol.lastIndexOf(tag)));
    assert.ok(lastCondition >= lastGraphic, `${id} must paint weather marks after its material layers`);
  }
});
