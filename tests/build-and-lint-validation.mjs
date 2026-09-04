import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { createSiteFixture } from './lib/site-fixture.mjs';

const fixture = createSiteFixture();
const hashFiles = () => {
  const walk = (directory) => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(join(directory, entry.name)) : [join(directory, entry.name)]);
  return Object.fromEntries(walk(fixture.directory).map((path) => [path, createHash('sha256').update(readFileSync(path)).digest('hex')]));
};
try {
  await test('build check never rewrites stale output and regeneration is idempotent', () => {
    const path = join(fixture.directory, 'assets/project-data.js');
    const original = readFileSync(path, 'utf8');
    writeFileSync(path, 'stale output');
    const before = hashFiles();
    const check = fixture.run('scripts/build-site.mjs', '--check');
    assert.equal(check.status, 1);
    assert.match(check.stderr, /assets\/project-data.js is stale/);
    assert.deepEqual(hashFiles(), before);
    assert.equal(fixture.run('scripts/build-site.mjs').status, 0);
    assert.equal(readFileSync(path, 'utf8'), original);
    const generated = hashFiles();
    const second = fixture.run('scripts/build-site.mjs');
    assert.equal(second.status, 0);
    assert.equal(second.stdout, '');
    assert.deepEqual(hashFiles(), generated);
  });
  for (const field of ['name', 'status', 'tech', 'repository']) {
    await test(`invalid project ${field} fails before writing any output`, () => {
      const path = join(fixture.directory, 'data/projects.json');
      const original = readFileSync(path, 'utf8');
      const projects = JSON.parse(original); delete projects[0][field];
      writeFileSync(path, JSON.stringify(projects));
      const before = hashFiles();
      try {
        const result = fixture.run('scripts/build-site.mjs');
        assert.equal(result.status, 1);
        assert.match(result.stderr, new RegExp(`missing ${field}`));
        assert.deepEqual(hashFiles(), before);
      } finally { writeFileSync(path, original); }
    });
  }
  await test('a failed atomic rename retains the original output and removes temporary files', () => {
    const data = join(fixture.directory, 'data/projects.json');
    const originalData = readFileSync(data, 'utf8');
    const projects = JSON.parse(originalData); projects[0].commandDetail = 'Changed detail';
    writeFileSync(data, JSON.stringify(projects));
    const output = join(fixture.directory, 'assets/project-data.js');
    const originalOutput = readFileSync(output, 'utf8');
    const injection = join(fixture.directory, 'fail-rename.mjs');
    writeFileSync(injection, `import fs from 'node:fs';import {syncBuiltinESMExports} from 'node:module';const rename=fs.renameSync;fs.renameSync=(from,to)=>{if(to.endsWith('/assets/project-data.js'))throw new Error('simulated rename failure');return rename(from,to)};syncBuiltinESMExports();`);
    try {
      const result = spawnSync(process.execPath, ['--import', injection, 'scripts/build-site.mjs'], { cwd: fixture.directory, encoding: 'utf8', timeout: 15000 });
      assert.equal(result.status, 1);
      assert.match(result.stderr, /simulated rename failure/);
      assert.equal(readFileSync(output, 'utf8'), originalOutput);
      assert.deepEqual(readdirSync(join(fixture.directory, 'assets')).filter((name) => name.endsWith('.tmp')), []);
    } finally { writeFileSync(data, originalData); rmSync(injection); }
  });
  await test('lint accepts a valid site', () => {
    const result = fixture.run('scripts/lint.mjs');
    assert.equal(result.status, 0, result.stderr);
  });
  for (const [name, file, contents, expected] of [
    ['invalid JavaScript', 'assets/broken.js', 'const = ;', /SyntaxError/],
    ['invalid JSON', 'data/broken.json', '{broken}', /broken.json/],
    ['stale generated data', 'assets/project-data.js', 'window.portfolioProjects=[];', /project-data.js is stale/],
  ]) {
    await test(`lint rejects ${name}`, () => {
      const path = join(fixture.directory, file);
      let original;
      try { original = readFileSync(path); } catch {}
      writeFileSync(path, contents);
      try {
        const result = fixture.run('scripts/lint.mjs');
        assert.equal(result.status, 1);
        assert.match(result.stderr, expected);
      } finally { if (original) writeFileSync(path, original); else rmSync(path); }
    });
  }
  await test('lint ignores dependency and Git internals rather than parsing their contents', () => {
    for (const name of ['node_modules', '.git']) { mkdirSync(join(fixture.directory, name)); writeFileSync(join(fixture.directory, name, 'invalid.js'), 'const = ;'); }
    try {
      const result = fixture.run('scripts/lint.mjs');
      assert.equal(result.status, 0, result.stderr);
    } finally { for (const name of ['node_modules', '.git']) rmSync(join(fixture.directory, name), { recursive: true }); }
  });
} finally { fixture.close(); }
