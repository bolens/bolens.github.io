import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../../assets/404-scene.js', import.meta.url), 'utf8');

// Only browser boundaries are simulated. The actual scene owns all calculations,
// subscriptions, frame cancellation, and timer registration.
export function createScene({ condition = 'clear', reduced = false, restrained = false } = {}) {
  const eventTarget = () => {
    const listeners = new Map();
    return {
      addEventListener(type, callback) {
        const callbacks = listeners.get(type) ?? [];
        callbacks.push(callback);
        listeners.set(type, callbacks);
      },
      emit(type, detail = {}) { for (const callback of listeners.get(type) ?? []) callback(detail); },
    };
  };
  const properties = new Map();
  const classes = new Set();
  const frames = new Map();
  const timers = new Map();
  const paints = [];
  let id = 0;
  let now = 0;
  const drawing = {
    clearRect() { paints.length = 0; },
    setTransform() {}, save() {}, restore() {}, translate() {}, scale() {},
    beginPath() {}, arc(x, y, radius) { this.circle = { x, y, radius }; },
    fill() { paints.push({ ...this.circle, fill: this.fillStyle }); },
    fillRect() {}, drawImage() {},
    createRadialGradient() { return { addColorStop() {} }; },
  };
  const bounds = { left: 0, top: 0, width: 1200, height: 760 };
  const svg = { getBoundingClientRect: () => bounds };
  const figure = {
    ...eventTarget(), dataset: {},
    classList: { add: (name) => classes.add(name), remove: (name) => classes.delete(name) },
    style: { setProperty: (name, value) => properties.set(name, value) },
    querySelector: () => svg,
    getBoundingClientRect: () => bounds,
  };
  const canvas = { closest: () => figure, getContext: () => drawing };
  const media = { ...eventTarget(), matches: reduced };
  const document = {
    ...eventTarget(), hidden: false,
    documentElement: { dataset: {}, classList: { contains: () => false } },
    querySelector: () => canvas,
    createElement: () => ({ getContext: () => ({ ...drawing }) }),
  };
  let weatherSubscriber;
  let timeSubscriber;
  let appearanceSubscriber;
  const window = {
    ...eventTarget(),
    portfolioWeather: { condition, subscribe: (callback) => { weatherSubscriber = callback; } },
    portfolioSceneTime: { time: 'night', cycle: 'fixed', state: { time: 'night', cycle: 'fixed' }, subscribe: (callback) => { timeSubscriber = callback; } },
    portfolioAppearance: { subscribe: (callback) => { appearanceSubscriber = callback; } },
    setInterval(callback, delay) { const timerId = ++id; timers.set(timerId, { callback, delay, next: now + delay }); return timerId; },
    clearInterval: (timerId) => timers.delete(timerId),
  };
  vm.runInNewContext(source, {
    window, document, navigator: { hardwareConcurrency: restrained ? 4 : 8 },
    matchMedia: () => media, devicePixelRatio: 1, performance: { now: () => now },
    requestAnimationFrame(callback) { const frameId = ++id; frames.set(frameId, callback); return frameId; },
    cancelAnimationFrame: (frameId) => frames.delete(frameId),
    ResizeObserver: class { observe() {} },
  });
  return {
    figure, document, window, properties, classes, paints, frames, timers,
    frame(timestamp = now) {
      now = timestamp;
      const batch = [...frames];
      for (const [frameId, callback] of batch) {
        if (!frames.delete(frameId)) continue;
        callback(timestamp);
      }
    },
    advance(milliseconds) {
      const end = now + milliseconds;
      while (true) {
        const next = [...timers.values()].sort((a, b) => a.next - b.next)[0];
        if (!next || next.next > end) break;
        now = next.next;
        next.next += next.delay;
        next.callback();
      }
      now = end;
    },
    pointer(clientX = 1200, clientY = 760, pointerType = 'mouse') { figure.emit('pointermove', { clientX, clientY, pointerType }); },
    hide(hidden) { document.hidden = hidden; document.emit('visibilitychange'); },
    overlay(active) { window.emit('ui-overlay-change', { detail: { active } }); },
    reduce(matches) { media.matches = matches; media.emit('change'); },
    appearance() { appearanceSubscriber(); },
    weather(next) { window.portfolioWeather.condition = next; weatherSubscriber({ condition: next }); },
    time(state) { timeSubscriber(state); },
  };
}
