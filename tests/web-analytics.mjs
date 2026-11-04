import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import vm from 'node:vm';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const source = readFileSync(join(root, 'assets/web-analytics.js'), 'utf8');
function execute(options = {}) {
  const nodes = [];
  const controller = { ready: true };
  const context = {
    location: { hostname: options.hostname ?? 'michael.bolens.dev', protocol: options.protocol ?? 'https:' },
    navigator: { globalPrivacyControl: options.gpc, doNotTrack: options.dnt },
    window: { doNotTrack: options.windowDnt, existingController: controller },
    document: {
      getElementById: id => nodes.find(node => node.id === id),
      createElement: tag => ({ tag, dataset: {} }),
      body: { append: node => nodes.push(node) },
    },
  };
  const run = () => vm.runInNewContext(source, context);
  run();
  return { nodes, context, controller, run };
}
for (const hostname of ["michael.bolens.dev", "bolens.github.io"]) {
  await test(`analytics loads the official module on ${hostname}`, () => {
    const { nodes } = execute({ hostname });
    assert.equal(nodes.length, 1);
    assert.equal(nodes[0].type, 'module');
    assert.equal(nodes[0].src, 'https://static.cloudflareinsights.com/beacon.min.js');
    assert.match(JSON.parse(nodes[0].dataset.cfBeacon).token, /^[0-9a-f]{32}$/);
  });
}
for (const hostname of ['localhost', '127.0.0.1', 'preview.example', 'michael.bolens.dev.attacker.example']) {
  await test(`analytics is absent on ${hostname}`, () => assert.equal(execute({ hostname }).nodes.length, 0));
}
for (const [name, options] of [
  ['Global Privacy Control', { gpc: true }],
  ['navigator Do Not Track', { dnt: '1' }],
  ['window Do Not Track', { windowDnt: '1' }],
  ['non-HTTP documents', { protocol: 'file:' }],
]) {
  await test(`analytics honors ${name}`, () => assert.equal(execute(options).nodes.length, 0));
}
await test('duplicate loader execution adds no second beacon', () => {
  const state = execute();
  state.run();
  assert.equal(state.nodes.length, 1);
});
await test('an unavailable provider does not block or mutate existing UI state', () => {
  // The fake document accepts the script but never loads or executes it.
  const state = execute();
  assert.equal(state.context.window.existingController, state.controller);
  assert.equal(state.controller.ready, true);
  assert.equal(state.nodes.length, 1);
});
function pages(folder) {
  return readdirSync(folder, { withFileTypes: true }).flatMap(entry => {
    if (entry.name.startsWith('.')) return [];
    const path = join(folder, entry.name);
    return entry.isDirectory() ? pages(path) : path.endsWith('.html') ? [path] : [];
  });
}
await test('every published HTML page includes one deferred shared loader', () => {
  const htmlPages = pages(join(root, '.'));
  assert(htmlPages.length >= 9);
  for (const page of htmlPages) {
    const html = readFileSync(page, 'utf8');
    assert.equal((html.match(/src="(?:\/)?assets\/web-analytics\.js"/g) ?? []).length, 1, page);
    assert.match(html, /<script(?=[^>]*\bdefer)(?=[^>]*src="(?:\/)?assets\/web-analytics\.js")[^>]*><\/script>\s*<\/body>/, page);
  }
});
