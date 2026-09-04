import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../assets/ui-overlay.js', import.meta.url), 'utf8');
function setup() {
  const window = {};
  const classes = new Set();
  const events = [];
  vm.runInNewContext(source, {
    window,
    document: { documentElement: { classList: { toggle(name, active) { if (active) classes.add(name); else classes.delete(name); } } } },
    CustomEvent: class { constructor(type, { detail }) { this.type = type; this.detail = detail; } },
    dispatchEvent(event) { events.push({ type: event.type, active: event.detail.active, classActive: classes.has('ui-overlay-open') }); },
  }, { filename: 'assets/ui-overlay.js' });
  return { api: window.portfolioOverlay, events, classes };
}

test('overlapping overlays emit only aggregate state transitions after the class is updated', () => {
  const h = setup();
  assert.equal(h.api.active, false);
  h.api.set('commands', true); h.api.set('appearance', true); h.api.set('commands', false);
  assert.equal(h.api.active, true);
  h.api.set('appearance', false);
  assert.deepEqual(h.events, [
    { type: 'ui-overlay-change', active: true, classActive: true },
    { type: 'ui-overlay-change', active: false, classActive: false },
  ]);
  assert.equal(h.api.active, false);
});

test('duplicate opens and unknown closes neither accumulate sources nor emit extra events', () => {
  const h = setup();
  h.api.set('missing', false);
  h.api.set('commands', true); h.api.set('commands', true);
  h.api.set('missing', false); h.api.set('commands', false); h.api.set('commands', false);
  assert.deepEqual(h.events.map(({ active }) => active), [true, false]);
  assert.equal(h.classes.size, 0);
});
