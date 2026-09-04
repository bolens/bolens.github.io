import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../assets/case-study.js', import.meta.url), 'utf8');
function setup({ hash = '', ids = ['condition', 'cause', 'correction', 'confirm'], missing = [] } = {}) {
  const listeners = new Map();
  const frames = new Map();
  const scrolled = [];
  let frameId = 0;
  const location = { hash };
  const nodes = ids.map((id, index) => ({
    id, top: index * 1000, active: false,
    getBoundingClientRect() { return { top: this.top }; },
    scrollIntoView() { scrolled.push(id); },
  }));
  for (const node of nodes) node.classList = { toggle: (_, active) => { node.active = active; } };
  const links = ids.map((id) => {
    const attributes = new Map([['href', `#${id}`]]);
    return { attributes, hash: `#${id}`, getAttribute: (key) => attributes.get(key),
      setAttribute: (key, value) => attributes.set(key, value), removeAttribute: (key) => attributes.delete(key),
      toggleAttribute(key, value) { if (value) attributes.set(key, ''); else attributes.delete(key); },
      addEventListener(type, callback) { this[type] = callback; },
    };
  });
  let progress;
  const context = {
    location, innerHeight: 1000,
    document: {
      querySelectorAll: () => links,
      querySelector: (selector) => selector === '.case-route' ? { style: { setProperty: (_, value) => { progress = value; } } } : nodes.find((node) => `#${node.id}` === selector && !missing.includes(node.id)),
      getElementById: (id) => nodes.find((node) => node.id === id && !missing.includes(id)),
    },
    addEventListener: (type, callback) => listeners.set(type, callback),
    requestAnimationFrame: (callback) => { frames.set(++frameId, callback); return frameId; },
    cancelAnimationFrame: (id) => frames.delete(id),
  };
  vm.runInNewContext(source, context, { filename: 'assets/case-study.js' });
  return {
    nodes, links, frames, scrolled,
    state: () => ({ current: links.filter((link) => link.attributes.has('aria-current')).map((link) => link.hash.slice(1)), visited: links.filter((link) => link.attributes.has('data-visited')).map((link) => link.hash.slice(1)), active: nodes.filter((node) => node.active).map((node) => node.id), progress }),
    emit: (type) => listeners.get(type)?.(),
    hash(value) { location.hash = value; listeners.get('hashchange')?.(); },
    resize(height) { context.innerHeight = height; listeners.get('resize')?.(); },
    frame() { const batch = [...frames]; for (const [id, callback] of batch) if (frames.delete(id)) callback(); },
  };
}
const expectSection = (h, id, visited, progress) => assert.deepEqual(h.state(), { current: [id], active: [id], visited, progress });

test('missing or unknown hashes select the first section and a valid deep link selects its chapter', () => {
  for (const hash of ['', '#missing']) expectSection(setup({ hash }), 'condition', ['condition'], 0);
  expectSection(setup({ hash: '#correction' }), 'correction', ['condition', 'cause', 'correction'], 2 / 3);
});

test('scroll follows the last chapter at or above the reading line, including its exact boundary', () => {
  const h = setup();
  h.frame();
  h.nodes[1].top = 381;
  h.emit('scroll'); h.frame();
  expectSection(h, 'condition', ['condition'], 0);
  h.nodes[1].top = 380;
  h.emit('scroll'); h.frame();
  expectSection(h, 'cause', ['condition', 'cause'], 1 / 3);
  h.nodes[2].top = 200; h.nodes[3].top = 379;
  h.emit('scroll'); h.frame();
  expectSection(h, 'confirm', ['condition', 'cause', 'correction', 'confirm'], 1);
});

test('scroll bursts use the latest geometry and schedule one update', () => {
  const h = setup(); h.frame();
  h.nodes[1].top = 200;
  h.emit('scroll'); h.emit('scroll'); h.emit('scroll');
  assert.equal(h.frames.size, 1);
  h.nodes[1].top = 500;
  h.frame();
  expectSection(h, 'condition', ['condition'], 0);
});

test('resize recalculates the reading line without requiring a scroll event', () => {
  const h = setup(); h.frame(); h.nodes[1].top = 500;
  h.resize(2000);
  expectSection(h, 'cause', ['condition', 'cause'], 1 / 3);
  h.resize(1000);
  expectSection(h, 'condition', ['condition'], 0);
});

test('click updates navigation immediately and rapid hash changes cancel stale alignment', () => {
  const h = setup(); h.frame();
  h.links[2].click();
  expectSection(h, 'correction', ['condition', 'cause', 'correction'], 2 / 3);
  h.hash('#confirm'); h.frame();
  h.hash('#cause');
  h.frame();
  assert.deepEqual(h.scrolled, []);
  h.frame();
  assert.deepEqual(h.scrolled, ['cause']);
  expectSection(h, 'cause', ['condition', 'cause'], 1 / 3);
});

test('an unrelated hash invalidates pending alignment without scrolling to an old chapter', () => {
  const h = setup(); h.frame();
  h.hash('#confirm'); h.frame(); h.hash('#other'); h.frame();
  assert.deepEqual(h.scrolled, []);
});

test('one-section pages have finite zero progress and empty pages schedule no work', () => {
  const h = setup({ ids: ['condition'] }); h.frame();
  expectSection(h, 'condition', ['condition'], 0);
  const empty = setup({ ids: [] });
  empty.emit('scroll'); empty.hash('#missing');
  assert.equal(empty.frames.size, 0);
  assert.deepEqual(empty.state(), { current: [], active: [], visited: [], progress: undefined });
  const missing = setup({ ids: ['condition'], missing: ['condition'] });
  assert.equal(missing.frames.size, 0);
});
