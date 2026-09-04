import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../assets/appearance-controller.js', import.meta.url), 'utf8');
function setup({ saved = {}, query = '', dark = false, denyRead = false, denyWrite = false, metadata = true } = {}) {
  const storage = new Map(Object.entries(saved));
  const writes = [];
  const colors = {};
  const listeners = new Map();
  const media = { matches: dark, addEventListener: (_, callback) => listeners.set('system', callback) };
  const document = { documentElement: { dataset: {} }, querySelector(selector) {
    if (!metadata) return null;
    const key = selector.includes('light') ? 'light' : selector.includes('dark') ? 'dark' : 'default';
    return { setAttribute: (_, value) => { colors[key] = value; } };
  } };
  const window = { portfolioThemeData: {
    defaultPalette: 'glacier', modes: ['auto', 'day', 'night'],
    palettes: {
      glacier: { label: 'Glacier', light: '#ffffff', dark: '#111111' },
      coast: { label: 'Coast', light: '#eeeeee', dark: '#222222' },
    },
  } };
  vm.runInNewContext(source, {
    window, document, URLSearchParams, location: { search: query }, matchMedia: () => media,
    localStorage: {
      getItem(key) { if (denyRead) throw new Error('read denied'); return storage.get(key) ?? null; },
      setItem(key, value) { if (denyWrite) throw new Error('write denied'); writes.push([key, value]); storage.set(key, value); },
    },
    addEventListener: (type, callback) => listeners.set(type, callback),
  }, { filename: 'assets/appearance-controller.js' });
  return { api: window.portfolioAppearance, dataset: document.documentElement.dataset, colors, writes, storage,
    system(matches) { media.matches = matches; listeners.get('system')(); },
    external(key, newValue) { listeners.get('storage')({ key, newValue }); },
  };
}
const state = (api) => ({ palette: api.palette, theme: api.theme, motion: api.motion, resolvedTheme: api.resolvedTheme });

test('startup restores all preferences without rewriting storage', () => {
  const h = setup({ saved: { 'portfolio-palette': 'coast', 'portfolio-theme': 'night', 'portfolio-motion': 'reduced' } });
  assert.deepEqual(state(h.api), { palette: 'coast', theme: 'night', motion: 'reduced', resolvedTheme: 'night' });
  assert.deepEqual(h.dataset, { palette: 'coast', theme: 'night', motion: 'reduced' });
  assert.deepEqual(h.colors, { light: '#222222', dark: '#222222', default: '#222222' });
  assert.deepEqual(h.writes, []);
});
for (const invalid of ['', '__proto__', 'constructor', 'missing']) {
  test(`invalid saved preference ${JSON.stringify(invalid)} falls back safely`, () => {
    const h = setup({ saved: { 'portfolio-palette': invalid, 'portfolio-theme': invalid, 'portfolio-motion': invalid }, dark: true });
    assert.deepEqual(state(h.api), { palette: 'glacier', theme: 'auto', motion: 'auto', resolvedTheme: 'night' });
    assert.deepEqual(h.dataset, { palette: 'glacier' });
  });
}
for (const denyRead of [false, true]) {
  test(`URL preview wins over saved palette with storage denial=${denyRead}`, () => {
    const h = setup({ saved: { 'portfolio-palette': 'glacier' }, query: '?palette=coast', denyRead });
    assert.equal(h.api.palette, 'coast');
    h.external('portfolio-palette', 'glacier');
    assert.equal(h.api.palette, 'coast');
    h.external('portfolio-theme', 'night');
    h.external('portfolio-motion', 'reduced');
    assert.equal(h.api.theme, 'night');
    assert.equal(h.api.motion, 'reduced');
    assert.deepEqual(h.writes, []);
  });
}
for (const [method, field, value, key] of [
  ['setPalette', 'palette', 'coast', 'portfolio-palette'],
  ['setTheme', 'theme', 'night', 'portfolio-theme'],
  ['setMotion', 'motion', 'reduced', 'portfolio-motion'],
]) {
  test(`${method} persists only its preference and publishes committed state`, () => {
    const h = setup();
    const observed = [];
    h.api.subscribe((snapshot) => {
      assert.deepEqual({ ...snapshot }, state(h.api));
      assert.equal(h.dataset[field], value);
      assert.equal(h.storage.get(key), value);
      observed.push(snapshot);
    });
    const result = h.api[method](value);
    assert.equal(result[field], value);
    assert.equal(observed.length, 1);
    assert.ok(Object.isFrozen(observed[0]));
    assert.deepEqual(h.writes, [[key, value]]);
  });
  test(`${method} commits and notifies even when storage writes fail`, () => {
    const h = setup({ denyWrite: true });
    const states = [];
    h.api.subscribe((snapshot) => states.push(snapshot));
    h.api[method](value);
    assert.equal(h.api[field], value);
    assert.equal(states.length, 1);
    assert.equal(states[0][field], value);
  });
}

