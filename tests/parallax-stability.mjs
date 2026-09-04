import assert from 'node:assert/strict';
import test from 'node:test';
import { createScene } from './lib/scene-harness.mjs';

const offsets = (scene) => ['back', 'far', 'mid', 'near'].flatMap((depth) =>
  ['x', 'y'].map((axis) => Number.parseFloat(scene.properties.get(`--parallax-${depth}-${axis}`))));
const centered = [0, 0, 0, 0, 0, 0, 0, 0];

test('pointer movement applies rounded depth offsets on the next frame', () => {
  const scene = createScene();
  scene.pointer();
  assert.equal(scene.properties.has('--parallax-near-x'), false);
  assert.equal(scene.classes.has('is-parallax-tracking'), true);
  scene.frame();
  assert.deepEqual(offsets(scene), [-.5, 0, -.5, -.5, 1.5, .5, 2.5, 1.5]);
  scene.pointer(0, 0);
  scene.frame();
  assert.deepEqual(offsets(scene), [.5, 0, 1, .5, -1.5, -.5, -2.5, -1]);
  scene.pointer(600, 380);
  scene.frame();
  assert.deepEqual(offsets(scene), centered);
});

test('pointer bursts coalesce to the latest position', () => {
  const scene = createScene();
  scene.pointer(0, 0);
  scene.pointer(1200, 760);
  scene.pointer(600, 380);
  scene.frame();
  assert.deepEqual(offsets(scene), centered);
});

for (const [name, interrupt] of [
  ['pointerleave', (scene) => scene.figure.emit('pointerleave')],
  ['pointercancel', (scene) => scene.figure.emit('pointercancel')],
  ['window blur', (scene) => scene.window.emit('blur')],
  ['hidden document', (scene) => scene.hide(true)],
  ['open overlay', (scene) => scene.overlay(true)],
  ['reduced motion', (scene) => scene.reduce(true)],
  ['appearance change', (scene) => scene.appearance()],
]) {
  test(`${name} resets offsets and cancels queued pointer work`, () => {
    const scene = createScene();
    scene.pointer();
    scene.frame();
    scene.pointer(0, 0);
    interrupt(scene);
    assert.deepEqual(offsets(scene), centered);
    assert.equal(scene.classes.has('is-parallax-tracking'), false);
    scene.frame();
    assert.deepEqual(offsets(scene), centered);
  });
}

for (const [name, arrange] of [
  ['touch', (scene) => scene.pointer(1200, 760, 'touch')],
  ['system reduced motion', (scene) => { scene.reduce(true); scene.pointer(); }],
  ['saved reduced motion', (scene) => { scene.document.documentElement.dataset.motion = 'reduced'; scene.pointer(); }],
  ['overlay', (scene) => { scene.overlay(true); scene.pointer(); }],
]) {
  test(`${name} does not start parallax`, () => {
    const scene = createScene();
    arrange(scene);
    scene.frame();
    assert.equal(scene.classes.has('is-parallax-tracking'), false);
    assert.ok(offsets(scene).every((value) => Number.isNaN(value) || value === 0));
  });
}
