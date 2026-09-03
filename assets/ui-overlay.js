(() => {
  const activeSources = new Set();
  let active = false;

  const set = (source, sourceActive) => {
    if (sourceActive) activeSources.add(source);
    else activeSources.delete(source);
    const next = activeSources.size > 0;
    document.documentElement.classList.toggle('ui-overlay-open', next);
    if (next === active) return;
    active = next;
    dispatchEvent(new CustomEvent('ui-overlay-change', { detail: { active } }));
  };

  window.portfolioOverlay = { set, get active() { return active; } };
})();
