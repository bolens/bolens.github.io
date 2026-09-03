import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const fixture = mkdtempSync('/tmp/bolens-build-contract-');
const copy = (path) => cpSync(resolve(root, path), join(fixture, path), { recursive: true });
for (const path of ['scripts', 'data', 'assets', 'case-studies', 'about', 'work', '404.html', 'index.html', 'llms.txt', 'sitemap.xml']) copy(path);
const projectPath = join(fixture, 'data/projects.json');
const themePath = join(fixture, 'data/themes.json');
const projects = JSON.parse(readFileSync(projectPath, 'utf8'));
const themes = JSON.parse(readFileSync(themePath, 'utf8'));
const run = (...args) => spawnSync(process.execPath, ['scripts/build-site.mjs', ...args], { cwd: fixture, encoding: 'utf8' });
const writeJson = (path, value) => writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
const expectFailure = (name, mutate, pattern) => {
  const nextProjects = structuredClone(projects);
  const nextThemes = structuredClone(themes);
  mutate({ projects: nextProjects, themes: nextThemes });
  writeJson(projectPath, nextProjects);
  writeJson(themePath, nextThemes);
  const result = run('--check');
  const output = `${result.stdout}\n${result.stderr}`;
  if (result.status === 0 || !pattern.test(output)) throw new Error(`${name} was not rejected as expected: ${output}`);
};

try {
  expectFailure('missing project field', ({ projects: value }) => delete value[0].summary, /missing summary/);
  expectFailure('duplicate project name', ({ projects: value }) => { value[1].name = value[0].name; }, /duplicate project name/);
  expectFailure('duplicate case-study slug', ({ projects: value }) => { value[1].slug = value[0].slug; }, /duplicate case-study slug/);
  expectFailure('unknown default palette', ({ themes: value }) => { value.defaultPalette = 'missing'; }, /defaultPalette/);
  expectFailure('invalid modes', ({ themes: value }) => { value.modes = ['day', 'night']; }, /modes must/);
  expectFailure('invalid palette ID', ({ themes: value }) => { value.palettes['Bad ID'] = value.palettes.alpine; }, /invalid palette ID/);
  expectFailure('missing palette label', ({ themes: value }) => { value.palettes.alpine.label = ''; }, /missing a label/);
  expectFailure('missing theme token', ({ themes: value }) => { delete value.palettes.alpine.night.paper; }, /alpine\.night\.paper/);
  expectFailure('invalid theme color', ({ themes: value }) => { value.palettes.alpine.day.paper = 'red'; }, /six-digit hex color/);
  expectFailure('invalid 404 token', ({ themes: value }) => { value.palettes.alpine.scene404.bad = '#ffffff'; }, /scene404\.bad/);

  writeJson(projectPath, projects);
  const changedThemes = structuredClone(themes);
  changedThemes.palettes.alpine.label = 'Alpine Test';
  writeJson(themePath, changedThemes);
  if (run('--check').status === 0) throw new Error('stale generated theme artifacts were not detected');
  const generated = run();
  if (generated.status !== 0 || !readFileSync(join(fixture, 'assets/theme-data.js'), 'utf8').includes('Alpine Test')) throw new Error(`theme regeneration failed: ${generated.stderr}`);
  if (run('--check').status !== 0) throw new Error('generated fixture remained stale after regeneration');
  console.log('Build contract passed project/theme validation, stale detection, and deterministic regeneration.');
} finally {
  rmSync(fixture, { recursive: true, force: true });
}
