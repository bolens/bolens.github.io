(() => {
  const appearance = window.portfolioAppearance;
  const { timeModes = [] } = window.portfolioThemeData || {};
  if (!appearance || !timeModes.length) return;

  const validTimes = new Set(timeModes);
  const fixedPositions = Object.freeze({
    day: Object.freeze({ x: 0, y: 0, darkness: 0, warmth: .08 }),
    night: Object.freeze({ x: 0, y: 0, darkness: 1, warmth: 0 }),
    morning: Object.freeze({ x: -180, y: 94, darkness: .08, warmth: .72 }),
    evening: Object.freeze({ x: 20, y: 96, darkness: .18, warmth: .9 }),
    twilight: Object.freeze({ x: 0, y: 38, darkness: .58, warmth: .42 }),
  });
  let selectedTime = null;
  let clock = new Date();
  const subscribers = new Set();
  const clamp = (value, low = 0, high = 1) => Math.min(high, Math.max(low, value));
  const mix = (start, end, amount) => start + (end - start) * amount;

  const cycleAt = (date) => {
    const hour = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
    let time = 'night';
    if (hour >= 5 && hour < 8) time = 'morning';
    else if (hour >= 8 && hour < 17) time = 'day';
    else if (hour >= 17 && hour < 20) time = 'evening';
    else if (hour >= 20 && hour < 22) time = 'twilight';

    const daylight = clamp((hour - 5) / 17);
    const sunHeight = Math.sin(daylight * Math.PI);
    const nightHour = hour < 5 ? hour + 24 : hour;
    const moonlight = clamp((nightHour - 22) / 7);
    const moonHeight = Math.sin(moonlight * Math.PI);
    const celestial = ['morning', 'day', 'evening'].includes(time)
      ? { x: mix(-180, 40, daylight), y: mix(104, -14, sunHeight), progress: daylight }
      : { x: mix(-130, 55, moonlight), y: mix(72, 4, moonHeight), progress: moonlight };
    const darkness = hour < 5 ? 1 : hour < 8 ? mix(.72, 0, (hour - 5) / 3) : hour < 17 ? 0 : hour < 20 ? mix(0, .36, (hour - 17) / 3) : hour < 22 ? mix(.36, 1, (hour - 20) / 2) : 1;
    const sunriseWarmth = 1 - clamp(Math.abs(hour - 6.5) / 2.5);
    const sunsetWarmth = 1 - clamp(Math.abs(hour - 18.5) / 2.5);
    return Object.freeze({ time, ...celestial, darkness, warmth: Math.max(sunriseWarmth, sunsetWarmth) });
  };

  const snapshot = () => {
    if (selectedTime) return Object.freeze({ time: selectedTime, source: 'scene', cycle: 'fixed', progress: .5, ...fixedPositions[selectedTime] });
    if (appearance.theme !== 'auto') {
      const time = appearance.resolvedTheme === 'night' ? 'night' : 'day';
      return Object.freeze({ time, source: 'appearance', cycle: 'fixed', progress: .5, ...fixedPositions[time] });
    }
    return Object.freeze({ ...cycleAt(clock), source: 'clock', cycle: 'dynamic' });
  };
  const sync = (date = new Date()) => {
    clock = date;
    const state = snapshot();
    const root = document.documentElement;
    root.dataset.sceneTime = state.time;
    root.dataset.sceneTimeSource = state.source;
    root.dataset.sceneCycle = state.cycle;
    root.style.setProperty('--scene-orb-x', `${state.x.toFixed(2)}px`);
    root.style.setProperty('--scene-orb-y', `${state.y.toFixed(2)}px`);
    root.style.setProperty('--scene-cycle-darkness', state.darkness.toFixed(3));
    root.style.setProperty('--scene-cycle-warmth', state.warmth.toFixed(3));
    root.style.setProperty('--scene-star-opacity', clamp(state.darkness * .9).toFixed(3));
    root.style.setProperty('--scene-aurora-opacity', clamp((state.darkness - .3) * .72).toFixed(3));
    root.style.setProperty('--scene-airglow-opacity', clamp(state.darkness * .55).toFixed(3));
    root.style.setProperty('--scene-ray-opacity', clamp((1 - state.darkness) * (.45 + state.warmth * .35)).toFixed(3));
    root.style.setProperty('--scene-cloud-brightness', mix(.78, 1, 1 - state.darkness).toFixed(3));
    root.style.setProperty('--scene-ufo-glint-opacity', mix(.3, .78, 1 - state.darkness).toFixed(3));
    for (const subscriber of subscribers) subscriber(state);
    dispatchEvent(new CustomEvent('portfolio-scene-time-change', { detail: state }));
    return state;
  };
  const setTime = (time) => {
    selectedTime = validTimes.has(time) ? time : null;
    return sync();
  };
  const useAppearanceFallback = () => {
    selectedTime = null;
    return sync();
  };
  const subscribe = (subscriber) => {
    subscribers.add(subscriber);
    return () => subscribers.delete(subscriber);
  };

  appearance.subscribe(() => sync());
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !selectedTime && appearance.theme === 'auto') sync(); });
  window.setInterval?.(() => { if (!selectedTime && appearance.theme === 'auto') sync(); }, 60000);
  sync();
  window.portfolioSceneTime = Object.freeze({
    times: Object.freeze([...timeModes]),
    setTime,
    useAppearanceFallback,
    refresh: sync,
    subscribe,
    get time() { return snapshot().time; },
    get source() { return snapshot().source; },
    get cycle() { return snapshot().cycle; },
    get state() { return snapshot(); },
  });
})();
