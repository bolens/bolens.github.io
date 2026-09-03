(() => {
  const palettes = {
    alpine: { label: 'Alpine', light: '#edf4f3', dark: '#102322' },
    desert: { label: 'High Desert', light: '#f3ead8', dark: '#211914' },
    glacier: { label: 'Glacier', light: '#eaf1f4', dark: '#10232f' },
    signal: { label: 'Night Signal', light: '#f0edf5', dark: '#1d1729' },
    forest: { label: 'Forest Canopy', light: '#edf1e7', dark: '#172119' },
    coast: { label: 'Pacific Coast', light: '#e8f0ef', dark: '#102326' },
    meadow: { label: 'Wildflower', light: '#f1efe4', dark: '#202019' },
    volcanic: { label: 'Volcanic', light: '#eeeae7', dark: '#211a18' },
  };
  const paletteKey = 'portfolio-palette';
  const themeKey = 'portfolio-theme';
  const themes = ['auto', 'day', 'night'];
  const systemDark = matchMedia('(prefers-color-scheme: dark)');
  let palette = 'glacier';
  let theme = 'auto';

  const requested = new URLSearchParams(location.search).get('palette');
  const hasPalettePreview = requested in palettes;
  try {
    const saved = localStorage.getItem(paletteKey);
    if (hasPalettePreview) palette = requested;
    else if (saved in palettes) palette = saved;
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
  const notify = () => dispatchEvent(new CustomEvent('portfolio-appearance-change', { detail: { palette, theme, resolvedTheme: resolvedTheme() } }));
  const applyPalette = (name, persist = true, announce = true) => {
    palette = name in palettes ? name : 'glacier';
    document.documentElement.dataset.palette = palette;
    syncThemeColors();
    if (persist) try { localStorage.setItem(paletteKey, palette); } catch {}
    if (announce) notify();
    return palette;
  };
  const applyTheme = (name, persist = true, announce = true) => {
    theme = themes.includes(name) ? name : 'auto';
    if (theme === 'auto') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = theme;
    syncThemeColors();
    if (persist) try { localStorage.setItem(themeKey, theme); } catch {}
    if (announce) notify();
    return theme;
  };

  applyPalette(palette, false, false);
  applyTheme(theme, false, false);
  systemDark.addEventListener?.('change', () => { if (theme === 'auto') { syncThemeColors(); notify(); } });
  addEventListener('storage', (event) => {
    if (event.key === paletteKey && !hasPalettePreview) applyPalette(event.newValue in palettes ? event.newValue : 'glacier', false);
    if (event.key === themeKey) applyTheme(themes.includes(event.newValue) ? event.newValue : 'auto', false);
  });
  window.portfolioAppearance = {
    palettes,
    applyPalette,
    applyTheme,
    get palette() { return palette; },
    get theme() { return theme; },
    get resolvedTheme() { return resolvedTheme(); },
  };
})();
