import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const root = resolve(import.meta.dirname, '..');
const themeSource = readFileSync(resolve(root, 'assets/theme-data.js'), 'utf8');
const timeSource = readFileSync(resolve(root, 'assets/404-time.js'), 'utf8');
const css = readFileSync(resolve(root, 'assets/404.css'), 'utf8');
const html = readFileSync(resolve(root, '404.html'), 'utf8');
const scene = readFileSync(resolve(root, 'assets/404-scene.js'), 'utf8');

const setup = (resolvedTheme = 'night', selectedAppearance = resolvedTheme) => {
  let currentTheme = resolvedTheme;
  let appearanceMode = selectedAppearance;
  let appearanceSubscriber;
  const events = [];
  const properties = new Map();
  const window = { setInterval() {} };
  const document = { hidden: false, addEventListener() {}, documentElement: { dataset: {}, style: { setProperty: (name, value) => properties.set(name, value) } } };
  const context = vm.createContext({
    window,
    document,
    dispatchEvent: (event) => events.push(event),
    CustomEvent: class CustomEvent { constructor(type, init) { this.type = type; this.detail = init.detail; } },
  });
  vm.runInContext(themeSource, context);
  window.portfolioAppearance = {
    get theme() { return appearanceMode; },
    get resolvedTheme() { return currentTheme; },
    subscribe(subscriber) { appearanceSubscriber = subscriber; return () => {}; },
  };
  vm.runInContext(timeSource, context);
  return { context, document, events, properties, setAppearance(theme, resolved = theme) { appearanceMode = theme; currentTheme = resolved; appearanceSubscriber(); } };
};

test('scene time follows appearance until an explicit time takes control', () => {
  const { context, document, events, setAppearance } = setup('night');
  const { portfolioSceneTime } = context.window;
  assert.deepEqual([...portfolioSceneTime.times], ['day', 'night', 'morning', 'evening', 'twilight']);
  assert.equal(portfolioSceneTime.time, 'night');
  assert.equal(portfolioSceneTime.source, 'appearance');
  portfolioSceneTime.setTime('morning');
  setAppearance('day');
  assert.equal(portfolioSceneTime.time, 'morning');
  assert.equal(document.documentElement.dataset.sceneTime, 'morning');
  portfolioSceneTime.setTime('midday');
  assert.equal(portfolioSceneTime.time, 'day');
  assert.equal(portfolioSceneTime.source, 'appearance');
  assert.ok(events.every((event) => event.type === 'portfolio-scene-time-change'));
});

test('automatic appearance follows local clock while explicit appearance stays fixed', () => {
  const { context, document, properties, setAppearance } = setup('day', 'auto');
  const { portfolioSceneTime } = context.window;
  const morning = portfolioSceneTime.refresh(new Date(2026, 8, 3, 6, 0));
  const noon = portfolioSceneTime.refresh(new Date(2026, 8, 3, 12, 0));
  const evening = portfolioSceneTime.refresh(new Date(2026, 8, 3, 18, 30));
  const twilight = portfolioSceneTime.refresh(new Date(2026, 8, 3, 21, 0));
  const night = portfolioSceneTime.refresh(new Date(2026, 8, 3, 23, 30));
  assert.deepEqual([morning.time, noon.time, evening.time, twilight.time, night.time], ['morning', 'day', 'evening', 'twilight', 'night']);
  assert.ok(morning.x < noon.x && noon.x < evening.x);
  assert.ok(noon.y < morning.y && noon.y < evening.y);
  assert.ok(morning.darkness < twilight.darkness && twilight.darkness < night.darkness);
  assert.equal(document.documentElement.dataset.sceneCycle, 'dynamic');
  assert.equal(properties.get('--scene-orb-x'), `${night.x.toFixed(2)}px`);
  assert.equal(properties.get('--scene-orb-center-x'), `${(1002 + night.x).toFixed(2)}px`);
  const nightShadow = properties.get('--scene-cast-shadow');
  portfolioSceneTime.refresh(new Date(2026, 8, 3, 6, 0));
  const morningShadow = properties.get('--scene-cast-shadow');
  portfolioSceneTime.refresh(new Date(2026, 8, 3, 18, 30));
  const eveningShadow = properties.get('--scene-cast-shadow');
  assert.notEqual(morningShadow, eveningShadow);
  assert.notEqual(eveningShadow, nightShadow);
  setAppearance('night');
  const fixedNight = portfolioSceneTime.refresh(new Date(2026, 8, 3, 12, 0));
  assert.equal(fixedNight.time, 'night');
  assert.equal(fixedNight.cycle, 'fixed');
  assert.equal(fixedNight.x, 0);
  setAppearance('day');
  const fixedDay = portfolioSceneTime.refresh(new Date(2026, 8, 3, 23, 0));
  assert.equal(fixedDay.time, 'day');
  assert.equal(fixedDay.cycle, 'fixed');
});

test('morning evening and twilight restyle every shared scene system', () => {
  const timeIndex = html.indexOf('/assets/404-time.js');
  assert.ok(html.indexOf('/assets/404-weather.js') < timeIndex && timeIndex < html.indexOf('/assets/404-scene.js'));
  for (const time of ['morning', 'evening', 'twilight']) {
    assert.match(css, new RegExp(`data-scene-time="${time}"\\] \\.lost-page`));
    assert.match(css, new RegExp(`data-scene-time="${time}"\\] \\.terrain-asset`));
    assert.match(html, new RegExp(`caption-${time}`));
    assert.match(scene, new RegExp(`${time}: Object\\.freeze\\(\\{ stars: [^}]+fireflies: [^}]+embers: [^}]+\\}\\)`));
  }
  assert.match(css, /data-scene-time="morning"\] \.scene-orb/);
  assert.match(css, /data-scene-time="evening"\] \.scene-orb/);
  assert.match(css, /data-scene-time="twilight"\] \.scene-orb/);
  assert.match(css, /data-scene-time="twilight"\][^\n]+\.background-ufo \{ display:inline; \}/);
  assert.match(css, /data-scene-cycle="dynamic"\][^\n]+\.weather-cloud/);
  assert.match(css, /data-scene-cycle="dynamic"\][^\n]+\.ufo-lights/);
  assert.match(css, /translate:var\(--scene-orb-x,0\) var\(--scene-orb-y,0\)/);
  assert.match(css, /--asset-time-shadow:var\(--scene-cast-shadow/);
  assert.match(timeSource, /--scene-cast-shadow/);
  assert.match(html, /class="solar-ray-field"[^>]+data-region="position-reactive-sunbeams"/);
  assert.match(css, /\.solar-ray-field \{[^}]+translate:var\(--scene-orb-x,0\) var\(--scene-orb-y,0\)[^}]+transform-origin:var\(--scene-orb-center-x,1002px\) var\(--scene-orb-center-y,118px\)/);
});
