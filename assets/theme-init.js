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
  let palette = 'glacier';
  let theme = 'auto';

  const requested = new URLSearchParams(location.search).get('palette');
  try {
    const saved = localStorage.getItem(paletteKey);
    if (requested in palettes) palette = requested;
    else if (saved in palettes) palette = saved;
    const savedTheme = localStorage.getItem(themeKey);
    if (themes.includes(savedTheme)) theme = savedTheme;
  } catch {
    if (requested in palettes) palette = requested;
  }

  const syncThemeColors = () => {
    const colors = palettes[palette];
    document.querySelector('meta[name="theme-color"][media*="light"]')?.setAttribute('content', theme === 'night' ? colors.dark : colors.light);
    document.querySelector('meta[name="theme-color"][media*="dark"]')?.setAttribute('content', theme === 'day' ? colors.light : colors.dark);
    document.querySelector('meta[name="theme-color"]:not([media])')?.setAttribute('content', theme === 'day' ? colors.light : colors.dark);
  };
  const applyPalette = (name, persist = true) => {
    palette = name in palettes ? name : 'glacier';
    document.documentElement.dataset.palette = palette;
    syncThemeColors();
    if (persist) try { localStorage.setItem(paletteKey, palette); } catch {}
    return palette;
  };
  const applyTheme = (name, persist = true) => {
    theme = themes.includes(name) ? name : 'auto';
    if (theme === 'auto') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = theme;
    syncThemeColors();
    if (persist) try { localStorage.setItem(themeKey, theme); } catch {}
    return theme;
  };

  applyPalette(palette, false);
  applyTheme(theme, false);
  window.portfolioAppearance = {
    palettes,
    applyPalette,
    applyTheme,
    get palette() { return palette; },
    get theme() { return theme; },
  };
})();
