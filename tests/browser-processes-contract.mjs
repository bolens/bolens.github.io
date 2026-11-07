import assert from 'node:assert/strict';
import test from 'node:test';
import { collectOwnedProcesses, crashpadDatabase, matchesProfileHelper, parseProcessStat } from './lib/browser-processes.mjs';

const owner = { pid: 100, start: '1000' };
const item = (pid, parent = 100, session = 100, start = String(1000 + pid), state = 'S') => ({ pid, parent, session, start, state });
const root = () => item(100, 1, 100, '1000');

test('browser stat parsing handles spaces and closing parentheses in comm', () => {
  const fields = ['S', '1', '100', '100', ...Array(15).fill('0'), '1000'];
  assert.deepEqual(parseProcessStat('100 (Chrome helper ) name) ' + fields.join(' ')), root());
  assert.throws(() => parseProcessStat('not a process identity'));
});
test('browser cleanup ignores only dead/zombie members and never unrelated processes', () => {
  const known = new Map([[100, owner]]);
  const result = collectOwnedProcesses(owner, known, [root(), item(101), item(102, 100, 100, '1102', 'Z'), item(200, 1, 200)]);
  assert.deepEqual(result.map(x => x.pid), [100, 101]);
});
test('observed browser descendants stay owned after reparenting or session change', () => {
  const known = new Map([[100, owner]]);
  collectOwnedProcesses(owner, known, [root(), item(101, 100, 101)]);
  assert.deepEqual(collectOwnedProcesses(owner, known, [item(101, 1, 101)]).map(x => x.pid), [101]);
});
test('a reused browser leader cannot identify a foreign new session as owned', () => {
  const known = new Map([[100, owner]]);
  assert.throws(() => collectOwnedProcesses(owner, known, [item(100, 1, 100, '9999'), item(101)]), /reused/);
});
test('a reused descendant PID in a foreign session is never signalled', () => {
  const known = new Map([[100, owner], [101, item(101)]]);
  assert.deepEqual(collectOwnedProcesses(owner, known, [root(), item(101, 1, 200, '9999')]).map(x => x.pid), [100]);
});
test('unanchored numeric session coincidence cannot prove browser ownership', () => {
  assert.throws(() => collectOwnedProcesses(owner, new Map([[100, owner]]), [item(101, 1, 100)]), /unavailable/);
});


test('crash database parsing accepts one absolute value and rejects ambiguous or relative arguments', () => {
  assert.equal(crashpadDatabase('handler\0--database=/tmp/owned/chromium/Crash Reports\0--monitor-self\0'), '/tmp/owned/chromium/Crash Reports');
  assert.equal(crashpadDatabase('handler\0--database\0/tmp/owned/chromium/Crash Reports\0'), '/tmp/owned/chromium/Crash Reports');
  for (const value of ['handler\0--database=relative\0', 'handler\0--database=\0', 'handler\0--database=/one\0--database=/two\0', 'handler\0--database\0']) assert.equal(crashpadDatabase(value), undefined);
});
test('detached helper admission requires exact actual image identity, owned database and start generation', () => {
  const expected = { image: { path: '/usr/lib/chromium/chrome_crashpad_handler', dev: '1', ino: '2' }, databases: ['/tmp/owned/chrome-config/chromium/Crash Reports'] };
  const helper = { ...item(105, 1, 105), image: { ...expected.image }, database: expected.databases[0] };
  assert.equal(matchesProfileHelper(owner, expected, helper), true);
  for (const changed of [
    undefined, { ...helper, pid: -1 }, { ...helper, pid: 0 }, { ...helper, start: undefined }, { ...helper, image: undefined },
    { ...helper, start: '999' },
    { ...helper, image: { ...helper.image, path: '/other/chrome_crashpad_handler' } },
    { ...helper, image: { ...helper.image, dev: '3' } },
    { ...helper, image: { ...helper.image, ino: '3' } },
    { ...helper, database: '/tmp/owned-lookalike/chrome-config/chromium/Crash Reports' },
    { ...helper, database: '/home/other/Crash Reports' },
  ]) assert.equal(matchesProfileHelper(owner, expected, changed), false);
});
test('admitted detached helper identity remains independently owned after browser leader exit', () => {
  const helper = item(105, 1, 105), known = new Map([[100, owner], [105, helper]]);
  assert.deepEqual(collectOwnedProcesses(owner, known, [helper]).map(value => value.pid), [105]);
  assert.deepEqual(collectOwnedProcesses(owner, known, [{ ...helper, start: '9999', session: 999 }]), []);
});
