(() => {
  const appearance = window.portfolioAppearance;
  const overlay = window.portfolioOverlay;
  if (!appearance || !overlay) return;
  const { palettes } = appearance;
  let selected = appearance.palette;
  let selectedTheme = appearance.theme;
  let returnFocus = null;

  const mountPicker = () => {
    const picker = document.createElement('details');
    picker.className = 'palette-picker';
    picker.hidden = true;
    picker.innerHTML = `
      <summary aria-keyshortcuts="Alt+P"><span class="palette-current" aria-hidden="true"></span><span class="palette-name"></span></summary>
      <div class="palette-panels"><fieldset aria-describedby="palette-help">
        <legend>Choose a color palette</legend>
        <p class="visually-hidden" id="palette-help">Changes apply immediately. Use the arrow keys to move between palettes.</p>
        ${Object.entries(palettes).map(([name, palette]) => `
          <label data-palette-option="${name}">
            <input type="radio" name="portfolio-palette" value="${name}"${name === selected ? ' checked' : ''}>
            <span class="palette-swatches" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>
            <span>${palette.label}</span>
          </label>`).join('')}
      </fieldset></div>`;
    const themeFieldset = document.createElement('fieldset');
    themeFieldset.className = 'theme-options';
    themeFieldset.setAttribute('aria-describedby', 'appearance-help');
    themeFieldset.innerHTML = `<legend>Choose an appearance</legend><p class="visually-hidden" id="appearance-help">Changes apply immediately. System follows your device setting.</p>${appearance.modes.map((theme) => `<label><input type="radio" name="portfolio-theme" value="${theme}"${theme === selectedTheme ? ' checked' : ''}><span>${theme === 'auto' ? 'System' : theme[0].toUpperCase() + theme.slice(1)}</span></label>`).join('')}`;
    picker.querySelector('.palette-panels').append(themeFieldset);

    const status = document.createElement('p');
    status.className = 'palette-status visually-hidden';
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-atomic', 'true');
    const sync = (announce = false) => {
      const modeLabel = selectedTheme === 'auto' ? 'System' : selectedTheme[0].toUpperCase() + selectedTheme.slice(1);
      picker.querySelector('.palette-name').textContent = `${palettes[selected].label} · ${modeLabel}`;
      picker.querySelector('summary').setAttribute('aria-label', `Color palette and appearance. Current: ${palettes[selected].label}, ${modeLabel}`);
      if (announce) status.textContent = `${palettes[selected].label} palette, ${modeLabel} appearance.`;
    };
    const choosePalette = (name) => { appearance.setPalette(name); sync(true); };
    const chooseTheme = (mode) => { appearance.setTheme(mode); sync(true); };
    const close = () => {
      picker.open = false;
      picker.hidden = true;
      overlay.set('appearance', false);
      if (returnFocus instanceof HTMLElement) returnFocus.focus();
      returnFocus = null;
    };
    const collapse = () => { picker.open = false; overlay.set('appearance', false); };
    const open = () => {
      if (picker.hidden) returnFocus = document.activeElement;
      picker.hidden = false;
      picker.open = true;
      overlay.set('appearance', true);
      picker.querySelector('summary')?.focus();
    };
    const toggle = () => picker.hidden ? open() : close();
    sync();
    appearance.subscribe((state) => {
      selected = state.palette;
      selectedTheme = state.theme;
      const paletteControl = picker.querySelector(`input[name="portfolio-palette"][value="${selected}"]`);
      const themeControl = picker.querySelector(`input[name="portfolio-theme"][value="${selectedTheme}"]`);
      if (paletteControl) paletteControl.checked = true;
      if (themeControl) themeControl.checked = true;
      sync();
    });
    picker.addEventListener('change', (event) => {
      if (!(event.target instanceof HTMLInputElement)) return;
      if (event.target.name === 'portfolio-theme') chooseTheme(event.target.value);
      else choosePalette(event.target.value);
    });
    picker.addEventListener('toggle', () => overlay.set('appearance', picker.open && !picker.hidden));
    document.addEventListener('pointerdown', (event) => { if (picker.open && !picker.contains(event.target)) collapse(); });
    document.body.append(picker, status);
    window.portfolioAppearancePicker = { open, close, toggle, announce: () => sync(true), get visible() { return !picker.hidden; } };
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountPicker, { once: true });
  else mountPicker();
})();
