import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../assets/hobby-motion.js', import.meta.url), 'utf8');
function setup() {
  const listeners = new Map();
  const media = { matches: false, addEventListener: (_, callback) => listeners.set('media', callback) };
  const timelines = Array.from({ length: 3 }, () => ({
    paused: false,
    pauseAnimations() { this.paused = true; },
    unpauseAnimations() { this.paused = false; },
  }));
  const section = { dataset: {}, querySelectorAll: () => timelines };
  const document = {
    hidden: false,
    documentElement: { dataset: {}, classList: { contains: () => false } },
    querySelector: () => section,
    addEventListener: (type, callback) => listeners.set(type, callback),
  };
  let intersect;
  vm.runInNewContext(source, {
    document, matchMedia: () => media,
    window: { portfolioAppearance: { subscribe: (callback) => listeners.set('appearance', callback) } },
    addEventListener: (type, callback) => listeners.set(type, callback),
    IntersectionObserver: class { constructor(callback) { intersect = callback; } observe() {} },
  });
  return {
    section, timelines,
    intersect: (isIntersecting) => intersect([{ isIntersecting }]),
    overlay: (active) => listeners.get('ui-overlay-change')({ detail: { active } }),
    hide(hidden) { document.hidden = hidden; listeners.get('visibilitychange')(); },
    reduce(matches) { media.matches = matches; listeners.get('media')(); },
    preference(motion) { document.documentElement.dataset.motion = motion; listeners.get('appearance')(); },
  };
}
function expectMotion(harness, running) {
  assert.equal(harness.section.dataset.motion, running ? 'running' : 'paused');
  assert.deepEqual(harness.timelines.map(({ paused }) => paused), running ? [false, false, false] : [true, true, true]);
}

test('all hobby timelines stay paused until visible and pause again offscreen', () => {
  const harness = setup();
  expectMotion(harness, false);
  harness.intersect(true);
  expectMotion(harness, true);
  harness.intersect(false);
  expectMotion(harness, false);
});

for (const [name, suspend, resume] of [
  ['overlay', (h) => h.overlay(true), (h) => h.overlay(false)],
  ['hidden document', (h) => h.hide(true), (h) => h.hide(false)],
  ['system reduced motion', (h) => h.reduce(true), (h) => h.reduce(false)],
  ['saved reduced motion', (h) => h.preference('reduced'), (h) => h.preference('full')],
]) {
  test(`${name} suspends visible timelines without overriding offscreen state`, () => {
    const harness = setup();
    harness.intersect(true);
    suspend(harness);
    expectMotion(harness, false);
    resume(harness);
    expectMotion(harness, true);
    suspend(harness);
    harness.intersect(false);
    resume(harness);
    expectMotion(harness, false);
  });
}

test('clearing one pause reason does not clear the others', () => {
  const harness = setup();
  harness.intersect(true);
  harness.overlay(true);
  harness.hide(true);
  harness.reduce(true);
  harness.overlay(false);
  expectMotion(harness, false);
  harness.hide(false);
  expectMotion(harness, false);
  harness.reduce(false);
  expectMotion(harness, true);
});
