import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const root = resolve(import.meta.dirname, '..');
const themeSource = readFileSync(resolve(root, 'assets/theme-data.js'), 'utf8');
const weatherSource = readFileSync(resolve(root, 'assets/404-weather.js'), 'utf8');


const setup = () => {
  let palette = 'glacier';
  let appearanceSubscriber;
  const events = [];
  const window = {};
  const context = vm.createContext({
    window,
    document: { documentElement: { dataset: {} } },
    dispatchEvent: (event) => events.push(event),
    CustomEvent: class CustomEvent {
      constructor(type, init) { this.type = type; this.detail = init.detail; }
    },
  });
  vm.runInContext(themeSource, context);
  window.portfolioAppearance = {
    get palette() { return palette; },
    subscribe(subscriber) { appearanceSubscriber = subscriber; return () => {}; },
  };
  vm.runInContext(weatherSource, context);
  return {
    context,
    events,
    setPalette(next) { palette = next; appearanceSubscriber(); },
  };
};

test('optional environment validates, resets, and gates flying firefly habitat', () => {
  const {context}=setup(), api=context.window.portfolioWeather;
  assert.equal(api.fireflyEligibility,1);
  for(const input of [{temperatureC:11.9},{temperatureC:32.1},{season:'winter'},{fireflyHabitat:false}]) {
    const state=api.setEnvironment(input);
    assert.equal(state.fireflyEligibility,0);
    assert.equal(context.document.documentElement.dataset.sceneFireflyEligibility,'0');
    assert.ok(Object.isFrozen(state.environment));
  }
  for(const temperatureC of [12,20,32]) assert.equal(api.setEnvironment({temperatureC,season:'summer',fireflyHabitat:true}).fireflyEligibility,1);
  for(const input of [null,[],{temperatureC:NaN,season:'__proto__',fireflyHabitat:'false'},{temperatureC:'20'},{temperatureC:Infinity}]) {
    const state=api.setEnvironment(input);
    assert.deepEqual({...state.environment},{temperatureC:null,season:null,fireflyHabitat:null});
    assert.equal(state.fireflyEligibility,1);
  }
  api.setEnvironment({season:'winter'});
  api.setLocationCondition('clear');
  assert.equal(api.fireflyEligibility,0,'changing weather must not discard environment');
  api.setEnvironment(null);
  assert.equal(api.fireflyEligibility,1);
});

test('every named palette defines a valid fallback condition', () => {
  const { context } = setup();
  const { palettes, weatherModes } = context.window.portfolioThemeData;
  const configured = Object.fromEntries(Object.entries(palettes).map(([name, palette]) => [name, palette.weather]));

  assert.deepEqual({ ...configured }, {
    alpine: 'snowy',
    desert: 'drought',
    glacier: 'snowy',
    signal: 'clear',
    forest: 'wet',
    coast: 'rainy',
    meadow: 'overcast',
    volcanic: 'dry',
  });
  for (const condition of Object.values(configured)) assert.ok(weatherModes.includes(condition));
});

test('location weather overrides the theme fallback and can release control', () => {
  const { context, events, setPalette } = setup();
  const { document, window } = context;

  assert.equal(window.portfolioWeather.condition, 'snowy');
  assert.equal(window.portfolioWeather.source, 'theme');
  assert.equal(document.documentElement.dataset.weather, 'snowy');
  assert.equal(document.documentElement.dataset.weatherSource, 'theme');

  window.portfolioWeather.setLocationCondition('rainy');
  setPalette('desert');
  assert.equal(window.portfolioWeather.condition, 'rainy');
  assert.equal(window.portfolioWeather.source, 'location');

  window.portfolioWeather.useThemeFallback();
  assert.equal(window.portfolioWeather.condition, 'drought');
  assert.equal(window.portfolioWeather.source, 'theme');

  window.portfolioWeather.setLocationCondition('hail');
  assert.equal(window.portfolioWeather.condition, 'drought');
  assert.ok(events.every((event) => event.type === 'portfolio-weather-change'));
});

test('404 weather visibility is controlled only by the resolved condition', () => {
  const css = readFileSync(resolve(root, 'assets/404.css'), 'utf8');
  const html = readFileSync(resolve(root, '404.html'), 'utf8');
  const appearanceIndex = html.indexOf('/assets/appearance-controller.js');
  const weatherIndex = html.indexOf('/assets/404-weather.js');
  const sceneIndex = html.indexOf('/assets/404-scene.js');

  assert.ok(appearanceIndex < weatherIndex && weatherIndex < sceneIndex, 'weather must initialize after appearance and before scene effects');
  assert.doesNotMatch(css, /data-theme="day"\] \.weather-clouds \{ display:inline/);
  assert.match(css, /data-weather="cloudy"\] \.weather-clouds/);
  assert.match(css, /data-weather="misty"\] :is\(\.weather-clouds,\.weather-mist\)/);
  assert.match(css, /data-weather="overcast"\] :is\(\.weather-clouds,\.weather-overcast\)/);
  assert.match(css, /data-weather="rainy"\] :is\(\.weather-clouds,\.weather-rain-clouds,\.weather-rain\)/);
  assert.match(css, /data-weather="snowy"\] :is\(\.weather-clouds,\.weather-snow\)/);
  assert.match(css, /data-weather="drought"\] \.weather-drought/);
  assert.match(css, /data-weather="windy"\] \.weather-wind/);
});

for (const invalid of ['hail', '', null, undefined, '__proto__']) {
  test(`invalid location weather ${String(invalid)} releases the override`, () => {
    const { context, setPalette } = setup();
    const api = context.window.portfolioWeather;
    api.setLocationCondition('rainy');
    setPalette('desert');
    const state = api.setLocationCondition(invalid);
    assert.equal(state.condition, 'drought');
    assert.equal(state.source, 'theme');
    assert.equal(context.document.documentElement.dataset.weather, 'drought');
  });
}

test('unknown palettes use clear weather without discarding a valid location override', () => {
  const { context, setPalette } = setup();
  const api = context.window.portfolioWeather;
  setPalette('missing-palette');
  assert.equal(api.condition, 'clear');
  api.setLocationCondition('snowy');
  setPalette('__proto__');
  assert.equal(api.condition, 'snowy');
  assert.equal(api.useThemeFallback().condition, 'clear');
});

test('weather subscribers see committed DOM state and stop receiving updates after unsubscribe', () => {
  const { context, events, setPalette } = setup();
  const api = context.window.portfolioWeather;
  const received = [];
  const unsubscribe = api.subscribe((state) => {
    assert.equal(context.document.documentElement.dataset.weather, state.condition);
    assert.equal(context.document.documentElement.dataset.weatherSource, state.source);
    received.push(state);
  });
  const rainy = api.setLocationCondition('rainy');
  setPalette('desert');
  assert.equal(received[0], rainy);
  assert.ok(Object.isFrozen(rainy));
  assert.equal(rainy.palette, 'glacier');
  assert.equal(received[1].palette, 'desert');
  assert.equal(events.at(-1).detail, received[1]);
  unsubscribe();
  unsubscribe();
  api.useThemeFallback();
  assert.equal(received.length, 2);
  assert.equal(api.condition, 'drought');
});
