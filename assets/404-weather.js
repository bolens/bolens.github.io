(() => {
  const appearance = window.portfolioAppearance;
  const { palettes, weatherModes = [] } = window.portfolioThemeData || {};
  if (!appearance || !palettes || !weatherModes.length) return;

  const validConditions = new Set(weatherModes);
  let locationCondition = null;
  const seasons = new Set(['spring', 'summer', 'autumn', 'winter']);
  const emptyEnvironment = Object.freeze({ temperatureC:null, season:null, fireflyHabitat:null });
  let environment = emptyEnvironment;
  // Illustrative flying-adult rule, not a species-specific prediction.
  const fireflyEligibility = () => Number(environment.season !== 'winter'
    && environment.fireflyHabitat !== false
    && (environment.temperatureC === null || (environment.temperatureC >= 12 && environment.temperatureC <= 32)));
  const subscribers = new Set();

  const themeFallback = () => {
    const configured = palettes[appearance.palette]?.weather;
    return validConditions.has(configured) ? configured : 'clear';
  };

  const snapshot = () => Object.freeze({
    condition: locationCondition || themeFallback(),
    source: locationCondition ? 'location' : 'theme',
    palette: appearance.palette,
    environment,
    fireflyEligibility: fireflyEligibility(),
  });

  const sync = () => {
    const state = snapshot();
    document.documentElement.dataset.weather = state.condition;
    document.documentElement.dataset.weatherSource = state.source;
    document.documentElement.dataset.sceneFireflyEligibility = String(state.fireflyEligibility);
    for (const subscriber of subscribers) subscriber(state);
    dispatchEvent(new CustomEvent('portfolio-weather-change', { detail: state }));
    return state;
  };

  const setLocationCondition = (condition) => {
    locationCondition = validConditions.has(condition) ? condition : null;
    return sync();
  };
  const setEnvironment = (input) => {
    const value = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
    environment = Object.freeze({
      temperatureC: Number.isFinite(value.temperatureC) && value.temperatureC >= -90 && value.temperatureC <= 60 ? value.temperatureC : null,
      season: seasons.has(value.season) ? value.season : null,
      fireflyHabitat: typeof value.fireflyHabitat === 'boolean' ? value.fireflyHabitat : null,
    });
    return sync();
  };
  const useThemeFallback = () => {
    locationCondition = null;
    return sync();
  };
  const subscribe = (subscriber) => {
    subscribers.add(subscriber);
    return () => subscribers.delete(subscriber);
  };

  appearance.subscribe(sync);
  sync();

  window.portfolioWeather = Object.freeze({
    conditions: Object.freeze([...weatherModes]),
    setLocationCondition,
    setEnvironment,
    useThemeFallback,
    subscribe,
    get condition() { return snapshot().condition; },
    get source() { return snapshot().source; },
    get environment() { return environment; },
    get fireflyEligibility() { return fireflyEligibility(); },
  });
})();
