(() => {
  const glyphFor = (label, eyebrow) => {
    const section = eyebrow.closest('section, header')?.id || '';
    const text = label.toLowerCase();
    if (section === 'condition' || text === 'condition') return 'binoculars';
    if (section === 'cause' || text === 'cause') return 'map';
    if (section === 'correction' || text === 'correction') return 'switchback';
    if (section === 'confirm' || text === 'confirm') return 'summit';
    if (text.includes('selected work') || text.includes('project index')) return 'trailhead';
    if (text.includes('working set') || text === 'approach') return 'compass';
    if (text.includes('currently') || text.includes('field notes')) return 'map';
    if (text.includes('get in touch') || text.includes('follow the work')) return 'lantern';
    if (text.includes('off the clock')) return 'fire';
    if (text === 'observe') return 'binoculars';
    if (text === 'restrain') return 'cairn';
    if (text === 'recover') return 'shelter';
    if (text.includes('about')) return 'boot';
    if (text.includes('linux systems builder')) return 'pine';
    if (eyebrow.closest('.case-intro')) return 'trailhead';
    if (eyebrow.closest('.lost-copy')) return 'stars';
    return null;
  };

  document.querySelectorAll('.eyebrow').forEach((eyebrow) => {
    if (eyebrow.querySelector('.trail-glyph') || eyebrow.querySelector('.status-dot')) return;
    const name = glyphFor(eyebrow.textContent.trim(), eyebrow);
    if (!name) return;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('trail-glyph');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', `/assets/trail-glyphs.svg#glyph-${name}`);
    svg.append(use);
    eyebrow.prepend(svg);
  });

  const arrows = { '→': 'east', '↗': 'north-east', '↑': 'north', '↓': 'south' };
  document.querySelectorAll('span[aria-hidden="true"], strong[aria-hidden="true"]').forEach((marker) => {
    const direction = arrows[marker.textContent.trim()];
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
