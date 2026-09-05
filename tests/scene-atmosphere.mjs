import assert from 'node:assert/strict';
import test from 'node:test';
import { createScene } from './lib/scene-harness.mjs';

const alpha = (color) => Number(color.slice(color.lastIndexOf(',') + 1, -1));
const particles = (scene, color) => scene.paints.filter((paint) => typeof paint.fill === 'string' && paint.fill.startsWith(color));
const brightness = (scene, color) => particles(scene, color).reduce((sum, paint) => sum + alpha(paint.fill), 0);
const stars = 'rgba(218,236,232,';
const embers = 'rgba(255,196,91,';
const fog = (scene) => scene.paints.flatMap((paint) => paint.fill?.stops ?? []).filter(({ color }) => color.startsWith('rgba(184,207,199,')).reduce((sum, { color }) => sum + alpha(color), 0);
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} != ${expected}`);

for (const [condition, starRatio, fogRatio, emberRatio] of [
  ['clear', 1, 1, 1], ['cloudy', .25, 1.25, .9], ['misty', .18, 1.8, .7], ['overcast', .1, 1.45, .72],
  ['rainy', .08, 1.4, .18], ['wet', .7, 1.2, .85], ['dry', .9, .45, 1],
  ['snowy', .35, 1.55, .25], ['drought', .7, .08, 0], ['windy', .82, .48, .72],
]) {
  test(`${condition} changes rendered stars, fog, and embers`, () => {
    const scene = createScene();
    const initial = { stars: brightness(scene, stars), fog: fog(scene), embers: brightness(scene, embers) };
    assert.ok(Object.values(initial).every((value) => value > 0), 'baseline must contain visible effects');
    scene.weather(condition);
    assert.equal(scene.figure.dataset.atmosphereCondition, condition);
    near(brightness(scene, stars) / initial.stars, starRatio);
    near(fog(scene) / initial.fog, fogRatio);
    near(brightness(scene, embers) / initial.embers, emberRatio);
  });
}

for (const [time, expected] of [['day', 0], ['morning', .08], ['evening', .18], ['twilight', .58], ['night', 1]]) {
  test(`${time} changes star brightness at a fixed animation phase`, () => {
    const scene = createScene();
    const night = brightness(scene, stars);
    scene.time({ time, cycle: 'fixed' });
    near(brightness(scene, stars) / night, expected);
    assert.equal(scene.figure.dataset.atmosphereTime, time);
  });
}

test('dynamic time follows bounded darkness and combines with weather', () => {
  const scene = createScene();
  const night = brightness(scene, stars);
  scene.weather('cloudy');
  for (const [darkness, expected] of [[-.5, 0], [0, 0], [.5, .125], [1, .25], [2, .25]]) {
    scene.time({ time: 'evening', cycle: 'dynamic', darkness });
    near(brightness(scene, stars) / night, expected);
    assert.equal(scene.figure.dataset.atmosphereCycle, 'dynamic');
  }
});

for (const restrained of [false, true]) {
  test(`rendered embers remain within the fire envelope with restrained=${restrained}`, () => {
    const scene = createScene({ restrained });
    for (const milliseconds of [0, 1000, 2500, 5000, 7500, 10000]) {
      scene.frame(milliseconds);
      const sparks = particles(scene, embers);
      assert.ok(sparks.length >= 1 && sparks.length <= (restrained ? 4 : 7));
      for (const spark of sparks) {
        assert.ok(spark.x >= 588.5 && spark.x <= 631.5, `ember escaped horizontally: ${spark.x}`);
        assert.ok(spark.y >= 624 && spark.y <= 662, `ember escaped vertically: ${spark.y}`);
        assert.ok(spark.radius >= .6 && spark.radius <= 1.15);
        assert.ok(alpha(spark.fill) >= 0 && alpha(spark.fill) <= .36);
      }
    }
  });
}

test('cold fire emits no canvas sparks or heat and stops marshmallow exposure', () => {
  const scene = createScene();
  scene.time({time:'day', cycle:'fixed', fireActive:false});
  scene.advance(3000);
  scene.frame(4000);
  assert.equal(brightness(scene, embers), 0);
  const heat = scene.paints.flatMap(paint => paint.fill?.stops ?? []).filter(stop => stop.color.startsWith('rgba(255,170,70,'));
  assert.equal(heat.length, 0);
  assert.equal(scene.figure.dataset.marshmallowCookLevel, '0.000');
  scene.time({time:'morning', cycle:'fixed', fireActive:true});
  scene.advance(3000);
  assert.ok(Number(scene.figure.dataset.marshmallowCookLevel)>0);
});
