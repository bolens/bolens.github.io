(() => {
  // Each illustration owns its visibility. Scrolling past a project must not
  // keep every other illustration running, or restart their timelines.
  const scenes = new Map([...document.querySelectorAll('.hobbies,.signal-map,.project-visual')].map((element) => [element, {
    timelines: element.querySelectorAll('svg'),
    intersecting: false,
    running: undefined,
  }]));
  if (!scenes.size) return;

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
