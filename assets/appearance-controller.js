(() => {
  const { defaultPalette, modes: themes } = window.portfolioThemeData;
  const palettes = Object.freeze(Object.fromEntries(Object.entries(window.portfolioThemeData.palettes).map(([name, value]) => [name, Object.freeze({ ...value })])));
  const paletteKey = 'portfolio-palette';
  const themeKey = 'portfolio-theme';
  const systemDark = matchMedia('(prefers-color-scheme: dark)');
  let palette = defaultPalette;
  let theme = 'auto';
  const subscribers = new Set();
  const hasPalette = (name) => Object.hasOwn(palettes, name);

  const requested = new URLSearchParams(location.search).get('palette');
  const hasPalettePreview = hasPalette(requested);
  try {
    const saved = localStorage.getItem(paletteKey);
    if (hasPalettePreview) palette = requested;
    else if (hasPalette(saved)) palette = saved;
    const savedTheme = localStorage.getItem(themeKey);
    if (themes.includes(savedTheme)) theme = savedTheme;
  } catch {
    if (hasPalettePreview) palette = requested;
  }

  const resolvedTheme = () => theme === 'auto' ? (systemDark.matches ? 'night' : 'day') : theme;
  const syncThemeColors = () => {
    const colors = palettes[palette];
    document.querySelector('meta[name="theme-color"][media*="light"]')?.setAttribute('content', theme === 'night' ? colors.dark : colors.light);
    document.querySelector('meta[name="theme-color"][media*="dark"]')?.setAttribute('content', theme === 'day' ? colors.light : colors.dark);
    document.querySelector('meta[name="theme-color"]:not([media])')?.setAttribute('content', resolvedTheme() === 'night' ? colors.dark : colors.light);
  };
  const snapshot = () => Object.freeze({ palette, theme, resolvedTheme: resolvedTheme() });
  const notify = () => { const state = snapshot(); for (const subscriber of subscribers) subscriber(state); };
  const update = (next, { persist = [], notifySubscribers = true } = {}) => {
    if (Object.hasOwn(next, 'palette')) palette = hasPalette(next.palette) ? next.palette : defaultPalette;
    if (Object.hasOwn(next, 'theme')) theme = themes.includes(next.theme) ? next.theme : 'auto';
    document.documentElement.dataset.palette = palette;
    if (theme === 'auto') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = theme;
    syncThemeColors();
    try {
      if (persist.includes('palette')) localStorage.setItem(paletteKey, palette);
      if (persist.includes('theme')) localStorage.setItem(themeKey, theme);
    } catch {}
    if (notifySubscribers) notify();
    return snapshot();
  };
  const setPalette = (name) => update({ palette: name }, { persist: ['palette'] });
  const setTheme = (name) => update({ theme: name }, { persist: ['theme'] });
  const cyclePalette = () => {
    const names = Object.keys(palettes);
    return setPalette(names[(names.indexOf(palette) + 1) % names.length]);
  };
  const toggleTheme = () => setTheme(resolvedTheme() === 'night' ? 'day' : 'night');
  const reset = () => update({ palette: defaultPalette, theme: 'auto' }, { persist: ['palette', 'theme'] });
  const subscribe = (subscriber) => { subscribers.add(subscriber); return () => subscribers.delete(subscriber); };

  update({ palette, theme }, { notifySubscribers: false });
  systemDark.addEventListener?.('change', () => { if (theme === 'auto') { syncThemeColors(); notify(); } });
  addEventListener('storage', (event) => {
    if (event.key === paletteKey && !hasPalettePreview) update({ palette: hasPalette(event.newValue) ? event.newValue : defaultPalette });
    if (event.key === themeKey) update({ theme: themes.includes(event.newValue) ? event.newValue : 'auto' });
  });
  window.portfolioAppearance = {
    palettes,
    modes: themes,
    defaultPalette,
    setPalette,
    setTheme,
    cyclePalette,
    toggleTheme,
    reset,
    subscribe,
    get palette() { return palette; },
    get theme() { return theme; },
    get resolvedTheme() { return resolvedTheme(); },
  };
})();
