(() => {
  const figure = document.querySelector('.cryptid-camp');
  if (!figure) return;

  const budgets = Object.freeze({
    full: Object.freeze({ fps:20, pixelRatio:.8, motion:'full' }),
    balanced: Object.freeze({ fps:15, pixelRatio:.7, motion:'balanced' }),
    minimal: Object.freeze({ fps:10, pixelRatio:.5, motion:'minimal' }),
  });
  const connection = navigator.connection;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const cores = navigator.hardwareConcurrency || 4;
  const constrained = Boolean(connection?.saveData) || cores <= 4;
  const tierForWidth = (width) => {
    if (width <= 430 || constrained) return 'minimal';
    if (width <= 760 || cores < 8) return 'balanced';
    return 'full';
  };

  const animatedTargets = new Set(figure.getAnimations({ subtree:true }).map(({ effect }) => effect?.target).filter(Boolean));
  const liveByTier = Object.freeze({
    minimal: Object.freeze([
      '.scene-orb', '.flame-stack', '.flame-outer', '.flame-inner', '.flame-core',
      '.day-flight-ufo',
    ]),
    balanced: Object.freeze([
      '.scene-orb', '.flame-stack', '.flame-outer', '.flame-inner', '.flame-core',
      '.day-flight-ufo', '.background-ufo', '.tent-dog', '.moth-wing',
    ]),
    full: Object.freeze([
      '.scene-orb', '.solar-ray-field', '.flame-stack', '.flame-outer', '.flame-inner', '.flame-core',
      '.day-flight-ufo', '.background-ufo', '.ufo-lights', '.tent-dog', '.moth-wing',
    ]),
  });
  const weatherMotion = Object.freeze({ rainy:'.weather-rain', snowy:'.weather-snow', misty:'.weather-mist', windy:'.weather-wind', thunderstorm:'.weather-rain' });

  let currentTier;
  let overlayActive = document.documentElement.classList.contains('ui-overlay-open');
  let playbackFrame = 0;
  const syncAnimationPlayback = () => {
    cancelAnimationFrame(playbackFrame);
    playbackFrame = requestAnimationFrame(() => {
      const paused = overlayActive || document.hidden || reducedMotion.matches || document.documentElement.dataset.motion === 'reduced';
      for (const animation of figure.getAnimations({ subtree:true })) {
        const live = animation.effect?.target?.dataset.runtimeMotion === 'live';
        if (!paused && live) animation.play();
        else animation.pause();
      }
    });
  };
  const applyMotionTargets = () => {
    for (const target of figure.querySelectorAll('[data-runtime-motion="live"]')) target.dataset.runtimeMotion = 'off';
    for (const target of animatedTargets) target.dataset.runtimeMotion = 'off';
    const selectors = [...liveByTier[currentTier]];
    const weatherSelector = weatherMotion[window.portfolioWeather?.condition];
    if (weatherSelector) selectors.push(weatherSelector);
    if (['windy', 'thunderstorm'].includes(window.portfolioWeather?.condition) && currentTier !== 'minimal') selectors.push('.camp-pines,.river-willows,.camp-tent > use:first-child,.smoke-character');
    for (const selector of selectors) {
      for (const target of figure.querySelectorAll(selector)) target.dataset.runtimeMotion = 'live';
    }
    syncAnimationPlayback();
  };
  const applyTier = (width) => {
    const tier = tierForWidth(width);
    if (tier === currentTier) return;
    currentTier = tier;
    applyMotionTargets();
    figure.dataset.renderTier = tier;
    figure.dataset.renderRuntime = 'native';
    dispatchEvent(new CustomEvent('portfolio-render-budget-change', { detail:{ tier, ...budgets[tier] } }));
  };

  const observer = new ResizeObserver(([entry]) => applyTier(entry.contentRect.width));
  observer.observe(figure);
  applyTier(figure.getBoundingClientRect().width);
  window.portfolioWeather?.subscribe(applyMotionTargets);
  window.portfolioSceneTime?.subscribe(syncAnimationPlayback);
  window.addEventListener('ui-overlay-change', ({ detail }) => {
    overlayActive = Boolean(detail?.active);
    syncAnimationPlayback();
  });
  document.addEventListener('visibilitychange', syncAnimationPlayback);
  reducedMotion.addEventListener?.('change', syncAnimationPlayback);
  const dataRenderTier = () => figure.dataset.renderTier;
  window.portfolio404Renderer = Object.freeze({
    budgets,
    tierForWidth,
    get tier() { return dataRenderTier(); },
    get budget() { return budgets[dataRenderTier()] || budgets.minimal; },
  });
})();
