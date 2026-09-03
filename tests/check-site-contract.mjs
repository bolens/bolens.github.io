import { appendFileSync, cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const fixture = mkdtempSync('/tmp/bolens-check-site-contract-');

try {
  for (const name of readdirSync(root)) {
    if (name === '.git') continue;
    cpSync(join(root, name), join(fixture, name), { recursive: true });
  }
  const stylesheet = join(fixture, 'assets/site.css');
  const original = readFileSync(stylesheet, 'utf8');
  const run = () => spawnSync(process.execPath, ['tests/check-site.mjs'], { cwd: fixture, encoding: 'utf8' });

  appendFileSync(stylesheet, `\n/* url('/assets/documentation-example.png') */\n.remote-probe{background-image:url('HTTPS://example.com/image.png')}\n.inline-probe{background-image:url('DATA:image/svg+xml,<svg></svg>')}\n`);
  const commentResult = run();
  if (commentResult.status !== 0) throw new Error(`commented stylesheet example was treated as a dependency: ${commentResult.stderr}`);

  writeFileSync(stylesheet, `${original}\n@import '/assets/missing-contract-import.css';\n.contract-probe{background-image:url('/assets/missing-contract-image.png')}\n`);
  const result = run();
  const output = `${result.stdout}\n${result.stderr}`;
  if (result.status === 0 || !/site\.css: broken stylesheet reference \/assets\/missing-contract-image\.png/.test(output) || !/site\.css: broken stylesheet reference \/assets\/missing-contract-import\.css/.test(output)) {
    throw new Error(`missing stylesheet asset was not rejected (status ${result.status}, error ${result.error ?? 'none'}): ${output}`);
  }

  writeFileSync(stylesheet, original);
  const page = join(fixture, 'about/index.html');
  writeFileSync(page, readFileSync(page, 'utf8').replace('</body>', `<!-- <img src="/assets/documentation-example.png"> --></body>`));
  const regenerated = spawnSync(process.execPath, ['scripts/build-site.mjs'], { cwd: fixture, encoding: 'utf8' });
  if (regenerated.status !== 0) throw new Error(`HTML comment fixture could not be generated: ${regenerated.stderr}`);
  const htmlCommentResult = run();
  if (htmlCommentResult.status !== 0) throw new Error(`commented HTML example was treated as a dependency: ${htmlCommentResult.stderr}`);

  writeFileSync(page, readFileSync(page, 'utf8').replace(/(<meta name="viewport"[^>]*>)/, '<!-- $1 -->'));
  const regeneratedCommentedMetadata = spawnSync(process.execPath, ['scripts/build-site.mjs'], { cwd: fixture, encoding: 'utf8' });
  if (regeneratedCommentedMetadata.status !== 0) throw new Error(`commented metadata fixture could not be generated: ${regeneratedCommentedMetadata.stderr}`);
  const commentedMetadata = run();
  if (commentedMetadata.status === 0 || !/about\/index\.html: missing viewport metadata/.test(commentedMetadata.stderr)) {
    throw new Error(`commented metadata satisfied a live requirement: ${commentedMetadata.stderr}`);
  }

  console.log('Site checker contract passed stylesheet and HTML reference filtering.');
} finally {
  rmSync(fixture, { recursive: true, force: true });
}
