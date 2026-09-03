import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const projects = JSON.parse(readFileSync(resolve(root, 'data/projects.json'), 'utf8'));
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
  return `      <a href="${href}"><span><b>${project.name}</b><small>${project.summary}</small><em>${project.status} · ${kind}</em></span><i>${project.tech}</i><strong aria-hidden="true">${arrow}</strong></a>`;
}).join('\n');
outputs.set('work/index.html', work.replace(/<!-- projects:start -->[\s\S]*?<!-- projects:end -->/, `<!-- projects:start --><div class="index-list" data-reveal>\n${cards}\n    </div><!-- projects:end -->`));

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
  const source = pageSource
    .replace(/<link rel="stylesheet" href="(?:\.\.\/)*assets\/(?:pages|about|work|case-study)\.css">/g, '');
  const routeStyles = relativePath === 'index.html' ? [] : [
    `${prefix}assets/pages.css`,
    ...(relativePath === 'about/index.html' ? [`${prefix}assets/about.css`] : []),
    ...(relativePath === 'work/index.html' ? [`${prefix}assets/work.css`] : []),
    ...(relativePath.startsWith('case-studies/') ? [`${prefix}assets/case-study.css`] : []),
  ];
  const routeLinks = routeStyles.map((href) => `<link rel="stylesheet" href="${href}">`).join('');
  const header = `<header class="site-header wrap"><a class="wordmark" href="${prefix || './'}" aria-label="Michael Bolens, home">${mark}</a><nav aria-label="Primary navigation"><a${current === 'work' ? ' aria-current="page"' : ''} href="${workHref}">Work</a><a${current === 'about' ? ' aria-current="page"' : ''} href="${aboutHref}">About</a><a class="nav-cta" rel="me" href="https://github.com/bolens">GitHub <span aria-hidden="true">↗</span></a></nav></header>`;
  const footer = `<footer class="site-footer wrap"><p>Michael Bolens</p><a href="${footerHref}">${footerLabel} <span aria-hidden="true">${footerArrow}</span></a></footer>`;
  outputs.set(relativePath, source
    .replace(`<link rel="stylesheet" href="${prefix}assets/site.css">`, `${routeLinks}<link rel="stylesheet" href="${prefix}assets/site.css">`)
    .replace('<script src="/assets/theme-init.js"></script><script src="/assets/theme-picker.js" defer></script>', '<script src="/assets/theme-init.js"></script><script src="/assets/project-data.js" defer></script><script src="/assets/theme-picker.js" defer></script>')
    .replace('<script src="/assets/project-data.js"></script>', '')
    .replace(/<header class="site-header wrap">[\s\S]*?<\/header>/, header)
    .replace(/<footer class="site-footer wrap">[\s\S]*?<\/footer>/, footer));
}

let stale = false;
for (const [relativePath, content] of outputs) {
  const path = resolve(root, relativePath);
  if (readFileSync(path, 'utf8') === content) continue;
  if (check) {
    console.error(`${relativePath} is stale; run node scripts/build-site.mjs`);
    stale = true;
  } else {
    writeFileSync(path, content);
    console.log(`Generated ${relativePath}`);
  }
}
if (stale) process.exit(1);
