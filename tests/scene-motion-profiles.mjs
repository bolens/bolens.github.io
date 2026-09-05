import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const root = resolve(import.meta.dirname, '..');
const motionSource = readFileSync(resolve(root, 'assets/404-motion.js'), 'utf8');
const html = readFileSync(resolve(root, '404.html'), 'utf8');
const css = readFileSync(resolve(root, 'assets/404.css'), 'utf8');
const scene = readFileSync(resolve(root, 'assets/404-scene.js'), 'utf8');
const times = ['day', 'night', 'morning', 'evening', 'twilight'];
const conditions = ['clear', 'cloudy', 'misty', 'overcast', 'rainy', 'wet', 'dry', 'snowy', 'drought', 'windy', 'thunderstorm'];

const setup = () => {
  let weatherSubscriber;
  let timeSubscriber;
  const properties = new Map();
  const document = { documentElement: { dataset: {}, style: { setProperty: (name, value) => properties.set(name, value) } } };
  const window = {
    portfolioWeather: {
      condition: 'clear',
      conditions,
      subscribe(subscriber) { weatherSubscriber = subscriber; return () => {}; },
    },
    portfolioSceneTime: {
      time: 'night',
      state: { time: 'night', cycle: 'fixed', darkness: 1, warmth: 0 },
      times,
      subscribe(subscriber) { timeSubscriber = subscriber; return () => {}; },
    },
  };
  const context = vm.createContext({ window, document });
  vm.runInContext(motionSource, context);
  return { context, document, properties, weatherSubscriber, timeSubscriber };
};

test('every time and weather pairing has a stable, distinct motion signature', () => {
  const { context } = setup();
  const api = context.window.portfolioSceneMotion;
  const profiles = times.flatMap((time) => conditions.map((condition) => api.resolve(time, condition)));
  assert.equal(profiles.length, 55);
  assert.equal(new Set(profiles.map(({ signature }) => signature)).size, 55);
  for (const profile of profiles) {
    assert.ok(Object.isFrozen(profile));
    assert.deepEqual(profile, api.resolve(profile.time, profile.condition));
    for (const key of ['tempo', 'sway', 'lift', 'glow', 'activity', 'play', 'water', 'smoke']) {
      assert.ok(Number.isFinite(profile[key]), `${profile.signature}.${key} is finite`);
      assert.ok(profile[key] >= 0 && profile[key] <= 2, `${profile.signature}.${key} stays subtle`);
    }
    assert.ok(Number.isFinite(profile.drift) && profile.drift >= 0 && profile.drift <= 8, `${profile.signature}.drift stays within the SVG scene scale`);
  }
});

test('motion profiles preserve the physical character of each condition', () => {
  const { context } = setup();
  const { resolve: profile } = context.window.portfolioSceneMotion;
  assert.ok(profile('day', 'windy').sway > profile('day', 'clear').sway);
  assert.ok(profile('night', 'windy').drift > profile('night', 'clear').drift);
  assert.ok(profile('evening', 'rainy').play < profile('evening', 'clear').play);
  assert.ok(profile('morning', 'wet').water > profile('morning', 'dry').water);
  assert.equal(profile('night', 'drought').lift, 0);
  assert.ok(profile('night', 'snowy').tempo > profile('night', 'rainy').tempo);
  assert.ok(profile('night', 'clear').glow > profile('day', 'clear').glow);
});

test('weather and time changes synchronously publish one shared motion profile', () => {
  const { context, document, properties, weatherSubscriber, timeSubscriber } = setup();
  weatherSubscriber({ condition: 'windy' });
  timeSubscriber({ time: 'twilight', cycle: 'fixed', darkness: .58, warmth: .42 });
  const profile = context.window.portfolioSceneMotion.profile;
  assert.equal(profile.signature, 'twilight-windy');
  assert.equal(document.documentElement.dataset.sceneMotion, 'twilight-windy');
  assert.equal(properties.get('--motion-tempo'), String(profile.tempo));
  assert.equal(properties.get('--motion-sway'), `${profile.sway}deg`);
  assert.equal(properties.get('--motion-drift'), `${profile.drift}px`);
  assert.equal(properties.get('--motion-play'), String(profile.play));
});

test('the shared profile controls SVG and canvas motion with reduced-motion intact', () => {
  const weatherIndex = html.indexOf('/assets/404-weather.js');
  const timeIndex = html.indexOf('/assets/404-time.js');
  const motionIndex = html.indexOf('/assets/404-motion.js');
  const sceneIndex = html.indexOf('/assets/404-scene.js');
  assert.ok(weatherIndex < timeIndex && timeIndex < motionIndex && motionIndex < sceneIndex);
  assert.match(css, /animation-duration:calc\([^;]+var\(--motion-tempo/);
  assert.match(css, /rotate:calc\(var\(--motion-sway/);
  assert.match(css, /translate:calc\(var\(--motion-drift/);
  assert.match(scene, /portfolioSceneMotion/);
  assert.match(scene, /motionProfile\.(tempo|drift|activity|play)/);
  assert.match(css, /prefers-reduced-motion: reduce[\s\S]+animation:none !important/);
});
