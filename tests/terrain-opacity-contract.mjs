import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../404.html', import.meta.url), 'utf8');
const symbols = Object.fromEntries([...html.matchAll(/<symbol id="([^"]+)"[\s\S]*?<\/symbol>/g)].map((match) => [match[1], match[0]]));

test('solid reusable glyph geometry stays opaque', () => {
  assert.doesNotMatch(symbols['forest-trail'], /trail-stone[^>]*opacity=|trail-root[^>]*opacity=/);
  assert.doesNotMatch(symbols['alpine-boulder'], /boulder-facet[^>]*opacity=|fill="#8da06f" opacity=/);
  assert.doesNotMatch(symbols['fire-bed'], /fire-bed-fill[^>]*opacity=|fill="var\(--fire-bed-ash[^>]*opacity=/);
  assert.doesNotMatch(symbols['riverbank-profile'], /bank-soil[^>]*opacity=/);
  assert.doesNotMatch(symbols['coal-piece'], /coal-char[^>]*opacity=/);
  assert.doesNotMatch(symbols['ash-scatter'], /fill="var\(--ash-fill[^>]*opacity=/);
  assert.doesNotMatch(symbols['camp-tent-shell'], /tent-ground-edge[^>]*opacity=/);
});

test('whole physical glyph placements do not inherit translucency', () => {
  assert.doesNotMatch(html, /<use class="[^"]*terrain-asset[^"]*"[^>]+opacity="(?:0?\.[0-9]+)"/);
});

test('transparent reusable glyph parts are optical or atmospheric effects', () => {
  for (const id of ['cloud-bank', 'sky-orb', 'rain-field', 'snow-field', 'drought-field', 'ground-shadow', 'terrain-condition-marks', 'smoke-wisp', 'smoke-puff', 'ember-spark', 'sky-traveler', 'camp-lantern']) {
    assert.match(symbols[id], /opacity=/, `${id} should retain its intentional effect opacity`);
  }
});
