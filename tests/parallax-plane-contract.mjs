import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../404.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../assets/404.css', import.meta.url), 'utf8');
const scene = readFileSync(new URL('../assets/404-scene.js', import.meta.url), 'utf8');

test('parallax moves a bounded set of coherent terrain planes', () => {
  const planes = [...html.matchAll(/<g class="([^"]+)" data-parallax-plane="(back|far|mid|near)"/g)];
  assert.equal(planes.length, 7);
  assert.deepEqual(planes.map((match) => match[2]).sort(), ['back', 'far', 'far', 'far', 'mid', 'mid', 'near']);
  assert.ok(planes.every((match) => match[1].includes(`depth-${match[2]}`)));
});

test('focal subjects and reactive overlays stay outside moving planes', () => {
  for (const className of ['camper bigfoot', 'camper alien', 'camper mothman', 'camper dogman', 'campfire scene-layer', 'river depth-mid', 'condition-detail condition-snow']) {
    const element = html.match(new RegExp(`<g class="${className}[^>]*>`))?.[0];
    assert.ok(element, `missing scene group: ${className}`);
    assert.doesNotMatch(element, /data-parallax-plane=/);
  }
});

test('static depth groups cannot inherit live parallax repaints', () => {
  assert.match(css, /\.depth-back:not\(\[data-parallax-plane\]\)[^{]+\{ translate:0 0;transition:none; \}/);
  assert.match(css, /\.cryptid-camp\.is-parallax-tracking \[data-parallax-plane\] \{ transition:none; \}/);
  assert.match(scene, /if \(parallaxValues\.get\(name\) === next\) return;/);
});
