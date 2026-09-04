import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { createSiteFixture } from './lib/site-fixture.mjs';

const fixture = createSiteFixture();
const page = join(fixture.directory, 'about/index.html');
const original = readFileSync(page, 'utf8');
const insert = (html, content) => html.replace('</body>', `${content}</body>`);
try {
  await test('complete fixture satisfies the site checker', () => {
    const result = fixture.run('tests/check-site.mjs');
    assert.equal(result.status, 0, result.stderr);
  });
  for (const [name, mutate, expected] of [
    ['missing main', (html) => html.replace(/<main\b/g, '<div').replace(/<\/main>/g, '</div>'), /exactly one main/],
    ['duplicate heading', (html) => insert(html, '<h1>Duplicate</h1>'), /exactly one h1/],
    ['empty title', (html) => html.replace(/<title>[^<]+<\/title>/, '<title></title>'), /non-empty title/],
    ['missing language', (html) => html.replace('<html lang="en">', '<html>'), /English language/],
    ['missing doctype', (html) => html.replace(/<!doctype html>/i, ''), /HTML doctype/],
    ['missing fragment', (html) => insert(html, '<a href="#absent-target">Missing</a>'), /fragment link #absent-target/],
    ['missing local asset', (html) => insert(html, '<img src="../assets/absent.svg?version=1#icon">'), /broken internal reference/],
    ['invalid structured data', (html) => insert(html, '<script type="application/ld+json">{broken}</script>'), /invalid declarative JSON/],
    ['invalid speculation rules', (html) => insert(html, '<script type="speculationrules">{broken}</script>'), /invalid declarative JSON/],
    ['missing social description', (html) => html.replace(/<meta property="og:description"[^>]*>/, ''), /missing og:description/],
    ['duplicate canonical', (html) => html.replace(/<link rel="canonical" href="[^"]+"/, '<link rel="canonical" href="https://bolens.github.io/"'), /duplicate canonical URL/],
  ]) {
    await test(`site checker rejects ${name}`, () => {
      const changed = mutate(original);
      assert.notEqual(changed, original, 'fixture mutation must apply');
      writeFileSync(page, changed);
      try {
        // Normalize generated chrome so the assertion proves the specific
        // validator fires, not merely that a generated file became stale.
        const build = fixture.run('scripts/build-site.mjs');
        assert.equal(build.status, 0, build.stderr);
        const result = fixture.run('tests/check-site.mjs');
        assert.equal(result.status, 1, result.stderr);
        assert.match(result.stderr, expected);
      } finally { writeFileSync(page, original); }
    });
  }
  await test('local references allow existing query and fragment suffixes', () => {
    writeFileSync(page, insert(original, '<img src="../assets/favicon.svg?v=2#icon"><a href="../work/?q=privacy#projects">Work</a>'));
    try {
      assert.equal(fixture.run('scripts/build-site.mjs').status, 0);
      const result = fixture.run('tests/check-site.mjs');
      assert.equal(result.status, 0, result.stderr);
    } finally { writeFileSync(page, original); }
  });
  await test('social-card dimensions are validated from the image header', () => {
    const path = join(fixture.directory, 'assets/social-card-v2.png');
    const originalImage = readFileSync(path);
    const invalid = Buffer.from(originalImage);
    invalid.writeUInt32BE(640, 16);
    writeFileSync(path, invalid);
    try {
      const result = fixture.run('tests/check-site.mjs');
      assert.equal(result.status, 1);
      assert.match(result.stderr, /social card must be 1200 by 630/);
    } finally { writeFileSync(path, originalImage); }
  });
} finally { fixture.close(); }
