import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const source = readFileSync(new URL('../assets/page-transitions.js', import.meta.url), 'utf8');
function setup({ saved = false, system = false } = {}) {
  const listeners = new Map();
  const root = { dataset: saved ? { motion:'reduced' } : {}, classList:{ remove: (name) => removed.push(name) } };
  const removed = [];
  const window = { navigation:{} };
  vm.runInNewContext(source, { document:{ documentElement:root }, window, URL,
    location:new URL('https://portfolio.test/'), matchMedia:() => ({ matches:system }),
    addEventListener:(type, callback) => listeners.set(type, callback),
  });
  return { root, removed, emit(type, activation, transition = { skipTransition() { this.skipped = true; } }) {
    window.navigation.activation = activation;
    listeners.get(type)({ activation, viewTransition:transition });
    return transition;
  } };
}
const entry = (path, index) => ({ url:new URL(path, 'https://portfolio.test').href, index });
const activation = (from, to, navigationType = 'push') => ({ from:entry(from, 4), entry:entry(to, 5), navigationType });

test('page hierarchy chooses consistent forward and return directions on both documents', () => {
  for (const [from,to,direction] of [['/','/about/','forward'],['/work/','/case-studies/uddns/','forward'],['/case-studies/uddns/','/work/','back'],['/about/','/','back']]) {
    for (const type of ['pageswap','pagereveal']) {
      const h = setup();
      assert.ok(!h.emit(type, activation(from,to)).skipped);
      assert.equal(h.root.dataset.pageDirection, direction);
      assert.equal('pageArrived' in h.root.dataset, type === 'pagereveal');
      assert.deepEqual(h.removed, type === 'pagereveal' ? ['is-loading'] : []);
    }
  }
});
test('history traversal follows entry order even when it opposes the route hierarchy', () => {
  const h = setup();
  h.emit('pagereveal', { ...activation('/','/about/','traverse'), entry:entry('/about/',3) });
  assert.equal(h.root.dataset.pageDirection, 'back');
  h.emit('pagereveal', activation('/about/','/','traverse'));
  assert.equal(h.root.dataset.pageDirection, 'forward');
});
test('reduced motion, unknown routes, reloads and fragment-only changes skip transition work', () => {
  for (const options of [{saved:true},{system:true}]) {
    const h = setup(options);
    for (const type of ['pageswap','pagereveal']) assert.equal(h.emit(type,activation('/','/work/')).skipped,true);
    assert.equal(h.root.dataset.pageDirection,undefined);
  }
  for (const value of [undefined, activation('/','/404.html'), activation('/missing/','/'), activation('/','https://external.test/about/'), activation('/work/','/work/#projects'), activation('/index.html','/')]) {
    const h = setup();
    assert.equal(h.emit('pagereveal',value).skipped,true);
    assert.deepEqual(h.removed,[]);
  }
});
test('ordinary loads and unsupported transitions leave native entrances alone', () => {
  const h = setup();
  h.emit('pagereveal',activation('/','/about/'),null);
  assert.deepEqual(h.root.dataset,{});
  assert.deepEqual(h.removed,[]);
});
