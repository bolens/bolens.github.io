import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const css = await readFile(new URL('../assets/404.css', import.meta.url), 'utf8');
const html = await readFile(new URL('../404.html', import.meta.url), 'utf8');
const scene = await readFile(new URL('../assets/404-scene.js', import.meta.url), 'utf8');

test('scene density resolves deterministically from measured width', () => {
  assert.match(scene, /densityForWidth = \(viewportWidth\) => viewportWidth <= 430 \? 'compact' : viewportWidth <= 760 \? 'reduced' : 'full'/);
  assert.match(scene, /figure\.dataset\.sceneDensity = densityForWidth\(width\)/);
  assert.match(css, /data-scene-density="reduced"[^}]+--asset-detail-fine-opacity:\.18/);
  assert.match(css, /data-scene-density="compact"[^}]+--asset-detail-secondary-opacity:\.56;--asset-detail-fine-opacity:\.14/);
});

test('narrow scenes progressively remove redundant terrain rows', () => {
  const tablet = css.match(/@media \(max-width: 760px\) \{([\s\S]*?)\n\}/)?.[1] ?? '';
  const phone = css.match(/@media \(max-width: 430px\) \{([\s\S]*?)\n\}/)?.[1] ?? '';

  assert.match(tablet, /\.mountain-range-far,\.horizon-forest,\[data-density-hide="tablet"\] \{ display:none; \}/);
  assert.match(phone, /\.mountain-range-middle,\.forest-transition,\[data-density-hide="phone"\] \{ display:none; \}/);
});

test('secondary atmosphere, brush, rocks, and floor scatter opt into density reduction', () => {
  for (const className of ['horizon-brush', 'forest-mist', 'forest-floor-contours', 'midstory-brush', 'fungi-patches', 'shelf-fungi-patches']) {
    assert.match(html, new RegExp(`class="[^"]*${className}[^"]*"[^>]+data-density-hide="(?:tablet|phone)"`));
  }
  assert.ok([...html.matchAll(/data-density-hide="tablet"/g)].length >= 8);
  assert.ok([...html.matchAll(/data-density-hide="phone"/g)].length >= 8);
});

test('main campsite subjects never opt into responsive hiding', () => {
  for (const className of ['camper bigfoot', 'camper alien', 'camper mothman', 'camper dogman', 'campfire', 'camp-tent']) {
    const tag = html.match(new RegExp(`<[^>]+class="[^"]*${className}[^"]*"[^>]*>`))?.[0] ?? '';
    assert.ok(tag, `missing ${className}`);
    assert.doesNotMatch(tag, /data-density-hide=/);
  }
});

test('responsive density rules preserve the near terrain and camp frame', () => {
  for (const selector of ['mountain-range-near', 'deep-forest', 'camp-pines']) {
    assert.doesNotMatch(css, new RegExp(`@media \\(max-width: (?:760|430)px\\) \\{[\\s\\S]*?\\.${selector}[^}]*display:none`));
  }
});
