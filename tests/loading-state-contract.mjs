import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { resolve } from 'node:path';

const source = readFileSync(resolve(import.meta.dirname, '../assets/loading-state.js'), 'utf8');

const createHarness = (readyState) => {
  const removed = [];
  const animationFrames = [];
  const listeners = new Map();
  const timers = [];
  const context = {
    document: {
      readyState,
      documentElement: { classList: { remove: (name) => removed.push(name) } },
    },
    addEventListener: (name, listener, options) => listeners.set(name, { listener, options }),
    requestAnimationFrame: (callback) => animationFrames.push(callback),
    setTimeout: (callback, delay) => timers.push({ callback, delay }),
  };
  vm.runInNewContext(source, context);
  return { animationFrames, listeners, removed, timers };
};

const flushFrame = (harness) => harness.animationFrames.shift()?.();

{
  const harness = createHarness('loading');
  const load = harness.listeners.get('load');
  if (!load || load.options?.once !== true) throw new Error('loading documents must wait for one load event');
  if (harness.timers.length !== 1 || harness.timers[0].delay !== 3000) throw new Error('loading fallback must run after 3000ms');
  load.listener();
  if (harness.removed.length || harness.animationFrames.length !== 1) throw new Error('load must begin a two-frame reveal without removing the state immediately');
  flushFrame(harness);
  if (harness.removed.length || harness.animationFrames.length !== 1) throw new Error('the first frame must retain the loading state');
  flushFrame(harness);
  if (harness.removed.join() !== 'is-loading') throw new Error('the second frame must remove the loading state exactly once');
  harness.timers[0].callback();
  if (harness.removed.length !== 1 || harness.animationFrames.length) throw new Error('the fallback must be idempotent after load completes');
}

{
  const harness = createHarness('complete');
  if (harness.listeners.size) throw new Error('complete documents must not register a load listener');
  if (harness.animationFrames.length !== 1) throw new Error('complete documents must begin revealing immediately');
  harness.timers[0].callback();
  if (harness.animationFrames.length !== 1) throw new Error('the timeout must not schedule a duplicate reveal');
  flushFrame(harness);
  flushFrame(harness);
  if (harness.removed.join() !== 'is-loading') throw new Error('complete documents must remove the loading state once');
}

{
  const harness = createHarness('loading');
  harness.timers[0].callback();
  flushFrame(harness);
  if (harness.removed.length) throw new Error('fallback must retain the state until its second frame');
  flushFrame(harness);
  if (harness.removed.join() !== 'is-loading') throw new Error('fallback must reveal even when load never arrives');
  harness.listeners.get('load').listener();
  if (harness.animationFrames.length || harness.removed.length !== 1) throw new Error('late load must not reveal twice');
}

console.log('Loading-state contract passed load, complete, two-frame reveal, fallback, and idempotence branches.');
