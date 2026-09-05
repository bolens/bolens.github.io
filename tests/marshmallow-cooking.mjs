import assert from 'node:assert/strict';
import test from 'node:test';
import { createScene } from './lib/scene-harness.mjs';

const levels = (scene) => Object.fromEntries(['cook', 'mark', 'blister', 'char', 'glint'].map((name) =>
  [name, Number(scene.properties.get(`--marshmallow-${name}-level`))]));

test('cooking progresses from warming to blistering to charring and caps its exposure', () => {
  const scene = createScene();
  scene.advance(999);
  assert.equal(scene.figure.dataset.marshmallowCookLevel, undefined);
  scene.advance(1);
  assert.equal(scene.figure.dataset.marshmallowCookLevel, '0.006');
  scene.advance(89_000);
  assert.deepEqual(levels(scene), { cook: .47, mark: .55, blister: .392, char: 0, glint: .47 });
  scene.advance(90_000);
  assert.deepEqual(levels(scene), { cook: .82, mark: .9, blister: 1.092, char: .684, glint: .22 });
  scene.advance(600_000);
  assert.equal(scene.figure.dataset.marshmallowCookLevel, '1.000');
  assert.deepEqual(levels(scene), { cook: .82, mark: .9, blister: 1.092, char: .684, glint: .22 });
});

for (const [condition, expected] of Object.entries({ clear: '.500', cloudy: '.450', misty: '.400', overcast: '.400', rainy: '.225', wet: '.475', dry: '.540', snowy: '.325', drought: '.000', windy: '.530' })) {
  test(`${condition} supplies the expected heat over 90 seconds`, () => {
    const scene = createScene({ condition });
    scene.advance(90_000);
    assert.equal(scene.figure.dataset.marshmallowCookLevel, `0${expected}`);
  });
}

test('weather changes affect subsequent heat without discarding earlier cooking', () => {
  const scene = createScene();
  scene.advance(90_000);
  scene.weather('drought');
  scene.advance(90_000);
  assert.equal(scene.figure.dataset.marshmallowCookLevel, '0.500');
  scene.weather('rainy');
  scene.advance(40_000);
  assert.equal(scene.figure.dataset.marshmallowCookLevel, '0.600');
});

for (const [name, pause, resume] of [
  ['hidden page', (scene) => scene.hide(true), (scene) => scene.hide(false)],
  ['overlay', (scene) => scene.overlay(true), (scene) => scene.overlay(false)],
]) {
  test(`${name} suspends cooking and resumes without catching up hidden time`, () => {
    const scene = createScene();
    scene.advance(90_000);
    pause(scene);
    scene.advance(600_000);
    assert.equal(scene.figure.dataset.marshmallowCookLevel, '0.500');
    resume(scene);
    scene.advance(18_000);
    assert.equal(scene.figure.dataset.marshmallowCookLevel, '0.600');
  });
}

test('page exit stops the cooking timer', () => {
  const scene = createScene();
  scene.advance(90_000);
  scene.window.emit('pagehide');
  scene.advance(600_000);
  assert.equal(scene.figure.dataset.marshmallowCookLevel, '0.500');
  assert.equal(scene.timers.size, 0);
});
