import { readFileSync, readdirSync } from 'node:fs';

export function parseProcessStat(text) {
  const end = text.lastIndexOf(') ');
  const pid = Number(text.slice(0, text.indexOf(' ')));
  const fields = text.slice(end + 2).trim().split(/\s+/);
  if (end < 0 || !Number.isSafeInteger(pid) || pid <= 0 || fields.length < 20 || !/^\d+$/.test(fields[19])) {
    throw new Error('Invalid process identity');
  }
  const parent = Number(fields[1]), session = Number(fields[3]);
  if (![parent, session].every(value => Number.isSafeInteger(value) && value >= 0)) throw new Error('Invalid process ancestry');
  return { pid, state: fields[0], parent, session, start: fields[19] };
}

export function collectOwnedProcesses(owner, known, snapshot) {
  const current = new Map(snapshot.map(item => [item.pid, item]));
  const root = current.get(owner.pid);
  if (root && root.start !== owner.start) throw new Error('Browser leader identity was reused');
  const owned = new Map();
  for (const [pid, identity] of known) {
    const item = current.get(pid);
    if (item?.start === identity.start) owned.set(pid, item);
  }
  // A still-existing original session owns its members even after its leader
  // exits. A reused leader PID must never identify a new session as ours.
  const anchored = [...owned.values()].some(item => item.session === owner.pid);
  if (!anchored && snapshot.some(item => item.session === owner.pid)) throw new Error('Browser session ownership is unavailable');
  if (anchored) {
    for (const item of snapshot) {
      if (item.session === owner.pid && BigInt(item.start) >= BigInt(owner.start)) owned.set(item.pid, item);
    }
  }
  let added;
  do {
    added = false;
    for (const item of snapshot) {
      const parent = owned.get(item.parent);
      if (!owned.has(item.pid) && parent && BigInt(item.start) >= BigInt(parent.start)) {
        owned.set(item.pid, item); added = true;
      }
    }
  } while (added);
  for (const [pid, item] of owned) known.set(pid, { pid, start: item.start });
  return [...owned.values()].filter(item => !['Z', 'X', 'x'].includes(item.state));
}

function stat(pid) {
  try { return parseProcessStat(readFileSync(`/proc/${pid}/stat`, 'utf8')); }
  catch (error) {
    if (['ENOENT', 'ESRCH'].includes(error.code)) return undefined;
    throw error;
  }
}

export function trackBrowserProcesses(pid) {
  const owner = stat(pid);
  if (!owner || owner.session !== pid) throw new Error('Cannot establish owned browser session');
  const known = new Map([[pid, owner]]);
  const observe = () => {
    const pids = readdirSync('/proc').filter(name => /^[1-9]\d*$/.test(name));
    if (pids.length > 65_536) throw new Error('Process identity census exceeds bound');
    const snapshot = pids.map(id => stat(Number(id))).filter(Boolean);
    return collectOwnedProcesses(owner, known, snapshot);
  };
  return {
    observe,
    signal(signal) {
      for (const item of observe()) {
        const current = stat(item.pid);
        if (current?.start !== item.start) continue;
        try { process.kill(item.pid, signal); }
        catch (error) { if (error.code !== 'ESRCH') throw error; }
      }
    },
  };
}
