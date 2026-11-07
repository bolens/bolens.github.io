import { readFileSync, readdirSync, readlinkSync, realpathSync, statSync } from 'node:fs';
import { dirname, isAbsolute, join } from 'node:path';

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

export function crashpadDatabase(commandLine) {
  const args = commandLine.split('\0');
  const values = [];
  for (let index = 0; index < args.length; index++) {
    if (args[index].startsWith('--database=')) values.push(args[index].slice('--database='.length));
    else if (args[index] === '--database') values.push(args[++index]);
  }
  return values.length === 1 && typeof values[0] === 'string' && isAbsolute(values[0]) ? values[0] : undefined;
}

export function matchesProfileHelper(owner, expected, item) {
  return Boolean(item && Number.isSafeInteger(item.pid) && item.pid > 0 && typeof item.start === 'string' && /^\d+$/.test(item.start) && item.image &&
    BigInt(item.start) >= BigInt(owner.start) && item.image.path === expected.image.path &&
    item.image.dev === expected.image.dev && item.image.ino === expected.image.ino && expected.databases.includes(item.database));
}

const fileIdentity = path => {
  const info = statSync(path, { bigint: true });
  if (!info.isFile()) throw new Error('Browser helper image is not a regular file');
  return { path: realpathSync(path), dev: String(info.dev), ino: String(info.ino) };
};
const raced = error => ['ENOENT', 'ESRCH', 'EACCES', 'EPERM'].includes(error.code);

export function trackBrowserProcesses(pid, profile) {
  const owner = stat(pid);
  if (!owner || owner.session !== pid) throw new Error('Cannot establish owned browser session');
  const known = new Map([[pid, owner]]);
  const helpers = new Map();
  const config = join(realpathSync(profile), 'chrome-config');
  const databases = ['chromium', 'google-chrome', 'google-chrome-beta', 'google-chrome-unstable', 'google-chrome-for-testing'].map(brand => join(config, brand, 'Crash Reports'));
  let expected;
  const helperMetadata = item => {
    if (!expected) return undefined;
    try {
      const imagePath = readlinkSync(`/proc/${item.pid}/exe`);
      if (imagePath !== expected.image.path) return undefined;
      const info = statSync(`/proc/${item.pid}/exe`, { bigint: true });
      const commandLine = readFileSync(`/proc/${item.pid}/cmdline`);
      if (commandLine.length > 16_384) return undefined;
      const database = crashpadDatabase(commandLine.toString('utf8'));
      if (!database) return undefined;
      return { ...item, image: { path: imagePath, dev: String(info.dev), ino: String(info.ino) }, database: realpathSync(database) };
    } catch (error) { if (raced(error)) return undefined; throw error; }
  };
  const observe = () => {
    const pids = readdirSync('/proc').filter(name => /^[1-9]\d*$/.test(name));
    if (pids.length > 65_536) throw new Error('Process identity census exceeds bound');
    const snapshot = pids.map(id => stat(Number(id))).filter(Boolean);
    const root = snapshot.find(item => item.pid === pid && item.start === owner.start);
    if (!expected && root) {
      try { expected = { image: fileIdentity(join(dirname(readlinkSync(`/proc/${pid}/exe`)), 'chrome_crashpad_handler')), databases }; }
      catch (error) { if (!raced(error)) throw error; }
    }
    for (const item of snapshot) {
      if (['Z', 'X', 'x'].includes(item.state) || BigInt(item.start) < BigInt(owner.start)) continue;
      const helper = helperMetadata(item);
      if (expected && matchesProfileHelper(owner, expected, helper)) {
        known.set(item.pid, { pid: item.pid, start: item.start });
        helpers.set(item.pid, helper);
      }
    }
    return collectOwnedProcesses(owner, known, snapshot);
  };
  return {
    observe,
    signal(signal) {
      for (const item of observe()) {
        const current = stat(item.pid);
        if (current?.start !== item.start || ['Z', 'X', 'x'].includes(current.state)) continue;
        const admitted = helpers.get(item.pid);
        if (admitted?.start === item.start && !matchesProfileHelper(owner, expected, helperMetadata(current))) {
          const again = stat(item.pid);
          if (!again || again.start !== item.start || ['Z', 'X', 'x'].includes(again.state)) continue;
          throw new Error('Owned browser helper identity changed before signalling');
        }
        try { process.kill(item.pid, signal); }
        catch (error) { if (error.code !== 'ESRCH') throw error; }
      }
    },
  };
}
