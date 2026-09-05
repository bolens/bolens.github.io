(() => {
  const weather = window.portfolioWeather;
  const sceneTime = window.portfolioSceneTime;
  if (!weather || !sceneTime) return;
  const weatherProfiles = Object.freeze({
    clear: Object.freeze({ tempo: 1, sway: .34, drift: .7, lift: 1, glow: 1, activity: 1, play: 1, water: .82, smoke: 1 }),
    cloudy: Object.freeze({ tempo: 1.08, sway: .42, drift: 1.2, lift: .9, glow: .9, activity: .84, play: .82, water: .9, smoke: 1.08 }),
    overcast: Object.freeze({ tempo: 1.16, sway: .48, drift: 1.5, lift: .76, glow: .82, activity: .68, play: .68, water: .94, smoke: 1.16 }),
    rainy: Object.freeze({ tempo: .82, sway: .62, drift: 2.2, lift: .36, glow: .6, activity: .54, play: .5, water: 1.3, smoke: .62 }),
    wet: Object.freeze({ tempo: 1.04, sway: .4, drift: 1, lift: .86, glow: 1.04, activity: .92, play: .9, water: 1.18, smoke: 1.06 }),
    dry: Object.freeze({ tempo: .94, sway: .3, drift: .8, lift: 1.08, glow: 1.06, activity: 1.06, play: .94, water: .62, smoke: .9 }),
    snowy: Object.freeze({ tempo: 1.34, sway: .38, drift: 1.8, lift: .24, glow: .78, activity: .42, play: .72, water: .78, smoke: 1.18 }),
    drought: Object.freeze({ tempo: 1.12, sway: .44, drift: 2, lift: 0, glow: .7, activity: .48, play: .58, water: .24, smoke: .38 }),
    windy: Object.freeze({ tempo: .68, sway: 1.5, drift: 5.8, lift: .78, glow: 1.08, activity: 1.12, play: 1.16, water: .88, smoke: 1.7 }),
  });
  const timeProfiles = Object.freeze({
    day: Object.freeze({ tempo: .97, glow: .72, activity: .92, play: 1.04, water: 1.04, smoke: .9 }),
    night: Object.freeze({ tempo: 1.08, glow: 1.22, activity: 1.08, play: .94, water: .9, smoke: 1.08 }),
    morning: Object.freeze({ tempo: 1.14, glow: .86, activity: .76, play: .86, water: 1.12, smoke: 1.14 }),
    evening: Object.freeze({ tempo: 1.02, glow: 1.12, activity: 1.02, play: 1.12, water: 1, smoke: 1.04 }),
    twilight: Object.freeze({ tempo: 1.06, glow: 1.16, activity: 1.14, play: 1.08, water: .94, smoke: 1.12 }),
  });
  const validWeather = new Set(Object.keys(weatherProfiles));
  const validTimes = new Set(Object.keys(timeProfiles));
  const round = (value) => Number(value.toFixed(3));
  const resolve = (time, condition) => {
    const resolvedTime = validTimes.has(time) ? time : 'night';
    const resolvedCondition = validWeather.has(condition) ? condition : 'clear';
    const sky = timeProfiles[resolvedTime];
    const air = weatherProfiles[resolvedCondition];
    return Object.freeze({
      time: resolvedTime, condition: resolvedCondition, signature: `${resolvedTime}-${resolvedCondition}`,
      tempo: round(air.tempo * sky.tempo), sway: round(air.sway * (.94 + sky.play * .06)),
      drift: round(air.drift * (.92 + sky.activity * .08)), lift: round(air.lift * (.9 + sky.activity * .1)),
      glow: round(air.glow * sky.glow), activity: round(air.activity * sky.activity), play: round(air.play * sky.play),
      water: round(air.water * sky.water), smoke: round(air.smoke * sky.smoke),
    });
  };
  let currentTime = sceneTime.time || 'night';
  let currentWeather = weather.condition || 'clear';
  let currentProfile;
  const subscribers = new Set();
  const publish = () => {
    currentProfile = resolve(currentTime, currentWeather);
    const root = document.documentElement;
    root.dataset.sceneMotion = currentProfile.signature;
    root.style.setProperty('--motion-tempo', String(currentProfile.tempo));
    root.style.setProperty('--motion-sway', `${currentProfile.sway}deg`);
    root.style.setProperty('--motion-sway-negative', `${-currentProfile.sway}deg`);
    root.style.setProperty('--motion-drift', `${currentProfile.drift}px`);
    root.style.setProperty('--motion-drift-negative', `${-currentProfile.drift}px`);
    for (const name of ['lift', 'glow', 'activity', 'play', 'water', 'smoke']) root.style.setProperty(`--motion-${name}`, String(currentProfile[name]));
    for (const subscriber of subscribers) subscriber(currentProfile);
    return currentProfile;
  };
  const subscribe = (subscriber) => { subscribers.add(subscriber); return () => subscribers.delete(subscriber); };
  weather.subscribe(({ condition }) => { currentWeather = condition; publish(); });
  sceneTime.subscribe((state) => { currentTime = state.time; publish(); });
  publish();
  window.portfolioSceneMotion = Object.freeze({ resolve, subscribe, get profile() { return currentProfile; } });
})();
