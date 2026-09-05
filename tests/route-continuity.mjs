import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../404.html', import.meta.url), 'utf8');

test('trail keeps its original scale and extends beyond the scene, without symbol clipping', () => {
  assert.match(html, /id="forest-trail" viewBox="0 0 700 430"/);
  assert.match(html, /href="#forest-trail" x="510" y="401" width="700" height="430"/);
  const trail = html.match(/<symbol id="forest-trail"[\s\S]*?<\/symbol>/)[0];
  assert.match(trail, /L700 410l-38 30-222-80/);
  assert.match(trail, /L684 423/);
  const placement = html.match(/href="#forest-trail" x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/).slice(1).map(Number);
  const viewBox = trail.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
  const endpoint = trail.match(/L([\d.]+) ([\d.]+)l/).slice(1).map(Number);
  assert.ok(placement[0] + endpoint[0] * placement[2] / viewBox[2] > 1200);
  assert.ok(placement[1] + endpoint[1] * placement[3] / viewBox[3] > 760);
});

test('route entrance cover paints after both routes and survives density reduction', () => {
  const cover = html.match(/<g class="route-entrance-screen[\s\S]*?<\/g>/)[0];
  assert.doesNotMatch(cover, /data-density-hide|data-dynamic-detail|opacity=/);
  assert.match(cover, /class="terrain-asset" data-light="ambient" data-weather="clear" href="#distant-pine"/);
  assert.ok(html.indexOf(cover) > html.indexOf('data-region="winding-forest-trail"'));
  assert.ok(html.indexOf(cover) > html.indexOf('data-region="river-water-level"'));
});

test('river channel and highlight start within the upstream reach', () => {
  assert.match(html, /M486 419c-28 20-27 24-75 59/);
  assert.match(html, /M490 416c-20 20-21 36-70 72/);
  assert.doesNotMatch(html, /M474 365c-45 47|M481 380c-35 43/);
});
