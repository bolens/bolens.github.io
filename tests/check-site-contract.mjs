import { appendFileSync, cpSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const fixture = mkdtempSync('/tmp/bolens-check-site-contract-');

try {
  for (const name of readdirSync(root)) {
    if (name === '.git') continue;
    cpSync(join(root, name), join(fixture, name), { recursive: true });
  }
  appendFileSync(join(fixture, 'assets/site.css'), `\n@import '/assets/missing-contract-import.css';\n.contract-probe{background-image:url('/assets/missing-contract-image.png')}\n`);
  const result = spawnSync(process.execPath, ['tests/check-site.mjs'], { cwd: fixture, encoding: 'utf8' });
  const output = `${result.stdout}\n${result.stderr}`;
  if (result.status === 0 || !/site\.css: broken stylesheet reference \/assets\/missing-contract-image\.png/.test(output) || !/site\.css: broken stylesheet reference \/assets\/missing-contract-import\.css/.test(output)) {
    throw new Error(`missing stylesheet asset was not rejected: ${output}`);
  }
  console.log('Site checker contract passed stylesheet asset and import validation.');
} finally {
  rmSync(fixture, { recursive: true, force: true });
}
