(() => {
  const appearance = window.portfolioAppearance;
  const overlay = window.portfolioOverlay;
  if (!appearance || !overlay) return;
  const { palettes } = appearance;
  let selected = appearance.palette;
  let selectedTheme = appearance.theme;
  const weather = document.body.classList.contains('lost-page') ? window.portfolioWeather : null;
  const sceneTime = document.body.classList.contains('lost-page') ? window.portfolioSceneTime : null;
  let selectedWeather = weather?.source === 'location' ? weather.condition : 'theme';
  let selectedTime = sceneTime?.source === 'scene' ? sceneTime.time : 'automatic';
  let returnFocus = null;

  const mountPicker = () => {
    const picker = document.createElement('details');
    picker.className = 'palette-picker';
    picker.hidden = true;
    picker.innerHTML = `
      <summary aria-keyshortcuts="Alt+P"><svg class="summary-glyph" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="/assets/trail-glyphs.svg#glyph-palette"></use></svg><span class="palette-current" aria-hidden="true"></span><span class="palette-name"></span></summary>
      <div class="palette-panels"><header class="overlay-header palette-panel-heading"><div class="overlay-heading"><svg class="overlay-heading-glyph" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="/assets/trail-glyphs.svg#glyph-palette"></use></svg><div><p>Trail colors</p><h2>Color and appearance</h2></div></div><button class="overlay-close" type="button" aria-label="Close color and appearance controls" data-tooltip="Close color and appearance controls"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="/assets/trail-glyphs.svg#glyph-close"></use></svg></button></header><div class="palette-panel-body"><fieldset aria-describedby="palette-help">
        <legend>Choose a color palette</legend>
        <p class="visually-hidden" id="palette-help">Changes apply immediately. Use the arrow keys to move between palettes.</p>
        ${Object.entries(palettes).map(([name, palette]) => `
          <label data-palette-option="${name}">
            <input type="radio" name="portfolio-palette" value="${name}"${name === selected ? ' checked' : ''}>
            <span class="palette-swatches" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>
            <span>${palette.label}</span>
          </label>`).join('')}
      </fieldset></div></div>`;
    const themeFieldset = document.createElement('fieldset');
    themeFieldset.className = 'theme-options';
    themeFieldset.setAttribute('aria-describedby', 'appearance-help');
    themeFieldset.innerHTML = `<legend>Choose an appearance</legend><p class="visually-hidden" id="appearance-help">Changes apply immediately. System follows your device setting.</p>${appearance.modes.map((theme) => `<label><input type="radio" name="portfolio-theme" value="${theme}"${theme === selectedTheme ? ' checked' : ''}><span>${theme === 'auto' ? 'System' : theme[0].toUpperCase() + theme.slice(1)}</span></label>`).join('')}`;
    picker.querySelector('.palette-panel-body').append(themeFieldset);
    if (weather && sceneTime) {
      picker.classList.add('has-scene-controls');
      const weatherFieldset = document.createElement('fieldset');
      weatherFieldset.className = 'weather-options scene-options';
      weatherFieldset.innerHTML = `<legend>Choose 404 weather</legend><p class="palette-section-label" aria-hidden="true">Weather</p>${['theme', ...weather.conditions].map((condition) => `<label><input type="radio" name="portfolio-weather" value="${condition}"${condition === selectedWeather ? ' checked' : ''}><span>${condition === 'theme' ? 'Theme default' : condition[0].toUpperCase() + condition.slice(1)}</span></label>`).join('')}`;
      const timeFieldset = document.createElement('fieldset');
      timeFieldset.className = 'scene-time-options scene-options';
      timeFieldset.innerHTML = `<legend>Choose 404 scene time</legend><p class="palette-section-label" aria-hidden="true">Scene time</p>${['automatic', ...sceneTime.times].map((time) => `<label><input type="radio" name="portfolio-scene-time" value="${time}"${time === selectedTime ? ' checked' : ''}><span>${time === 'automatic' ? 'Appearance / clock' : time[0].toUpperCase() + time.slice(1)}</span></label>`).join('')}`;
      picker.querySelector('.palette-panel-body').append(weatherFieldset, timeFieldset);
    }

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
    const chooseWeather = (condition) => {
      const state = condition === 'theme' ? weather.useThemeFallback() : weather.setLocationCondition(condition);
      selectedWeather = state.source === 'location' ? state.condition : 'theme';
      status.textContent = `${state.condition[0].toUpperCase() + state.condition.slice(1)} weather, ${state.source === 'theme' ? 'theme default' : 'scene override'}.`;
    };
    const chooseTime = (time) => {
      const state = time === 'automatic' ? sceneTime.useAppearanceFallback() : sceneTime.setTime(time);
      selectedTime = state.source === 'scene' ? state.time : 'automatic';
      status.textContent = `${state.time[0].toUpperCase() + state.time.slice(1)} scene time, ${state.source === 'scene' ? 'scene override' : 'automatic'}.`;
    };
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
    weather?.subscribe((state) => {
      selectedWeather = state.source === 'location' ? state.condition : 'theme';
      const control = picker.querySelector(`input[name="portfolio-weather"][value="${selectedWeather}"]`);
      if (control) control.checked = true;
    });
    sceneTime?.subscribe((state) => {
      selectedTime = state.source === 'scene' ? state.time : 'automatic';
      const control = picker.querySelector(`input[name="portfolio-scene-time"][value="${selectedTime}"]`);
      if (control) control.checked = true;
    });
    picker.addEventListener('change', (event) => {
      if (!(event.target instanceof HTMLInputElement)) return;
      if (event.target.name === 'portfolio-theme') chooseTheme(event.target.value);
      else if (event.target.name === 'portfolio-palette') choosePalette(event.target.value);
      else if (event.target.name === 'portfolio-weather') chooseWeather(event.target.value);
      else if (event.target.name === 'portfolio-scene-time') chooseTime(event.target.value);
    });
    picker.addEventListener('toggle', () => overlay.set('appearance', picker.open && !picker.hidden));
    picker.querySelector('.overlay-close').addEventListener('click', close);
    document.addEventListener('pointerdown', (event) => { if (picker.open && !picker.contains(event.target)) collapse(); });
    document.body.append(picker, status);
    window.portfolioAppearancePicker = { open, close, toggle, announce: () => sync(true), get visible() { return !picker.hidden; } };
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountPicker, { once: true });
  else mountPicker();
})();
