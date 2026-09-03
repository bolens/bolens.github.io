import { readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const ignoredDirectories = new Set(['.git', 'node_modules']);
const failures = [];

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) return [];
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

const files = walk(root);

for (const file of files.filter((path) => ['.js', '.mjs'].includes(extname(path)))) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) failures.push(result.stderr.trim());
}

for (const file of files.filter((path) => extname(path) === '.json')) {
  try {
    JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    failures.push(`${relative(root, file)}: ${error.message}`);
  }
}

for (const script of ['scripts/build-site.mjs', 'tests/check-site.mjs']) {
  const args = script === 'scripts/build-site.mjs' ? [script, '--check'] : [script];
  const result = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) failures.push(result.stderr.trim() || result.stdout.trim() || `${script} failed`);
}

if (failures.length > 0) {
  console.error(failures.filter(Boolean).join('\n'));
  process.exit(1);
}

console.log('Lint passed.');
