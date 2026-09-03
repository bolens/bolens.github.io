(() => {
  const section = document.querySelector('.hobbies');
  if (!section) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const svgTimelines = section.querySelectorAll('svg');
  let intersecting = false;
  let overlayOpen = document.documentElement.classList.contains('ui-overlay-open');

  const sync = () => {
    const running = intersecting && !reducedMotion.matches && !document.hidden && !overlayOpen;
    section.dataset.motion = running ? 'running' : 'paused';
    svgTimelines.forEach((svg) => running ? svg.unpauseAnimations?.() : svg.pauseAnimations?.());
  };

  const observer = new IntersectionObserver(([entry]) => {
    intersecting = entry.isIntersecting;
    sync();
  }, { threshold: .01 });

  reducedMotion.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  addEventListener('ui-overlay-change', ({ detail }) => {
    overlayOpen = detail.active;
    sync();
  });

  sync();
  observer.observe(section);
})();
