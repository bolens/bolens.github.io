import assert from 'node:assert/strict';
import test from 'node:test';
import { createScene } from './lib/scene-harness.mjs';

const offsets = (scene) => ['back', 'far', 'mid', 'near'].flatMap((depth) =>
  ['x', 'y'].map((axis) => Number.parseFloat(scene.properties.get(`--parallax-${depth}-${axis}`))));
const centered = [0, 0, 0, 0, 0, 0, 0, 0];

const settle = (scene, start = 0) => {
  for (let time = start + 16; time <= start + 800; time += 16) scene.frame(time);
};

test('pointer movement eases toward bounded offsets without overshoot', () => {
  const scene = createScene();
  scene.pointer();
  assert.equal(scene.properties.has('--parallax-near-x'), false);
  assert.equal(scene.classes.has('is-parallax-tracking'), true);
  scene.frame(16);
  assert.ok(offsets(scene)[6] > 0 && offsets(scene)[6] < 1);
  settle(scene, 16);
  assert.deepEqual(offsets(scene), [-.35, -.15, -.75, -.35, 1.3, .65, 2.6, 1.25]);
  scene.pointer(0, 0);
  scene.frame(832);
  assert.ok(offsets(scene)[6] > 0 && offsets(scene)[6] < 2.6, 'reversal does not teleport across center');
  settle(scene, 832);
  assert.deepEqual(offsets(scene), [.35, .15, .75, .35, -1.3, -.65, -2.6, -1.25]);
  scene.pointer(600, 380);
  settle(scene, 1632);
  assert.deepEqual(offsets(scene), centered);
});

test('pointer exit eases back to center and stops scheduling parallax', () => {
  const scene = createScene();
  scene.pointer();
  settle(scene);
  const idleFrames = scene.frames.size;
  scene.figure.emit('pointerleave');
  scene.frame(816);
  assert.ok(offsets(scene)[6] > 0 && offsets(scene)[6] < 2.6);
  settle(scene, 816);
  assert.deepEqual(offsets(scene), centered);
  assert.equal(scene.frames.size, idleFrames);
  assert.equal(scene.classes.has('is-parallax-tracking'), false);
});

test('elapsed-time easing agrees across refresh rates and settles when idle', () => {
  const sample = step => {
    const scene = createScene();
    scene.pointer();
    for (let time = step; time <= 240; time += step) scene.frame(time);
    const result = offsets(scene);
    settle(scene, 240);
    const pending = scene.frames.size;
    for (let i = 0; i < 20; i++) scene.pointer();
    assert.equal(scene.frames.size, pending, 'unchanged settled input schedules no new work');
    return result;
  };
  assert.deepEqual(sample(8), sample(16));
});

test('pointer bursts coalesce to the latest position', () => {
  const scene = createScene();
  scene.pointer(0, 0);
  scene.pointer(1200, 760);
  scene.pointer(600, 380);
  scene.frame();
  assert.deepEqual(offsets(scene), centered);
});

test('delayed frames and out-of-bounds input cannot cause unbounded jumps', () => {
  const scene = createScene();
  scene.pointer(12000, 7600);
  scene.frame(1000);
  assert.ok(offsets(scene)[6] > 0 && offsets(scene)[6] < 1.2, 'stalled frame has a capped step');
  settle(scene, 1000);
  assert.deepEqual(offsets(scene), [-.35, -.15, -.75, -.35, 1.3, .65, 2.6, 1.25]);
});

test('saved reduced motion stops an already active easing loop', () => {
  const scene = createScene();
  scene.pointer();
  scene.frame(16);
  scene.document.documentElement.dataset.motion = 'reduced';
  scene.frame(32);
  assert.deepEqual(offsets(scene), centered);
  assert.equal(scene.classes.has('is-parallax-tracking'), false);
});

for (const [name, interrupt] of [
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
    scene.frame(16);
    assert.ok(offsets(scene)[6] > 0, 'interrupt during active easing');
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
  ['hidden document', (scene) => { scene.hide(true); scene.pointer(); }],
]) {
  test(`${name} does not start parallax`, () => {
    const scene = createScene();
    arrange(scene);
    scene.frame();
    assert.equal(scene.classes.has('is-parallax-tracking'), false);
    assert.ok(offsets(scene).every((value) => Number.isNaN(value) || value === 0));
  });
}
