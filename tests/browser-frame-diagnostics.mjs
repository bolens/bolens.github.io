import assert from 'node:assert/strict';
import test from 'node:test';
import { waitForFrames } from './lib/browser-test.mjs';

test('frame diagnostics preserve native frame waits and the original failure', async () => {
  const failure = new Error('native frame wait timed out');
  const calls = [];
  let inspections = 0;
  const send = async (method, params, timeout) => {
    calls.push({ method, params, timeout });
    if (params.awaitPromise) throw failure;
    return { result: { value: { visibility: ++inspections === 1 ? 'visible' : 'hidden', timeline: 42 } } };
  };
  await assert.rejects(waitForFrames(send), error => error === failure && error.message.includes('"before":{"visibility":"visible"') && error.message.includes('"after":{"visibility":"hidden"'));
  assert.equal(calls.length, 3);
  assert.deepEqual(calls.map(call => call.timeout), [1000, undefined, 1000]);
  assert.match(calls[1].params.expression, /remaining=2/);
  assert.match(calls[1].params.expression, /requestAnimationFrame\(next\)/);
  assert.equal(calls[1].params.awaitPromise, true);
  assert.doesNotMatch(calls[0].params.expression, /getAnimations/);
  assert.match(calls[2].params.expression, /getAnimations/);
});

test('unavailable initial diagnostics cannot block otherwise healthy native frames', async () => {
  const calls = [];
  const send = async (...args) => {
    calls.push(args);
    if (calls.length === 1) throw new Error('initial inspection unavailable');
    return { result: { value: true } };
  };
  await waitForFrames(send);
  assert.equal(calls.length, 2);
  assert.equal(calls[1][1].awaitPromise, true);
  assert.equal(calls[1][2], undefined);
});

test('failed diagnostic inspection cannot turn a frame failure into success', async () => {
  const failure = new Error('native frame wait timed out');
  let calls = 0;
  const send = async (_method, params) => {
    calls++;
    if (params.awaitPromise) throw failure;
    if (calls === 3) throw new Error('renderer unresponsive');
    return { result: { value: { visibility: 'visible' } } };
  };
  await assert.rejects(waitForFrames(send), error => error === failure && error.message.includes('renderer unresponsive'));
  assert.equal(calls, 3);
});

test('successful native frames require no recovery or post-failure inspection', async () => {
  const calls = [];
  const send = async (...args) => { calls.push(args); return { result: { value: true } }; };
  await waitForFrames(send, 4);
  assert.equal(calls.length, 2);
  assert.match(calls[1][1].expression, /remaining=4/);
});
