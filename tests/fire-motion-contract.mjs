import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const html = readFileSync(resolve(root, '404.html'), 'utf8');
const css = readFileSync(resolve(root, 'assets/404.css'), 'utf8');
const scene = readFileSync(resolve(root, 'assets/404-scene.js'), 'utf8');

test('coals stay planted while their glow changes gently', () => {
  const pulse = css.match(/@keyframes coal-pulse \{[^}]+\}[^}]+\}/)?.[0];
  assert.ok(pulse, 'coal pulse keyframes are required');
  assert.doesNotMatch(pulse, /(?:scale|translate|rotate):/);
  assert.match(pulse, /opacity:\.72/);
  assert.match(css, /animation:coal-pulse 2\.8s ease-in-out infinite alternate/);
});

test('fallback SVG sparks remain small and close to the flame', () => {
  const group = html.match(/<g class="embers">([\s\S]*?)<\/g>/)?.[1];
  assert.ok(group, 'ember group is required');
  const sparks = [...group.matchAll(/<use [^>]+>/g)].map((match) => match[0]);
  assert.equal(sparks.length, 6);
  for (const spark of sparks) {
    assert.ok(Number(spark.match(/ y="([^"]+)"/)?.[1]) >= 608, `spark starts too high: ${spark}`);
    assert.ok(Number(spark.match(/ width="([^"]+)"/)?.[1]) <= 8, `spark is too large: ${spark}`);
  }

  const lifts = [...css.matchAll(/--ember-lift:-([0-9]+)px/g)].map((match) => Number(match[1]));
  const drifts = [...css.matchAll(/--ember-drift-x:-?([0-9]+)px/g)].map((match) => Number(match[1]));
  assert.ok(Math.max(...lifts) <= 21);
  assert.ok(Math.max(...drifts) <= 3);
});

test('canvas embers use a restrained physical envelope', () => {
  assert.match(scene, /length: restrained \? 4 : 7/);
  assert.match(scene, /x: range\(-15, 15\), lift: range\(14, 38\), sway: range\(-5, 5\), radius: range\(\.55, 1\.15\)/);
  assert.match(scene, /const progress = \(time \* \.1 \+ ember\.phase\) % 1/);
  assert.doesNotMatch(scene, /lift: range\(22, 78\)/);
});