test('system changes update automatic colors and notifications without changing explicit preferences', () => {
  const h = setup();
  const states = [];
  h.api.subscribe((snapshot) => states.push(snapshot.resolvedTheme));
  h.system(true);
  assert.deepEqual(h.colors, { light: '#ffffff', dark: '#111111', default: '#111111' });
  assert.deepEqual(h.dataset, { palette: 'glacier' });
  h.api.setTheme('day');
  h.system(false);
  h.system(true);
  assert.deepEqual(states, ['night', 'day']);
  assert.deepEqual(h.colors, { light: '#ffffff', dark: '#ffffff', default: '#ffffff' });
  h.api.setTheme('auto');
  assert.equal(h.api.resolvedTheme, 'night');
  assert.equal('theme' in h.dataset, false);
});

test('palette cycling wraps and theme toggling starts from the resolved system mode', () => {
  const h = setup({ dark: true });
  assert.equal(h.api.cyclePalette().palette, 'coast');
  assert.equal(h.api.cyclePalette().palette, 'glacier');
  assert.equal(h.api.toggleTheme().theme, 'day');
  assert.equal(h.api.toggleTheme().theme, 'night');
  assert.equal(h.api.toggleMotion().motion, 'reduced');
  assert.equal(h.api.toggleMotion().motion, 'auto');
  assert.equal('motion' in h.dataset, false);
});

test('invalid setters normalize to defaults and reset publishes one complete snapshot', () => {
  const h = setup();
  h.api.setPalette('coast'); h.api.setTheme('night'); h.api.setMotion('reduced');
  assert.equal(h.api.setPalette('__proto__').palette, 'glacier');
  assert.equal(h.api.setTheme('invalid').theme, 'auto');
  assert.equal(h.api.setMotion('invalid').motion, 'auto');
  h.api.setPalette('coast'); h.api.setTheme('night'); h.api.setMotion('reduced');
  const observed = [];
  const unsubscribe = h.api.subscribe((snapshot) => observed.push({ ...snapshot }));
  h.api.reset();
  assert.deepEqual(observed, [{ palette: 'glacier', theme: 'auto', motion: 'auto', resolvedTheme: 'day' }]);
  assert.deepEqual(h.dataset, { palette: 'glacier' });
  unsubscribe(); unsubscribe(); h.api.setTheme('night');
  assert.equal(observed.length, 1);
});

test('cross-tab changes normalize removed values, ignore unrelated keys, and do not echo writes', () => {
  const h = setup();
  const observed = [];
  h.api.subscribe((snapshot) => observed.push(snapshot));
  h.external('unrelated', 'night');
  assert.equal(observed.length, 0);
  h.external('portfolio-palette', 'coast');
  h.external('portfolio-theme', 'night');
  h.external('portfolio-motion', 'reduced');
  assert.deepEqual(state(h.api), { palette: 'coast', theme: 'night', motion: 'reduced', resolvedTheme: 'night' });
  for (const key of ['portfolio-palette', 'portfolio-theme', 'portfolio-motion']) h.external(key, null);
  assert.deepEqual(state(h.api), { palette: 'glacier', theme: 'auto', motion: 'auto', resolvedTheme: 'day' });
  assert.equal(observed.length, 6);
  assert.deepEqual(h.writes, []);
});

test('missing theme-color metadata does not prevent preference changes', () => {
  const h = setup({ metadata: false });
  assert.equal(h.api.setTheme('night').resolvedTheme, 'night');
  assert.equal(h.api.setPalette('coast').palette, 'coast');
  assert.deepEqual(h.colors, {});
});
