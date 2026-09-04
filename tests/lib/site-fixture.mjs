import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';
import { spawnSync } from 'node:child_process';

// Build-tool tests own their entire filesystem. The error-page fixture is a
// neutral copy of the home page, so in-progress 404 scene edits are not inputs.
export function createSiteFixture() {
  const root = resolve(import.meta.dirname, '../..');
  const directory = mkdtempSync('/tmp/bolens-site-contract-');
  try {
    for (const name of ['scripts', 'data', 'assets', 'case-studies', 'about', 'work', 'index.html', 'sitemap.xml', 'llms.txt']) {
      cpSync(join(root, name), join(directory, name), { recursive: true, filter: (path) => !basename(path).startsWith('404') });
    }
    mkdirSync(join(directory, 'tests'));
    cpSync(join(root, 'tests/check-site.mjs'), join(directory, 'tests/check-site.mjs'));
    writeFileSync(join(directory, '404.html'), readFileSync(join(directory, 'index.html'), 'utf8').replace('</head>', '<meta name="robots" content="noindex"></head>'));
    const run = (script, ...args) => spawnSync(process.execPath, [script, ...args], { cwd: directory, encoding: 'utf8', timeout: 15000 });
    const generated = run('scripts/build-site.mjs');
    if (generated.status !== 0) throw new Error(generated.stderr || 'Fixture generation failed');
    return { directory, run, close: () => rmSync(directory, { recursive: true, force: true }) };
  } catch (error) { rmSync(directory, { recursive: true, force: true }); throw error; }
}
