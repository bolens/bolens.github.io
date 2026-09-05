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
  let now = new Date(2026, 8, 3, 12);
  const timers = [];
  const listeners = new Map();
  const window = { setInterval(callback, delay) { timers.push({ callback, delay }); } };
  const document = { hidden: false, addEventListener(type, callback) { listeners.set(type, callback); }, documentElement: { dataset: {}, style: { setProperty: (name, value) => properties.set(name, value) } } };
  const context = vm.createContext({
    window,
    document,
    Date: class extends Date { constructor(...args) { super(...(args.length ? args : [now])); } },
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
  return { context, document, events, properties, timers, listeners, setClock(date) { now = date; }, setAppearance(theme, resolved = theme) { appearanceMode = theme; currentTheme = resolved; appearanceSubscriber(); } };
};

test('moon phases have bounded overrides and stable fixed-time defaults', () => {
  const {context,properties}=setup();
  const api=context.window.portfolioSceneTime;
  for(const [phase,light] of [[0,0],[.25,.5],[.5,1],[.75,.5],[1,0]]) {
    const state=api.setMoonPhase(phase);
    assert.ok(Math.abs(state.moonIllumination-light)<1e-10);
    assert.equal(state.moonPhase,phase===1?0:phase);
    assert.equal(state.moonSource,'override');
    assert.match(properties.get('--scene-moon-shadow-path'),/^path\("M/);
    if(light===0) assert.equal(properties.get('--surface-light-strength'),'0.000');
  }
  for(const value of [null,undefined,NaN,Infinity,-.1,1.1,'0.5']) {
    assert.equal(api.setMoonPhase(value).moonPhase,.5);
    assert.equal(api.state.moonSource,'fixed');
  }
  api.setMoonPhase(0);api.setTime('day');
  assert.equal(properties.get('--surface-light-strength'),'0.340','new moon must not dim sunlight');
});

test('automatic moon uses an approximate UTC lunar cycle without adding a timer', () => {
  const {context,timers}=setup('night','auto'), api=context.window.portfolioSceneTime;
  const anchor=Date.UTC(2000,0,6,18,15), period=29.530588*86400000;
  for(const [part,light] of [[0,0],[.25,.5],[.5,1],[.75,.5],[1,0],[-.25,.5]]) {
    const state=api.refresh(new Date(anchor+part*period));
    assert.ok(Math.abs(state.moonIllumination-light)<1e-7);
    assert.equal(state.moonSource,'clock');
    assert.ok(state.moonPhase>=0&&state.moonPhase<1);
  }
  assert.equal(timers.length,1);
});

test('automatic fire uses local meal windows with exact inclusive/exclusive boundaries', () => {
  const { context, document } = setup('day', 'auto');
  const api = context.window.portfolioSceneTime;
  for (const [hour, minute, burning] of [[5,0,false],[6,59,false],[7,0,true],[8,59,true],[9,0,false],[11,59,false],[12,0,true],[13,59,true],[14,0,false],[17,59,false],[18,0,true],[19,59,true],[20,0,true],[23,0,true],[0,0,true]]) {
    const state = api.refresh(new Date(2026,8,3,hour,minute));
    assert.equal(state.fireActive, burning, `${hour}:${minute}`);
    assert.equal(document.documentElement.dataset.sceneFire, burning ? 'burning' : 'cold');
  }
  assert.equal(Object.isFrozen(api.mealWindows), true);
  assert.ok(api.mealWindows.every(Object.isFrozen));
});

test('fixed fire states do not depend on wall clock or opposite appearance', () => {
  const { context, setAppearance } = setup('day');
  const api = context.window.portfolioSceneTime;
  for (const time of ['day','morning','evening','twilight','night']) {
    api.setTime(time);
    for (const hour of [0,8,12,15,19,23]) {
      setAppearance(hour % 2 ? 'day' : 'night');
      assert.equal(api.refresh(new Date(2026,8,3,hour)).fireActive, time !== 'day');
    }
  }
  setAppearance('day');
  assert.equal(api.useAppearanceFallback().fireActive, false);
});

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
  assert.match(css, /data-scene-time="morning"\] \.scene-time-wash \{ fill:#e9a85f;opacity:\.14;mix-blend-mode:soft-light; \}/);
  assert.match(css, /data-scene-time="morning"\] \.theme-light-wash \{ opacity:\.1; \}/);
  assert.match(css, /data-scene-time="morning"\] \.terrain-asset \{ --asset-time-brightness:1;--asset-time-saturation:1\.04;/);
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

for (const [hour, minute, second, expected] of [
  [4, 59, 59, 'night'], [5, 0, 0, 'morning'],
  [7, 59, 59, 'morning'], [8, 0, 0, 'day'],
  [16, 59, 59, 'day'], [17, 0, 0, 'evening'],
  [19, 59, 59, 'evening'], [20, 0, 0, 'twilight'],
  [21, 59, 59, 'twilight'], [22, 0, 0, 'night'],
  [23, 59, 59, 'night'], [0, 0, 0, 'night'],
]) {
  test(`automatic scene at ${hour}:${minute}:${second} resolves to ${expected}`, () => {
    const { context, document } = setup('day', 'auto');
    const state = context.window.portfolioSceneTime.refresh(new Date(2026, 8, 3, hour, minute, second));
    assert.equal(state.time, expected);
    assert.equal(state.source, 'clock');
    assert.equal(state.cycle, 'dynamic');
    assert.equal(document.documentElement.dataset.sceneTime, expected);
    for (const value of [state.progress, state.darkness, state.warmth]) assert.ok(value >= 0 && value <= 1);
    assert.ok(Number.isFinite(state.x) && Number.isFinite(state.y));
  });
}

test('minute refresh follows the clock and respects explicit scene and appearance choices', () => {
  const harness = setup('day', 'auto');
  const api = harness.context.window.portfolioSceneTime;
  assert.equal(harness.timers.length, 1);
  assert.equal(harness.timers[0].delay, 60_000);
  harness.setClock(new Date(2026, 8, 3, 22));
  harness.timers[0].callback();
  assert.equal(api.time, 'night');
  api.setTime('morning');
  harness.timers[0].callback();
  assert.equal(api.time, 'morning');
  assert.equal(api.useAppearanceFallback().time, 'night');
  harness.setAppearance('day');
  harness.timers[0].callback();
  assert.equal(api.time, 'day');
  assert.equal(api.cycle, 'fixed');
});

test('returning to a visible page refreshes automatic time without overriding a selected scene', () => {
  const harness = setup('day', 'auto');
  const api = harness.context.window.portfolioSceneTime;
  harness.setClock(new Date(2026, 8, 3, 21));
  harness.document.hidden = true;
  harness.listeners.get('visibilitychange')();
  assert.equal(api.time, 'day');
  harness.document.hidden = false;
  harness.listeners.get('visibilitychange')();
  assert.equal(api.time, 'twilight');
  api.setTime('morning');
  harness.setClock(new Date(2026, 8, 3, 23));
  harness.listeners.get('visibilitychange')();
  assert.equal(api.time, 'morning');
});

test('scene subscribers receive immutable snapshots and can unsubscribe independently', () => {
  const { context, events } = setup();
  const api = context.window.portfolioSceneTime;
  const first = [];
  const second = [];
  const unsubscribe = api.subscribe((state) => first.push(state));
  api.subscribe((state) => second.push(state));
  const morning = api.setTime('morning');
  assert.equal(first[0], morning);
  assert.equal(events.at(-1).detail, morning);
  assert.ok(Object.isFrozen(morning));
  unsubscribe();
  unsubscribe();
  api.setTime('evening');
  assert.deepEqual(first.map(({ time }) => time), ['morning']);
  assert.deepEqual(second.map(({ time }) => time), ['morning', 'evening']);
  assert.equal(morning.time, 'morning');
});
