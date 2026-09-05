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
  assert.match(cover, /data-region="route-head-earth"/);
  assert.match(cover, /data-region="route-head-snow"/);
  assert.doesNotMatch(cover, /href="#distant-pine"/, 'route heads disappear under low earth, not a pine crown');
  assert.ok(html.indexOf(cover) > html.indexOf('data-region="winding-forest-trail"'));
  assert.ok(html.indexOf(cover) > html.indexOf('data-region="river-water-level"'));
});

test('river channel and highlight start within the upstream reach', () => {
  assert.match(html, /M486 453c-28-14-27-10-75 25/);
  assert.match(html, /M490 450c-20-14-21 2-70 38/);
  assert.doesNotMatch(html, /M474 365c-45 47|M481 380c-35 43/);
});

test('the distant river bends across the ground instead of rising into the canopy', () => {
  const bend = html.match(/data-region="distant-river-bend" d="([^"]+)"/)[1];
  const glint = html.match(/data-region="distant-river-glint" d="([^"]+)"/)[1];
  assert.match(bend, /^M554 465/);
  assert.match(glint, /^M550 462/);
  assert.doesNotMatch(html, /M596 344q|M590 349q/);
  assert.ok(html.indexOf('data-region="distant-river-bend"') < html.indexOf('data-region="river-trail-head-cover"'));
});
