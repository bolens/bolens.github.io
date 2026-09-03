(() => {
  const makeGlyph = (name, className = 'trail-glyph') => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add(className);
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', `/assets/trail-glyphs.svg#glyph-${name}`);
    svg.append(use);
    return svg;
  };

  const glyphFor = (label, eyebrow) => {
    const section = eyebrow.closest('section, header')?.id || '';
    const text = label.toLowerCase();
    if (section === 'condition' || text === 'condition') return 'binoculars';
    if (section === 'cause' || text === 'cause') return 'map';
    if (section === 'correction' || text === 'correction') return 'switchback';
    if (section === 'confirm' || text === 'confirm') return 'summit';
    if (text.includes('selected work') || text.includes('project index')) return 'trailhead';
    if (text.includes('working set') || text === 'approach') return 'compass';
    if (text.includes('currently')) return 'clock';
    if (text.includes('field notes')) return 'journal';
    if (text.includes('get in touch')) return 'radio';
    if (text.includes('follow the work')) return 'repository';
    if (text.includes('off the clock')) return 'owl';
    if (text === 'observe') return 'binoculars';
    if (text === 'restrain') return 'cairn';
    if (text === 'recover') return 'shelter';
    if (text.includes('about')) return 'backpack';
    if (text.includes('linux systems builder')) return 'pine';
    if (eyebrow.closest('.case-intro')) {
      if (text.includes('infrastructure')) return 'globe';
      if (text.includes('security')) return 'shield';
      if (text.includes('desktop')) return 'microphone';
      if (text.includes('gaming')) return 'command';
      if (text.includes('steam')) return 'wrench';
      return 'trailhead';
    }
    if (eyebrow.closest('.lost-copy')) return 'stars';
    return null;
  };

  document.querySelectorAll('.eyebrow').forEach((eyebrow) => {
    if (eyebrow.querySelector('.trail-glyph') || eyebrow.querySelector('.status-dot')) return;
    const name = glyphFor(eyebrow.textContent.trim(), eyebrow);
    if (!name) return;
    eyebrow.prepend(makeGlyph(name));
  });

  const factGlyphs = { role: 'role', interfaces: 'network', modes: 'sort', coverage: 'layers', pipeline: 'layers', project: 'repository' };
  document.querySelectorAll('.case-facts dt').forEach((term) => {
    const name = factGlyphs[term.textContent.trim().toLowerCase()];
    if (name) term.prepend(makeGlyph(name, 'fact-glyph'));
  });

  const fieldGlyphs = ['pine', 'compass', 'fire'];
  document.querySelectorAll('.about-field-notes dt').forEach((term, index) => {
    if (fieldGlyphs[index]) term.prepend(makeGlyph(fieldGlyphs[index], 'field-note-glyph'));
  });

  const detailGlyphs = { systems: 'hard-drive', languages: 'code', operations: 'wrench' };
  document.querySelectorAll('.toolbox dt').forEach((term) => {
    const name = detailGlyphs[term.textContent.trim().toLowerCase()];
    if (name) term.prepend(makeGlyph(name, 'detail-glyph'));
  });

  const projectGlyphs = {
    uddns: 'cloud',
    'aur response toolkit': 'shield',
    'launch layer': 'terminal',
    'millennium helpers': 'wrench',
    'privacy devices': 'lock',
    'p2p services': 'network',
    'app drawer': 'package',
    'multi-monitor workspaces': 'monitor',
  };
  document.querySelectorAll('.index-list>a[data-project-name]').forEach((project) => {
    const name = projectGlyphs[project.dataset.projectName];
    if (name) project.prepend(makeGlyph(name, 'project-glyph'));
  });

  const controlGlyphs = { 'name or keyword': 'search', language: 'code', 'project type': 'filter', 'sort by': 'sort' };
  document.querySelectorAll('.work-controls label>span').forEach((label) => {
    const name = controlGlyphs[label.textContent.trim().toLowerCase()];
    if (name) label.prepend(makeGlyph(name, 'control-glyph'));
  });
  const reset = document.querySelector('.work-reset');
  if (reset) reset.prepend(makeGlyph('refresh', 'control-glyph'));

  const arrows = { '→': 'east', '↗': 'north-east', '↑': 'north', '↖': 'north-west', '←': 'west', '↙': 'south-west', '↓': 'south', '↘': 'south-east' };
  document.querySelectorAll('span[aria-hidden="true"], strong[aria-hidden="true"]').forEach((marker) => {
    const direction = marker.closest('.index-list') ? 'east' : arrows[marker.textContent.trim()];
    if (!direction) return;
    marker.textContent = '';
    marker.classList.add('trail-arrow');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('focusable', 'false');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', `/assets/trail-glyphs.svg#glyph-arrow-${direction}`);
    svg.append(use);
    marker.append(svg);
  });

  document.querySelectorAll('.principles li').forEach((item) => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('principle-glyph');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '/assets/trail-glyphs.svg#glyph-waypoint');
    svg.append(use);
    item.prepend(svg);
  });
})();
