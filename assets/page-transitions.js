(() => {
  const root = document.documentElement;
  const reduced = () => root.dataset.motion === 'reduced' || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const route = (entry) => {
    if (!entry?.url) return null;
    const url = new URL(entry.url, location.href);
    if (url.origin !== location.origin) return null;
    const path = url.pathname.replace(/index\.html$/, '').replace(/\/$/, '') || '/';
    if (path === '/') return { path, level: 0 };
    if (path === '/work') return { path, level: 1 };
    if (path === '/about') return { path, level: 2 };
    if (path.startsWith('/case-studies/')) return { path, level: 3 };
    return null;
  };
  const prepare = (transition, activation, incoming) => {
    if (!transition) return;
    const from = route(activation?.from);
    const to = route(activation?.entry);
    // Keep native navigation, fragments, and unknown routes outside this choreography.
    if (reduced() || !from || !to || from.path === to.path) {
      transition.skipTransition();
      return;
    }
    const back = activation.navigationType === 'traverse'
      ? activation.entry.index < activation.from.index
      : to.level < from.level;
    root.dataset.pageDirection = back ? 'back' : 'forward';
    if (incoming) {
      // Retain this for the document lifetime: removing it would restart CSS entrances.
      root.dataset.pageArrived = '';
      root.classList.remove('is-loading');
    }
  };
  addEventListener('pageswap', (event) => prepare(event.viewTransition, event.activation, false));
  addEventListener('pagereveal', (event) => prepare(event.viewTransition, window.navigation?.activation, true));
})();
