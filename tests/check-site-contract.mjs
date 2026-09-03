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
  console.log('Site checker contract passed stylesheet asset, import, comment, and URL-scheme validation.');
} finally {
  rmSync(fixture, { recursive: true, force: true });
}
