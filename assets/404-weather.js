(() => {
  const appearance = window.portfolioAppearance;
  const { palettes, weatherModes = [] } = window.portfolioThemeData || {};
  if (!appearance || !palettes || !weatherModes.length) return;

  const validConditions = new Set(weatherModes);
  let locationCondition = null;
  const subscribers = new Set();

  const themeFallback = () => {
    const configured = palettes[appearance.palette]?.weather;
    return validConditions.has(configured) ? configured : 'clear';
  };

  const snapshot = () => Object.freeze({
    condition: locationCondition || themeFallback(),
    source: locationCondition ? 'location' : 'theme',
    palette: appearance.palette,
  });

  const sync = () => {
    const state = snapshot();
    document.documentElement.dataset.weather = state.condition;
    document.documentElement.dataset.weatherSource = state.source;
    for (const subscriber of subscribers) subscriber(state);
    dispatchEvent(new CustomEvent('portfolio-weather-change', { detail: state }));
    return state;
  };

  const setLocationCondition = (condition) => {
    locationCondition = validConditions.has(condition) ? condition : null;
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
    useThemeFallback,
    subscribe,
    get condition() { return snapshot().condition; },
    get source() { return snapshot().source; },
  });
})();
