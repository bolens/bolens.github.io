import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../404.html', import.meta.url), 'utf8');
const css = await readFile(new URL('../assets/404.css', import.meta.url), 'utf8');
const symbol = (id) => html.match(new RegExp(`<symbol id="${id}"[\\s\\S]*?<\\/symbol>`))?.[0] ?? '';

test('fungi clusters expose independently positionable fruiting bodies', () => {
  const fungi = symbol('fungi-cluster');
  assert.equal([...fungi.matchAll(/class="fungi-fruit /g)].length, 4);
  for (const fruit of ['a', 'b', 'c', 'd']) assert.match(fungi, new RegExp(`fungi-fruit-${fruit}`));
  assert.match(css, /\.fungi-fruit \{[^}]+translate:var\(--fruit-x[^}]+rotate:var\(--fruit-lean[^}]+scale:var\(--fruit-scale/);
});

test('shelf fungi expose independently positionable growth tiers', () => {
  const shelves = symbol('shelf-fungi');
  assert.equal([...shelves.matchAll(/class="shelf-tier /g)].length, 2);
  assert.match(shelves, /shelf-tier-low/);
  assert.match(shelves, /shelf-tier-high/);
  assert.match(css, /\.shelf-tier \{[^}]+translate:var\(--shelf-x[^}]+rotate:var\(--shelf-lean[^}]+scale:var\(--shelf-scale/);
});

test('scene mushroom placements vary composition scale baseline and rotation', () => {
  const fungi = [...html.matchAll(/<use class="terrain-asset"[^>]+href="#fungi-cluster"[^>]+>/g)].map(([source]) => source);
  const shelves = [...html.matchAll(/<use class="terrain-asset"[^>]+href="#shelf-fungi"[^>]+>/g)].map(([source]) => source);
  const agarics = [...html.matchAll(/<use class="terrain-asset"[^>]+href="#fly-agaric"[^>]+>/g)].map(([source]) => source);
  assert.equal(fungi.length, 4);
  assert.ok(fungi.every((source) => source.includes('--fungi-') && source.includes('transform="rotate(')));
  assert.equal(new Set(fungi.map((source) => source.match(/ y="(\d+)"/)?.[1])).size, 4);
  assert.equal(shelves.length, 2);
  assert.ok(shelves.every((source) => source.includes('--shelf-') && source.includes('transform="rotate(')));
  assert.equal(agarics.length, 2);
  assert.ok(agarics.every((source) => source.includes('transform="rotate(')));
});
