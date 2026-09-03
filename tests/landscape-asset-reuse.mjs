import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const html = readFileSync(resolve(root, '404.html'), 'utf8');

test('seating and firewood share one scalable detailed log', () => {
  assert.match(html, /<symbol id="camp-log" viewBox="0 0 320 44">/);
  assert.equal([...html.matchAll(/href="#camp-log"/g)].length, 8);
  assert.doesNotMatch(html, /charred-log-detail/);
});

test('both mountain ranges reuse one scalable detailed peak', () => {
  assert.match(html, /<symbol id="alpine-peak" viewBox="0 0 240 220">/);
  assert.equal([...html.matchAll(/href="#alpine-peak"/g)].length, 13);
  assert.match(html, /class="mountain-range mountain-range-far depth-far"/);
  assert.match(html, /class="mountain-range mountain-range-near depth-far"/);
  assert.doesNotMatch(html, /class="mountain-faces/);
});

test('fire ring and forest floor use configurable asset families', () => {
  assert.equal([...html.matchAll(/href="#fire-ring-stone"/g)].length, 10);
  assert.equal([...html.matchAll(/href="#fire-bed"/g)].length, 1);
  assert.equal([...html.matchAll(/href="#woodland-debris"/g)].length, 9);
  assert.equal([...html.matchAll(/href="#ground-sprig"/g)].length, 4);
  assert.equal([...html.matchAll(/href="#moss-clump"/g)].length, 4);
  assert.equal([...html.matchAll(/href="#fungi-cluster"/g)].length, 3);
  assert.equal([...html.matchAll(/href="#shelf-fungi"/g)].length, 2);
  assert.equal([...html.matchAll(/href="#pinecone-sprig"/g)].length, 3);
  assert.equal([...html.matchAll(/href="#wildflower-clump"/g)].length, 3);
  assert.equal([...html.matchAll(/href="#fallen-branch"/g)].length, 2);
  assert.doesNotMatch(html, /class="forest-litter"|class="forest-duff"|class="forest-floor-texture"/);
  assert.doesNotMatch(html, /class="mushroom-detail"|class="shelf-fungi"/);
});
