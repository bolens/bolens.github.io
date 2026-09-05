import { existsSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const projects = JSON.parse(readFileSync(resolve(root, 'data/projects.json'), 'utf8'));
const themes = JSON.parse(readFileSync(resolve(root, 'data/themes.json'), 'utf8'));
const caseStudies = projects.filter((project) => project.slug);
const check = process.argv.includes('--check');

const names = new Set();
const slugs = new Set();
for (const project of projects) {
  for (const field of ['name', 'summary', 'status', 'tech', 'repository']) {
    if (!project[field]) throw new Error(`data/projects.json: ${project.name ?? 'project'} is missing ${field}`);
  }
  if (names.has(project.name)) throw new Error(`data/projects.json: duplicate project name ${project.name}`);
  names.add(project.name);
  if (project.slug && slugs.has(project.slug)) throw new Error(`data/projects.json: duplicate case-study slug ${project.slug}`);
  if (project.slug) slugs.add(project.slug);
}

const outputs = new Map();
const colorPattern = /^#[0-9a-f]{6}$/i;
const paletteEntries = Object.entries(themes.palettes);
if (!themes.palettes[themes.defaultPalette]) throw new Error('data/themes.json: defaultPalette must name a palette');
if (JSON.stringify(themes.modes) !== JSON.stringify(['auto', 'day', 'night'])) throw new Error('data/themes.json: modes must be auto, day, and night');
const weatherModes = ['clear', 'cloudy', 'overcast', 'rainy', 'wet', 'dry', 'snowy', 'drought', 'windy'];
if (JSON.stringify(themes.weatherModes) !== JSON.stringify(weatherModes)) throw new Error(`data/themes.json: weatherModes must be ${weatherModes.join(', ')}`);
const timeModes = ['day', 'night', 'morning', 'evening', 'twilight'];
if (JSON.stringify(themes.timeModes) !== JSON.stringify(timeModes)) throw new Error(`data/themes.json: timeModes must be ${timeModes.join(', ')}`);
const requiredTokens = Object.keys(themes.palettes[themes.defaultPalette].day);
for (const [name, palette] of paletteEntries) {
  if (!/^[a-z][a-z0-9-]*$/.test(name)) throw new Error(`data/themes.json: invalid palette ID ${name}`);
  if (!palette.label) throw new Error(`data/themes.json: ${name} is missing a label`);
  if (!weatherModes.includes(palette.weather)) throw new Error(`data/themes.json: ${name}.weather must name a supported weather mode`);
  for (const mode of ['day', 'night']) {
    for (const token of requiredTokens) {
      if (!colorPattern.test(palette[mode]?.[token] ?? '')) throw new Error(`data/themes.json: ${name}.${mode}.${token} must be a six-digit hex color`);
    }
  }
  for (const [token, value] of Object.entries(palette.scene404 ?? {})) {
    if (!token.startsWith('lost-') || !colorPattern.test(value)) throw new Error(`data/themes.json: ${name}.scene404.${token} must be a lost-* token with a six-digit hex color`);
  }
}
const declarations = (tokens) => Object.entries(tokens).map(([token, value]) => `--${token}:${value}`).join(';');
const defaultTheme = themes.palettes[themes.defaultPalette];
const previewTokens = { paper: 'paper', ink: 'ink', accent: 'copper', terrain: 'lichen', water: 'art-cool' };
const previewDeclarations = (palette) => Object.entries(previewTokens).flatMap(([preview, token]) => [
  `--option-${preview}:${palette.day[token]}`,
  `--option-night-${preview}:${palette.night[token]}`,
]).join(';');
const themeCss = [
  '/* Generated from data/themes.json by scripts/build-site.mjs. */',
  `:root{${declarations(defaultTheme.day)}}`,
  ...paletteEntries.map(([name, palette]) => `:root[data-palette="${name}"]{${declarations(palette.day)}}`),
  ...paletteEntries.map(([name, palette]) => `[data-palette-option="${name}"]{${previewDeclarations(palette)}}`),
  ':root[data-theme="night"] [data-palette-option]{--option-paper:var(--option-night-paper);--option-ink:var(--option-night-ink);--option-accent:var(--option-night-accent);--option-terrain:var(--option-night-terrain);--option-water:var(--option-night-water)}',
  '@media (prefers-color-scheme:dark){',
  ':root:not([data-theme]) [data-palette-option]{--option-paper:var(--option-night-paper);--option-ink:var(--option-night-ink);--option-accent:var(--option-night-accent);--option-terrain:var(--option-night-terrain);--option-water:var(--option-night-water)}',
  `:root:not([data-theme]){${declarations(defaultTheme.night)}}`,
  ...paletteEntries.map(([name, palette]) => `:root[data-palette="${name}"]:not([data-theme]){${declarations(palette.night)}}`),
  '}',
  `:root[data-theme="night"]{${declarations(defaultTheme.night)}}`,
  ...paletteEntries.map(([name, palette]) => `:root[data-palette="${name}"][data-theme="night"]{${declarations(palette.night)}}`),
  ...paletteEntries.filter(([, palette]) => palette.scene404).map(([name, palette]) => `:root[data-palette="${name}"] .lost-page{${declarations(palette.scene404)}}`),
  '',
].join('\n');
outputs.set('assets/theme-tokens.css', themeCss);
outputs.set('assets/theme-data.js', `window.portfolioThemeData=${JSON.stringify({ defaultPalette: themes.defaultPalette, modes: themes.modes, weatherModes: themes.weatherModes, timeModes: themes.timeModes, palettes: Object.fromEntries(paletteEntries.map(([name, palette]) => [name, { label: palette.label, light: palette.day.paper, dark: palette.night.paper, weather: palette.weather }])) })};\n`);
const themeMeta = `<meta name="theme-color" content="${defaultTheme.day.paper}" media="(prefers-color-scheme: light)"><meta name="theme-color" content="${defaultTheme.night.paper}" media="(prefers-color-scheme: dark)">`;
const syncThemeMeta = (source) => source.replace(/<meta name="theme-color"[^>]*>(?:\s*<meta name="theme-color"[^>]*>)?/, themeMeta);
const loadingBootstrap = '<script>document.documentElement.classList.add("is-loading")</script>';
const runtimeScripts = `${loadingBootstrap}<script src="/assets/theme-data.js"></script><script src="/assets/appearance-controller.js"></script><script src="/assets/project-data.js" defer></script><script src="/assets/ui-overlay.js" defer></script><script src="/assets/appearance-picker.js" defer></script><script src="/assets/command-palette.js" defer></script><script src="/assets/loading-state.js" defer></script>`;
const sceneStateScripts = '<script src="/assets/404-weather.js"></script><script src="/assets/404-time.js"></script>';
const syncRuntimeScripts = (source) => {
  const scripts = source.includes('/assets/404-scene.js')
    ? runtimeScripts.replace('<script src="/assets/project-data.js"', `${sceneStateScripts}<script src="/assets/project-data.js"`)
    : runtimeScripts;
  return source.replace(/(?:<script>document\.documentElement\.classList\.add\("is-loading"\)<\/script>)?<script src="\/assets\/theme-data\.js"><\/script>[\s\S]*?<script src="\/assets\/command-palette\.js" defer><\/script>(?:<script src="\/assets\/loading-state\.js" defer><\/script>)?/, scripts);
};
outputs.set('404.html', syncRuntimeScripts(syncThemeMeta(readFileSync(resolve(root, '404.html'), 'utf8'))));
const browserData = caseStudies.map(({ name, caseLabel, slug, commandDetail, site, repository }) => ({ name, caseLabel, slug, commandDetail, ...(site ? { site } : {}), repository }));
outputs.set('assets/project-data.js', `window.portfolioProjects=${JSON.stringify(browserData)};\n`);

const portfolioUrls = ['https://bolens.github.io/', 'https://bolens.github.io/work/', 'https://bolens.github.io/about/', ...caseStudies.map(({ slug }) => `https://bolens.github.io/case-studies/${slug}/`)];
outputs.set('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${portfolioUrls.map((url) => `<url><loc>${url}</loc></url>`).join('')}</urlset>\n`);
outputs.set('llms.txt', `# Michael Bolens\n\nMichael Bolens builds open-source Linux and infrastructure tools that expose system state, bound failures, and provide clear recovery paths.\n\n## Portfolio\n\n- Home: ${portfolioUrls[0]}\n- Work index: ${portfolioUrls[1]}\n- About: ${portfolioUrls[2]}\n\n## Case studies\n\n${caseStudies.map(({ name, slug }) => `- ${name}: https://bolens.github.io/case-studies/${slug}/`).join('\n')}\n\n## Source repositories\n\n- Portfolio: https://github.com/bolens/bolens.github.io\n${projects.map(({ name, repository }) => `- ${name}: ${repository}`).join('\n')}\n\n## Contact\n\n- GitHub: https://github.com/bolens\n`);

const workPath = resolve(root, 'work/index.html');
let work = readFileSync(workPath, 'utf8');
const itemList = projects.map((project, index) => ({
  '@type': 'ListItem',
  position: index + 1,
  url: project.slug ? `https://bolens.github.io/case-studies/${project.slug}/` : project.repository,
  name: project.name,
}));
const collectionJson = JSON.stringify({ '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Work by Michael Bolens', url: 'https://bolens.github.io/work/', mainEntity: { '@type': 'ItemList', numberOfItems: projects.length, itemListElement: itemList } });
work = work.replace(/<script type="application\/ld\+json">[^<]+<\/script>/, `<script type="application/ld+json">${collectionJson}</script>`);
const cards = projects.map((project) => {
  const href = project.slug ? `../case-studies/${project.slug}/` : project.repository;
  const kind = project.slug ? 'Case study' : 'Repository';
  const arrow = project.slug ? '→' : '↗';
  return `      <a href="${href}" data-project-name="${project.name.toLowerCase()}" data-project-languages="${project.tech}" data-project-kind="${kind.toLowerCase()}" data-project-repository="${project.repository}"><span><b>${project.name}</b><small>${project.summary}</small><em>${project.status} · ${kind}</em><time class="project-updated" aria-hidden="true">Updated date pending</time></span><i>${project.tech}</i><strong aria-hidden="true">${arrow}</strong></a>`;
}).join('\n');
outputs.set('work/index.html', work.replace(/<!-- projects:start -->[\s\S]*?<!-- projects:end -->/, `<!-- projects:start --><div class="index-list" id="project-list" data-reveal>\n${cards}\n    </div><!-- projects:end -->`));

const pages = [
  ['index.html', '', '', '#selected-work', 'about/', '#main', 'Back to top', '↑'],
  ['work/index.html', '../', 'work', './', '../about/', '../', 'Home', '→'],
  ['about/index.html', '../', 'about', '../#selected-work', './', '../', 'Home', '→'],
  ...caseStudies.map(({ slug }) => [`case-studies/${slug}/index.html`, '../../', 'work', '../../work/', '../../about/', '../../work/', 'All work', '→']),
];
const mark = '<svg class="brand-mark" viewBox="0 0 48 48" aria-hidden="true"><path class="brand-mark-frame" d="M7 6h27l8 8v28H15l-8-8Z"/><path class="brand-mark-route" d="M14 33h10V15h11M24 33h11v-9"/><circle class="brand-mark-node" cx="24" cy="33" r="3.2"/></svg>';
for (const [relativePath, prefix, current, workHref, aboutHref, footerHref, footerLabel, footerArrow] of pages) {
  let pageSource = outputs.get(relativePath) ?? readFileSync(resolve(root, relativePath), 'utf8');
  if (relativePath === 'index.html') {
    const speculation = JSON.stringify({ prefetch: [{ source: 'list', urls: ['/work/', '/about/', ...caseStudies.map(({ slug }) => `/case-studies/${slug}/`)], eagerness: 'conservative' }] });
    pageSource = pageSource.replace(/<script type="speculationrules">[^<]+<\/script>/, `<script type="speculationrules">${speculation}</script>`);
  }
  const source = syncRuntimeScripts(syncThemeMeta(pageSource))
    .replace(/<link rel="stylesheet" href="(?:\.\.\/)*assets\/(?:pages|about|work|case-study)\.css">/g, '');
  const routeStyles = relativePath === 'index.html' ? [] : [
    `${prefix}assets/pages.css`,
    ...(relativePath === 'about/index.html' ? [`${prefix}assets/about.css`] : []),
    ...(relativePath === 'work/index.html' ? [`${prefix}assets/work.css`] : []),
    ...(relativePath.startsWith('case-studies/') ? [`${prefix}assets/case-study.css`] : []),
  ];
  const routeLinks = routeStyles.map((href) => `<link rel="stylesheet" href="${href}">`).join('');
  const header = `<header class="site-header wrap"><a class="wordmark" href="${prefix || './'}" aria-label="Michael Bolens, home">${mark}<span class="wordmark-copy"><b>Michael Bolens</b><small>Systems builder</small></span></a><nav aria-label="Primary navigation"><a${current === 'work' ? ' aria-current="page"' : ''} href="${workHref}">Work</a><a${current === 'about' ? ' aria-current="page"' : ''} href="${aboutHref}">About</a><a class="nav-cta" rel="me" href="https://github.com/bolens">GitHub <span aria-hidden="true">↗</span></a></nav></header>`;
  const footer = `<footer class="site-footer wrap"><p>Michael Bolens</p><a href="${footerHref}">${footerLabel} <span aria-hidden="true">${footerArrow}</span></a></footer>`;
  outputs.set(relativePath, source
    .replace(new RegExp(`<link rel="stylesheet" href="${prefix}assets/theme-tokens\\.css">`, 'g'), '')
    .replace(`<link rel="stylesheet" href="${prefix}assets/site.css">`, `<link rel="stylesheet" href="${prefix}assets/theme-tokens.css">${routeLinks}<link rel="stylesheet" href="${prefix}assets/site.css">`)
    .replace('<script src="/assets/project-data.js"></script>', '')
    .replace(/<header class="site-header wrap">[\s\S]*?<\/header>/, header)
    .replace(/<footer class="site-footer wrap">[\s\S]*?<\/footer>/, footer));
}

let writeSequence = 0;
const writeAtomically = (path, content) => {
  const temporary = `${path}.${process.pid}.${++writeSequence}.tmp`;
  try {
    writeFileSync(temporary, content);
    renameSync(temporary, path);
  } finally {
    rmSync(temporary, { force: true });
  }
};

let stale = false;
for (const [relativePath, content] of outputs) {
  const path = resolve(root, relativePath);
  if (existsSync(path) && readFileSync(path, 'utf8') === content) continue;
  if (check) {
    console.error(`${relativePath} is stale; run node scripts/build-site.mjs`);
    stale = true;
  } else {
    writeAtomically(path, content);
    console.log(`Generated ${relativePath}`);
  }
}
if (stale) process.exit(1);
