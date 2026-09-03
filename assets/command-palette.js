(() => {
  const appearance = window.portfolioAppearance;
  const pickerUi = window.portfolioAppearancePicker;
  const overlay = window.portfolioOverlay;
  if (!appearance || !pickerUi || !overlay) return;
  const { palettes } = appearance;

  const mountCommands = () => {
    const runAppearance = (action) => () => { action(); pickerUi.announce(); };
    const choosePalette = (name) => runAppearance(() => appearance.setPalette(name));
    const chooseTheme = (mode) => runAppearance(() => appearance.setTheme(mode));
    const copyText = (value) => navigator.clipboard?.writeText(value).catch(() => {});
    const sharePage = () => {
      if (navigator.share) return navigator.share({ title: document.title, url: location.href }).catch(() => {});
      return copyText(location.href);
    };
    const sourcePath = location.pathname.endsWith('/') ? `${location.pathname.slice(1)}index.html` : location.pathname.slice(1);
    const pageSections = [
      ['condition', 'Condition', 'The starting state and constraints'],
      ['cause', 'Cause', 'What created the problem'],
      ['correction', 'Correction', 'How the system was improved'],
      ['confirm', 'Confirm', 'Results and verification'],
    ].filter(([id]) => document.getElementById(id));
    const commands = [
      { label: 'Home', detail: 'Portfolio overview', group: 'Go to', href: '/', shortcut: 'Alt H', ariaShortcut: 'Alt+H' },
      { label: 'Selected work', detail: 'Featured projects', group: 'Go to', href: '/#selected-work' },
      { label: 'Toolbox', detail: 'Languages, systems, and interfaces', group: 'Go to', href: '/#toolbox' },
      { label: 'Currently', detail: 'What Michael is working on now', group: 'Go to', href: '/#currently' },
      { label: 'Contact', detail: 'Connect with Michael on GitHub', group: 'Go to', href: '/#contact' },
      { label: 'Off the clock', detail: 'Interests beyond the terminal', group: 'Go to', href: '/#off-the-clock' },
      { label: 'All work', detail: 'Project index', group: 'Go to', href: '/work/', shortcut: 'Alt W', ariaShortcut: 'Alt+W' },
      { label: 'About Michael', detail: 'Approach, principles, and interests', group: 'Go to', href: '/about/', shortcut: 'Alt A', ariaShortcut: 'Alt+A' },
      ...pageSections.map(([id, label, detail]) => ({ label, detail, group: 'On this page', href: `#${id}`, keywords: `case study section ${id}` })),
      ...(window.portfolioProjects ?? []).flatMap((project) => [
        { label: project.caseLabel, detail: project.commandDetail, group: 'Case study', href: `/case-studies/${project.slug}/` },
        ...(project.site ? [{ label: `${project.name} project site`, detail: 'Documentation and installation', group: 'Open', href: project.site }] : []),
        { label: `${project.name} repository`, detail: 'Source on GitHub', group: 'Open', href: project.repository },
      ]),
      { label: 'GitHub profile', detail: 'All repositories', group: 'Open', href: 'https://github.com/bolens' },
      { label: 'Back', detail: 'Return to the previous page', group: 'Browser', keywords: 'history previous', run: () => history.back() },
      { label: 'Forward', detail: 'Move to the next page in history', group: 'Browser', keywords: 'history next', run: () => history.forward() },
      { label: 'Reload page', detail: 'Refresh the current page', group: 'Browser', keywords: 'refresh', run: () => location.reload() },
      { label: 'Copy page link', detail: 'Copy this page’s URL', group: 'Page', keywords: 'share url clipboard', run: () => copyText(location.href) },
      { label: 'Copy page title', detail: 'Copy the current document title', group: 'Page', keywords: 'clipboard', run: () => copyText(document.title) },
      { label: 'Share page', detail: 'Open device sharing options', group: 'Page', keywords: 'send link url copy', run: sharePage },
      { label: 'Print page', detail: 'Open the browser print dialog', group: 'Page', keywords: 'save pdf', run: () => window.print() },
      { label: 'View page source', detail: 'Open this page in the portfolio repository', group: 'Open', keywords: 'github code html', href: `https://github.com/bolens/bolens.github.io/blob/main/${sourcePath || 'index.html'}` },
      { label: 'Top of page', detail: 'Return to the beginning', group: 'On this page', keywords: 'scroll home', shortcut: 'Alt T', ariaShortcut: 'Alt+T', run: () => scrollTo({ top: 0, behavior: 'smooth' }) },
      { label: 'Bottom of page', detail: 'Jump to the end of the page', group: 'On this page', keywords: 'scroll end footer', run: () => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' }) },
      { label: 'Focus main content', detail: 'Move keyboard focus past navigation', group: 'Accessibility', keywords: 'skip content', shortcut: 'Alt M', ariaShortcut: 'Alt+M', run: () => document.querySelector('main')?.focus() },
      { label: 'Command palette', detail: 'Search pages and run site actions', group: 'Command', keywords: 'shortcut search commands', shortcut: 'Alt K', ariaShortcut: 'Alt+K', run: () => openCommands() },
      { label: 'Keyboard shortcuts', detail: 'Show every available keyboard shortcut', group: 'Command', keywords: 'help hotkeys bindings', shortcut: 'Alt /', ariaShortcut: 'Alt+/', run: () => openCommands('shortcut') },
      { label: 'Choose palette', detail: 'Open color and appearance controls', group: 'Command', keywords: 'theme colors shortcut', shortcut: 'Alt P', ariaShortcut: 'Alt+P', run: pickerUi.open },
      { label: 'Cycle color palette', detail: 'Move to the next color scheme', group: 'Palette', keywords: 'next theme colors', run: runAppearance(appearance.cyclePalette) },
      ...Object.entries(palettes).map(([name, palette]) => ({ label: `Use ${palette.label} palette`, detail: 'Change the site color scheme', group: 'Palette', keywords: `${name} theme colors`, run: choosePalette(name) })),
      { label: 'Toggle day or night', detail: 'Switch between light and dark scenes', group: 'Theme', keywords: 'appearance mode', run: runAppearance(appearance.toggleTheme) },
      { label: 'Use system appearance', detail: 'Follow the device setting', group: 'Theme', keywords: 'auto light dark', run: chooseTheme('auto') },
      { label: 'Use day appearance', detail: 'Switch to the light scene', group: 'Theme', keywords: 'light', run: chooseTheme('day') },
      { label: 'Use night appearance', detail: 'Switch to the dark scene', group: 'Theme', keywords: 'dark', run: chooseTheme('night') },
      { label: 'Reset color settings', detail: `Restore ${palettes[appearance.defaultPalette].label} and system appearance`, group: 'Theme', keywords: 'default clear preferences', run: runAppearance(appearance.reset) },
    ];
    for (const command of commands) {
      command.searchText = `${command.label} ${command.detail} ${command.group} ${command.keywords ?? ''} ${command.shortcut ? `keyboard shortcut hotkey ${command.shortcut}` : ''}`.toLowerCase();
    }
    const dialog = document.createElement('dialog');
    dialog.className = 'command-palette';
    dialog.setAttribute('aria-label', 'Site search and commands');
    dialog.innerHTML = `<div class="command-search"><svg class="command-search-glyph" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="/assets/trail-glyphs.svg#glyph-search"></use></svg><input type="search" role="combobox" autocomplete="off" spellcheck="false" aria-label="Search pages and commands" aria-autocomplete="list" aria-controls="command-results" aria-expanded="false" placeholder="Search pages and commands…"><kbd>Esc</kbd></div><div class="command-results" id="command-results" role="listbox" aria-label="Results"></div><p class="command-empty" role="status" hidden>No matching trail found.</p><footer><span><kbd>↑</kbd><kbd>↓</kbd> Move</span><span><kbd>↵</kbd> Open</span></footer>`;
    document.body.append(dialog);
    const footer = document.querySelector('.site-footer');
    if (footer && !footer.querySelector('.shortcut-hint')) {
      const hint = document.createElement('span');
      hint.className = 'shortcut-hint';
      hint.innerHTML = 'Press <kbd>Alt</kbd> + <kbd>/</kbd> for shortcuts';
      footer.children[0]?.after(hint);
    }
    const input = dialog.querySelector('input');
    const results = dialog.querySelector('.command-results');
    const empty = dialog.querySelector('.command-empty');
    let visible = commands;
    let active = 0;

    const renderCommands = () => {
      const query = input.value.trim().toLowerCase();
      const terms = query.split(/\s+/).filter(Boolean);
      visible = commands.filter((command) => {
        return terms.every((term) => command.searchText.includes(term));
      });
      active = Math.min(active, Math.max(visible.length - 1, 0));
      results.innerHTML = visible.map((command, index) => `<button type="button" id="command-option-${index}" role="option" aria-selected="${index === active}"${command.ariaShortcut ? ` aria-keyshortcuts="${command.ariaShortcut}"` : ''} data-command-index="${index}"><span><b>${command.label}</b><small>${command.detail}</small></span><span class="command-meta"><i>${command.group}</i>${command.shortcut ? `<kbd>${command.shortcut}</kbd>` : ''}</span></button>`).join('');
      empty.hidden = visible.length > 0;
      if (visible.length) input.setAttribute('aria-activedescendant', `command-option-${active}`);
      else input.removeAttribute('aria-activedescendant');
      results.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
    };
    const runCommand = (command) => {
      if (!command) return;
      if (dialog.contains(document.activeElement)) document.activeElement.blur();
      dialog.close();
      if (command.run) command.run();
      else location.href = command.href;
    };
    function openCommands(query = '') {
      pickerUi.close();
      input.value = query;
      active = 0;
      renderCommands();
      dialog.showModal();
      overlay.set('commands', true);
      input.setAttribute('aria-expanded', 'true');
      input.focus();
    }
    dialog.addEventListener('close', () => {
      if (!dialog.open) {
        input.setAttribute('aria-expanded', 'false');
        if (dialog.contains(document.activeElement)) document.activeElement.blur();
      }
      overlay.set('commands', dialog.open);
    });
    input.addEventListener('input', () => { active = 0; renderCommands(); });
    results.addEventListener('pointermove', (event) => {
      const option = event.target.closest('[data-command-index]');
      if (!option) return;
      active = Number(option.dataset.commandIndex);
      renderCommands();
    });
    results.addEventListener('click', (event) => runCommand(visible[Number(event.target.closest('[data-command-index]')?.dataset.commandIndex)]));
    dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('keydown', (event) => {
      if (!['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key)) return;
      event.preventDefault();
      if (event.key === 'Enter') return runCommand(visible[active]);
      if (!visible.length) return;
      active = (active + (event.key === 'ArrowDown' ? 1 : -1) + visible.length) % visible.length;
      renderCommands();
    });

    window.addEventListener('keydown', (event) => {
      const target = event.target;
      const isEditing = target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
      const keyCode = event.code || `Key${event.key.toUpperCase()}`;
      const altShortcut = event.altKey && !event.metaKey && !event.ctrlKey && !event.shiftKey;
      const fallbackShortcut = event.ctrlKey && event.shiftKey && !event.altKey && !event.metaKey;
      if (event.key === 'Escape' && pickerUi.visible) {
        pickerUi.close();
        return;
      }
      if (isEditing) return;
      if (keyCode === 'KeyK' && (altShortcut || fallbackShortcut)) {
        event.preventDefault();
        if (dialog.open) dialog.close();
        else openCommands();
        return;
      }
      if (keyCode === 'KeyP' && (altShortcut || fallbackShortcut)) {
        event.preventDefault();
        pickerUi.toggle();
        return;
      }
      if (keyCode === 'Slash' && altShortcut) {
        event.preventDefault();
        openCommands('shortcut');
        return;
      }
      if (!altShortcut) return;
      const shortcuts = {
        KeyH: () => { location.href = '/'; },
        KeyW: () => { location.href = '/work/'; },
        KeyA: () => { location.href = '/about/'; },
        KeyT: () => scrollTo({ top: 0, behavior: 'smooth' }),
        KeyM: () => document.querySelector('main')?.focus(),
      };
      if (!shortcuts[keyCode]) return;
      event.preventDefault();
      shortcuts[keyCode]();
    }, { capture: true });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountCommands, { once: true });
  else mountCommands();
})();
