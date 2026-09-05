import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../assets/hobby-motion.js', import.meta.url), 'utf8');
function setup({ count = 1 } = {}) {
  const listeners = new Map();
  const media = { matches: false, addEventListener: (_, callback) => listeners.set('media', callback) };
  const sceneTimelines = Array.from({ length: count }, () => Array.from({ length: 3 }, () => ({
    paused: false, calls: [],
    pauseAnimations() { this.paused = true; this.calls.push('pause'); },
    unpauseAnimations() { this.paused = false; this.calls.push('play'); },
  })));
  const sections = sceneTimelines.map(timelines => ({ dataset: {}, querySelectorAll: () => timelines }));
  const observed = [];
  const section = sections[0];
  const document = {
    hidden: false,
    documentElement: { dataset: {}, classList: { contains: () => false } },
    querySelectorAll: () => sections,
    querySelector: () => null,
    addEventListener: (type, callback) => listeners.set(type, callback),
  };
  let intersect;
  vm.runInNewContext(source, {
    document, matchMedia: () => media,
    window: { portfolioAppearance: { subscribe: (callback) => listeners.set('appearance', callback) } },
    addEventListener: (type, callback) => listeners.set(type, callback),
    IntersectionObserver: class { constructor(callback) { intersect = callback; } observe(element) { observed.push(element); } },
  });
  return {
    observed, listeners, section, sections, timelines: sceneTimelines[0], sceneTimelines,
    intersect: (isIntersecting) => intersect([{ target: section, isIntersecting }]),
    entries: (entries) => intersect(entries.map(([index, isIntersecting]) => ({ target: sections[index], isIntersecting }))),
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


test('batched observer entries pause and resume each illustration independently', () => {
  const h = setup({ count: 3 });
  h.entries([[0, true], [1, false], [2, true]]);
  assert.deepEqual(h.sections.map(s => s.dataset.motion), ['running', 'paused', 'running']);
  assert.deepEqual(h.sceneTimelines.map(t => t.every(s => s.paused)), [false, true, false]);
  h.entries([[0, false], [1, true]]);
  assert.deepEqual(h.sections.map(s => s.dataset.motion), ['paused', 'running', 'running']);
  h.overlay(true);
  assert.ok(h.sceneTimelines.flat().every(s => s.paused));
  h.entries([[2, false]]);
  h.overlay(false);
  assert.deepEqual(h.sections.map(s => s.dataset.motion), ['paused', 'running', 'paused']);
});

test('redundant notifications do not restart SVG timelines', () => {
  const h = setup();
  h.intersect(true); h.intersect(true); h.preference('auto'); h.hide(false); h.overlay(false);
  assert.deepEqual(h.timelines[0].calls, ['pause', 'play']);
  h.intersect(false); h.intersect(false); h.reduce(true);
  assert.deepEqual(h.timelines[0].calls, ['pause', 'play', 'pause']);
});

test('pages without illustrations register no observers or listeners', () => {
  const h = setup({ count: 0 });
  assert.deepEqual(h.observed, []);
  assert.equal(h.listeners.size, 0);
});
