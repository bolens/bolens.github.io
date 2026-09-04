import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const html = readFileSync(resolve(root, '404.html'), 'utf8');
const css = readFileSync(resolve(root, 'assets/404.css'), 'utf8');


test('coals stay planted while their glow changes gently', () => {
  const pulse = css.match(/@keyframes coal-pulse \{[^}]+\}[^}]+\}/)?.[0];
  assert.ok(pulse, 'coal pulse keyframes are required');
  assert.doesNotMatch(pulse, /(?:scale|translate|rotate):/);
  assert.match(pulse, /opacity:\.82/);
  assert.match(pulse, /opacity:\.96/);
  assert.match(css, /animation:coal-pulse 3\.6s ease-in-out infinite alternate/);
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
  assert.ok(lifts.length > 0, 'ember lift properties are required');
  assert.ok(drifts.length > 0, 'ember drift properties are required');
  assert.ok(Math.max(...lifts) <= 21);
  assert.ok(Math.max(...drifts) <= 3);
});
