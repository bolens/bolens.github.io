(() => {
  // Each illustration owns its visibility. Scrolling past a project must not
  // keep every other illustration running, or restart their timelines.
  const scenes = new Map([...document.querySelectorAll('.hobbies,.signal-map,.project-visual')].map((element) => [element, {
    timelines: element.querySelectorAll('svg'),
    intersecting: false,
    running: undefined,
  }]));
  if (!scenes.size) return;

  // The final badge stays readable at a fixed size while the flight scales
  // with the route. Measure their shared catch point only when either resizes.
  const flight = document.querySelector('.hobby-flight-layer');
  const basket = document.querySelector('.hobby-disc-golf > svg');
  const caught = basket?.querySelector('.basket-caught-disc');
  const path = flight?.querySelector('#hobby-flight-path');
  if (flight && basket && caught && path) {
    const endpoint = path.getPointAtLength(path.getTotalLength());
    const alignCatch = () => {
      const flightMatrix = flight.getScreenCTM();
      const basketMatrix = basket.getScreenCTM();
      if (!flightMatrix?.a || !flightMatrix.d || !basketMatrix) return;
      const point = new DOMPoint(Number(caught.getAttribute('cx')), Number(caught.getAttribute('cy')))
        .matrixTransform(basketMatrix).matrixTransform(flightMatrix.inverse());
      flight.style.setProperty('--hobby-catch-x', `${point.x - endpoint.x}px`);
      flight.style.setProperty('--hobby-catch-y', `${point.y - endpoint.y}px`);
    };
    const sizes = new ResizeObserver(alignCatch);
    sizes.observe(flight);
    sizes.observe(basket);
  }

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let overlayOpen = document.documentElement.classList.contains('ui-overlay-open');
  const sync = () => {
    const allowed = !reducedMotion.matches && document.documentElement.dataset.motion !== 'reduced' && !document.hidden && !overlayOpen;
    for (const [element, scene] of scenes) {
      const running = scene.intersecting && allowed;
      if (running === scene.running) continue;
      scene.running = running;
      element.dataset.motion = running ? 'running' : 'paused';
      scene.timelines.forEach((svg) => running ? svg.unpauseAnimations?.() : svg.pauseAnimations?.());
    }
  };

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const scene = scenes.get(entry.target);
      if (scene) scene.intersecting = entry.isIntersecting;
    }
    sync();
  }, { threshold: .01 });

  reducedMotion.addEventListener('change', sync);
  window.portfolioAppearance?.subscribe(sync);
  document.addEventListener('visibilitychange', sync);
  addEventListener('ui-overlay-change', ({ detail }) => {
    overlayOpen = detail.active;
    sync();
  });

  sync();
  scenes.forEach((_, element) => observer.observe(element));
})();
