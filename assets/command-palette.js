(() => {
  const appearance = window.portfolioAppearance;
  const pickerUi = window.portfolioAppearancePicker;
  const overlay = window.portfolioOverlay;
  if (!appearance || !pickerUi || !overlay) return;
  const { palettes } = appearance;

  const mountCommands = () => {
    let announce = () => {};
    const runAppearance = (action) => () => { action(); pickerUi.announce(); };
    const choosePalette = (name) => runAppearance(() => appearance.setPalette(name));
    const chooseTheme = (mode) => runAppearance(() => appearance.setTheme(mode));
    const copyText = (value, message = 'Copied to clipboard.') => navigator.clipboard?.writeText(value).then(() => announce(message)).catch(() => announce('Clipboard access was unavailable.'));
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
    const projects = window.portfolioProjects ?? [];
    const currentProjectIndex = projects.findIndex((project) => location.pathname.includes(`/case-studies/${project.slug}/`));
    const currentProject = projects[currentProjectIndex];
    const previousProject = currentProjectIndex > 0 ? projects[currentProjectIndex - 1] : null;
    const nextProject = currentProjectIndex >= 0 && currentProjectIndex < projects.length - 1 ? projects[currentProjectIndex + 1] : null;
    const currentSectionId = () => document.querySelector('.case-route [aria-current="location"]')?.getAttribute('href')?.slice(1) || location.hash.slice(1) || pageSections[0]?.[0];
    const moveSection = (offset) => () => {
      const index = Math.max(0, pageSections.findIndex(([id]) => id === currentSectionId()));
      const next = pageSections[(index + offset + pageSections.length) % pageSections.length];
      if (next) location.hash = next[0];
    };
    const copySectionLink = () => {
      const url = new URL(location.href);
      const section = currentSectionId();
      if (section) url.hash = section;
      return copyText(url.href, 'Section link copied.');
    };
    const emailLink = document.querySelector('a[href^="mailto:"]')?.href;
    const resumeLink = [...document.querySelectorAll('a[href]')].find((link) => /resume|résumé/i.test(`${link.textContent} ${link.getAttribute('href')}`))?.href;
    const commands = [
      { label: 'Home', detail: 'Portfolio overview', group: 'Go to', href: '/', shortcut: 'Alt H', ariaShortcut: 'Alt+H' },
      { label: 'Selected work', detail: 'Featured projects', group: 'Go to', href: '/#selected-work', shortcut: 'Alt S', ariaShortcut: 'Alt+S' },
      { label: 'Toolbox', detail: 'Languages, systems, and interfaces', group: 'Go to', href: '/#toolbox' },
      { label: 'Currently', detail: 'What Michael is working on now', group: 'Go to', href: '/#currently' },
      { label: 'Contact', detail: 'Connect with Michael on GitHub', group: 'Go to', href: '/#contact', shortcut: 'Alt C', ariaShortcut: 'Alt+C' },
      { label: 'Off the clock', detail: 'Interests beyond the terminal', group: 'Go to', href: '/#off-the-clock' },
      { label: 'All work', detail: 'Project index', group: 'Go to', href: '/work/', shortcut: 'Alt W', ariaShortcut: 'Alt+W' },
      { label: 'About Michael', detail: 'Approach, principles, and interests', group: 'Go to', href: '/about/', shortcut: 'Alt A', ariaShortcut: 'Alt+A' },
      ...pageSections.map(([id, label, detail]) => ({ label, detail, group: 'On this page', href: `#${id}`, keywords: `case study section ${id}` })),
      ...projects.flatMap((project) => [
        { label: project.caseLabel, detail: project.commandDetail, group: 'Case study', href: `/case-studies/${project.slug}/` },
        ...(project.site ? [{ label: `${project.name} project site`, detail: 'Documentation and installation', group: 'Open', href: project.site }] : []),
        { label: `${project.name} repository`, detail: 'Source on GitHub', group: 'Open', href: project.repository },
      ]),
      { label: 'GitHub profile', detail: 'All repositories', group: 'Open', href: 'https://github.com/bolens' },
      ...(currentProject ? [
        ...(nextProject ? [{ label: 'Next project', detail: nextProject.name, group: 'This case study', href: `/case-studies/${nextProject.slug}/`, shortcut: 'Alt J / Alt N', ariaShortcut: 'Alt+J Alt+N', priority: -20 }]
          : []),
        ...(previousProject ? [{ label: 'Previous project', detail: previousProject.name, group: 'This case study', href: `/case-studies/${previousProject.slug}/`, shortcut: 'Alt Shift J / N', ariaShortcut: 'Alt+Shift+J Alt+Shift+N', priority: -19 }] : []),
        { label: 'Next case-study section', detail: 'Move forward in this case study', group: 'This case study', run: moveSection(1), priority: -18 },
        { label: 'Previous case-study section', detail: 'Move back in this case study', group: 'This case study', run: moveSection(-1), priority: -17 },
        { label: 'Copy link to current section', detail: 'Copy a direct link to this part', group: 'This case study', run: copySectionLink, priority: -16 },
        { label: 'Copy current repository URL', detail: currentProject.repository, group: 'This case study', run: () => copyText(currentProject.repository, 'Repository URL copied.'), priority: -15 },
        ...(nextProject ? [{ label: 'Open next project repository', detail: nextProject.repository, group: 'This case study', href: nextProject.repository, priority: -14 }] : []),
        { label: 'Return to project index', detail: 'Browse all selected work', group: 'This case study', href: '/work/', priority: -13 },
      ] : []),
      ...(emailLink ? [{ label: 'Email Michael', detail: 'Open your email application', group: 'Contact', href: emailLink }] : []),
      ...(resumeLink ? [{ label: 'Download résumé', detail: 'Open Michael’s résumé', group: 'Open', href: resumeLink }] : []),
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
      { label: 'Keyboard shortcuts', detail: 'Show every available keyboard shortcut', group: 'Command', keywords: 'help hotkeys bindings', shortcut: 'Alt /', ariaShortcut: 'Alt+/', run: () => openShortcuts(commandReturnFocus) },
      { label: 'Choose palette', detail: 'Open color and appearance controls', group: 'Command', keywords: 'theme colors shortcut', shortcut: 'Alt P', ariaShortcut: 'Alt+P', run: pickerUi.open },
      { label: 'Cycle color palette', detail: 'Move to the next color scheme', group: 'Palette', keywords: 'next theme colors', run: runAppearance(appearance.cyclePalette) },
      ...Object.entries(palettes).map(([name, palette]) => ({ label: `Use ${palette.label} palette`, detail: 'Change the site color scheme', group: 'Palette', keywords: `${name} theme colors`, run: choosePalette(name) })),
      { label: 'Toggle day or night', detail: 'Switch between light and dark scenes', group: 'Theme', keywords: 'appearance mode', run: runAppearance(appearance.toggleTheme) },
      { label: 'Toggle reduced motion', detail: 'Switch between reduced and system motion', group: 'Accessibility', keywords: 'animation movement preference', run: () => { const state = appearance.toggleMotion(); announce(state.motion === 'reduced' ? 'Reduced motion enabled.' : 'Using the system motion preference.'); } },
      { label: 'Use system appearance', detail: 'Follow the device setting', group: 'Theme', keywords: 'auto light dark', run: chooseTheme('auto') },
      { label: 'Use day appearance', detail: 'Switch to the light scene', group: 'Theme', keywords: 'light', run: chooseTheme('day') },
      { label: 'Use night appearance', detail: 'Switch to the dark scene', group: 'Theme', keywords: 'dark', run: chooseTheme('night') },
      { label: 'Reset all site preferences', detail: `Restore ${palettes[appearance.defaultPalette].label}, system appearance, and system motion`, group: 'Theme', keywords: 'default clear settings preferences', run: () => { appearance.reset(); recentLabels = []; try { localStorage.removeItem('portfolio-recent-commands'); } catch {} pickerUi.announce(); } },
    ];
    for (const command of commands) {
      command.searchText = `${command.label} ${command.detail} ${command.group} ${command.keywords ?? ''} ${command.shortcut ? `keyboard shortcut hotkey ${command.shortcut}` : ''}`.toLowerCase();
    }
    const dialog = document.createElement('dialog');
    dialog.className = 'command-palette';
    dialog.setAttribute('aria-label', 'Site search and commands');
    dialog.innerHTML = `<div class="command-search"><svg class="command-search-glyph" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="/assets/trail-glyphs.svg#glyph-search"></use></svg><input type="search" role="combobox" autocomplete="off" spellcheck="false" aria-label="Search pages and commands" aria-autocomplete="list" aria-controls="command-results" aria-expanded="false" placeholder="Search pages and commands…"><kbd>Esc</kbd></div><div class="command-results" id="command-results" role="listbox" aria-label="Results"></div><p class="command-empty" role="status" hidden>No matching trail found.</p><footer><span><kbd>↑</kbd><kbd>↓</kbd> Move</span><span><kbd>↵</kbd> Open</span><span><kbd>Home</kbd><kbd>End</kbd> Jump</span></footer>`;
    document.body.append(dialog);
    const status = document.createElement('p');
    status.className = 'command-status visually-hidden';
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-atomic', 'true');
    document.body.append(status);
    announce = (message) => { status.textContent = ''; requestAnimationFrame(() => { status.textContent = message; }); };
    const shortcutCommands = commands.filter((command) => command.ariaShortcut);
    const shortcutDialog = document.createElement('dialog');
    shortcutDialog.className = 'shortcut-overlay';
    shortcutDialog.setAttribute('aria-labelledby', 'shortcut-overlay-title');
    shortcutDialog.innerHTML = `<header><div><p>Quick reference</p><h2 id="shortcut-overlay-title">Keyboard shortcuts</h2></div><button type="button" aria-label="Close keyboard shortcuts">Close</button></header><table><thead><tr><th scope="col">Action</th><th scope="col">Shortcut</th></tr></thead><tbody>${shortcutCommands.map((command) => `<tr><th scope="row">${command.label}</th><td><kbd>${command.shortcut}</kbd></td></tr>`).join('')}</tbody></table><footer>Press <kbd>Esc</kbd> to close</footer>`;
    document.body.append(shortcutDialog);
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
    let commandReturnFocus = null;
    let shortcutReturnFocus = null;
    let recentLabels = [];
    try {
      const saved = JSON.parse(localStorage.getItem('portfolio-recent-commands') ?? '[]');
      if (Array.isArray(saved)) recentLabels = saved.filter((label) => typeof label === 'string').slice(0, 5);
    } catch {}
    const canRestoreFocus = (element) => element instanceof HTMLElement && element !== document.body && element !== document.documentElement && element.isConnected;
    const recordRecent = (command) => {
      recentLabels = [command.label, ...recentLabels.filter((label) => label !== command.label)].slice(0, 5);
      try { localStorage.setItem('portfolio-recent-commands', JSON.stringify(recentLabels)); } catch {}
    };

    const escapeHtml = (value) => value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
    const fuzzyPositions = (text, query) => {
      const positions = [];
      let cursor = 0;
      for (const character of query.toLowerCase().replace(/\s+/g, '')) {
        cursor = text.toLowerCase().indexOf(character, cursor);
        if (cursor < 0) return null;
        positions.push(cursor++);
      }
      return positions;
    };
    const matchScore = (command, terms) => terms.reduce((score, term) => {
      const label = command.label.toLowerCase();
      if (label.includes(term)) return score + label.indexOf(term);
      const labelPositions = fuzzyPositions(label, term);
      const labelSpan = labelPositions ? labelPositions.at(-1) - labelPositions[0] + 1 : Infinity;
      if (term.length >= 3 && labelSpan <= term.length * 2) return score + 20 + labelSpan;
      if (command.searchText.includes(term)) return score + 100 + command.searchText.indexOf(term);
      const searchPositions = fuzzyPositions(command.searchText, term);
      const searchSpan = searchPositions ? searchPositions.at(-1) - searchPositions[0] + 1 : Infinity;
      return term.length >= 3 && searchSpan <= term.length * 2 ? score + 200 + searchSpan : Infinity;
    }, 0);
    const highlight = (label, query) => {
      const positions = fuzzyPositions(label, query);
      if (!positions?.length) return escapeHtml(label);
      const selected = new Set(positions);
      return [...label].map((character, index) => selected.has(index) ? `<mark>${escapeHtml(character)}</mark>` : escapeHtml(character)).join('');
    };

    const renderCommands = () => {
      const rawQuery = input.value.trim();
      const scope = rawQuery[0] === '>' ? 'actions' : rawQuery[0] === '@' ? 'projects' : 'all';
      const query = scope === 'all' ? rawQuery.toLowerCase() : rawQuery.slice(1).trim().toLowerCase();
      const terms = query.split(/\s+/).filter(Boolean);
      const navigationGroups = new Set(['Go to', 'On this page', 'Case study', 'Open']);
      const projectGroups = new Set(['Case study', 'This case study']);
      visible = commands.filter((command) => {
        if (scope === 'actions' && navigationGroups.has(command.group)) return false;
        if (scope === 'projects' && !projectGroups.has(command.group) && !/project|repository/i.test(command.label)) return false;
        return Number.isFinite(matchScore(command, terms));
      }).sort((left, right) => terms.length ? matchScore(left, terms) - matchScore(right, terms) : (left.priority ?? 0) - (right.priority ?? 0));
      if (!terms.length && scope === 'all' && recentLabels.length) {
        const recent = recentLabels.map((label) => visible.find((command) => command.label === label)).filter((command) => command && (command.priority ?? 0) >= 0);
        visible = [...visible.filter((command) => (command.priority ?? 0) < 0), ...recent.map((command) => ({ ...command, renderGroup: 'Recent' })), ...visible.filter((command) => (command.priority ?? 0) >= 0 && !recent.includes(command))];
      }
      active = Math.min(active, Math.max(visible.length - 1, 0));
      let group = '';
      results.innerHTML = visible.map((command, index) => {
        const displayGroup = command.renderGroup ?? command.group;
        const heading = displayGroup === group ? '' : `<p class="command-group" role="presentation">${escapeHtml(displayGroup)}</p>`;
        group = displayGroup;
        const external = /^https?:/.test(command.href ?? '');
        return `${heading}<button type="button" id="command-option-${index}" role="option" aria-selected="${index === active}"${command.ariaShortcut ? ` aria-keyshortcuts="${command.ariaShortcut}"` : ''} data-command-index="${index}"><span><b>${highlight(command.label, query)}</b><small>${escapeHtml(command.detail)}${external ? ' <span aria-hidden="true">↗</span><span class="visually-hidden"> (opens an external site)</span>' : ''}</small></span><span class="command-meta"><i>${escapeHtml(command.group)}</i>${command.shortcut ? `<kbd>${escapeHtml(command.shortcut)}</kbd>` : ''}</span></button>`;
      }).join('');
      empty.hidden = visible.length > 0;
      if (visible.length) input.setAttribute('aria-activedescendant', `command-option-${active}`);
      else input.removeAttribute('aria-activedescendant');
      results.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
    };
    const runCommand = (command) => {
      if (!command) return;
      recordRecent(command);
      if (dialog.contains(document.activeElement)) document.activeElement.blur();
      dialog.close();
      if (command.run) command.run();
      else location.href = command.href;
    };
    function openCommands(query = '') {
      const scrollPosition = scrollY;
      pickerUi.close();
      if (shortcutDialog.open) shortcutDialog.close();
      if (!dialog.open) commandReturnFocus = document.activeElement;
      input.value = query;
      active = 0;
      renderCommands();
      dialog.showModal();
      overlay.set('commands', true);
      input.setAttribute('aria-expanded', 'true');
      input.focus({ preventScroll: true });
      scrollTo({ top: scrollPosition });
    }
    function openShortcuts(returnTarget = document.activeElement) {
      const scrollPosition = scrollY;
      pickerUi.close();
      if (dialog.open) dialog.close();
      shortcutReturnFocus = returnTarget;
      if (!shortcutDialog.open) shortcutDialog.showModal();
      shortcutDialog.querySelector('button').focus({ preventScroll: true });
      scrollTo({ top: scrollPosition });
      overlay.set('shortcuts', true);
    }
    dialog.addEventListener('close', () => {
      if (!dialog.open) {
        input.setAttribute('aria-expanded', 'false');
        if (dialog.contains(document.activeElement)) document.activeElement.blur();
      }
      overlay.set('commands', dialog.open);
      if (!dialog.open && canRestoreFocus(commandReturnFocus) && !shortcutDialog.open) commandReturnFocus.focus();
      if (!dialog.open && !shortcutDialog.open) commandReturnFocus = null;
    });
    shortcutDialog.querySelector('button').addEventListener('click', () => shortcutDialog.close());
    shortcutDialog.addEventListener('click', (event) => { if (event.target === shortcutDialog) shortcutDialog.close(); });
    shortcutDialog.addEventListener('close', () => {
      overlay.set('shortcuts', false);
      if (canRestoreFocus(shortcutReturnFocus)) shortcutReturnFocus.focus();
      shortcutReturnFocus = null;
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
      if (!['ArrowDown', 'ArrowUp', 'Enter', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      if (event.key === 'Enter') return runCommand(visible[active]);
      if (!visible.length) return;
      if (event.key === 'Home' || event.key === 'End') active = event.key === 'Home' ? 0 : visible.length - 1;
      else active = (active + (event.key === 'ArrowDown' ? 1 : -1) + visible.length) % visible.length;
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
      if (keyCode === 'Slash' && !event.altKey && !event.metaKey && !event.ctrlKey && !event.shiftKey) {
        event.preventDefault();
        openCommands();
        return;
      }
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
        if (shortcutDialog.open) shortcutDialog.close();
        else openShortcuts();
        return;
      }
      if (!altShortcut) return;
      const shortcuts = {
        KeyH: () => { location.href = '/'; },
        KeyW: () => { location.href = '/work/'; },
        KeyA: () => { location.href = '/about/'; },
        KeyS: () => { location.href = '/#selected-work'; },
        KeyC: () => { location.href = '/#contact'; },
        KeyJ: () => { if (nextProject) location.href = `/case-studies/${nextProject.slug}/`; },
        KeyN: () => { if (nextProject) location.href = `/case-studies/${nextProject.slug}/`; },
        KeyT: () => scrollTo({ top: 0, behavior: 'smooth' }),
        KeyM: () => document.querySelector('main')?.focus(),
      };
      if (!shortcuts[keyCode]) return;
      event.preventDefault();
      shortcuts[keyCode]();
    }, { capture: true });

    window.addEventListener('keydown', (event) => {
      if (!event.altKey || !event.shiftKey || event.ctrlKey || event.metaKey || !['KeyJ', 'KeyN'].includes(event.code)) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      if (!previousProject) return;
      event.preventDefault();
      location.href = `/case-studies/${previousProject.slug}/`;
    }, { capture: true });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountCommands, { once: true });
  else mountCommands();
})();
