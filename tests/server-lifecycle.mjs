import { mkdtempSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { startSiteServer } from './lib/site-server.mjs';

const server = await startSiteServer(resolve(import.meta.dirname, '..'));
const response = await fetch(`${server.origin}/`);
if (!response.ok) throw new Error(`site server returned ${response.status} before shutdown`);
await response.body.cancel();
const head = await fetch(`${server.origin}/`, { method: 'HEAD' });
if (!head.ok || (await head.text()) !== '') throw new Error(`site server returned an invalid HEAD response: ${head.status}`);

const malformed = await fetch(`${server.origin}/%E0%A4%A`);
if (malformed.status !== 400) throw new Error(`site server returned ${malformed.status} for a malformed request target`);
await malformed.body.cancel();
const nulPath = await fetch(`${server.origin}/%00`);
if (nulPath.status !== 400) throw new Error(`site server returned ${nulPath.status} for a NUL request target`);
await nulPath.body.cancel();

const firstClose = server.close();
const secondClose = server.close();
if (typeof firstClose?.then !== 'function') throw new Error('site server close is not awaitable');
if (firstClose !== secondClose) throw new Error('site server close is not idempotent');
await firstClose;

await fetch(`${server.origin}/`).then(
  () => { throw new Error('site server accepted a request after close resolved'); },
  () => {},
);

const incompleteRoot = mkdtempSync('/tmp/bolens-incomplete-site-');
let incompleteServer;
try {
  incompleteServer = await startSiteServer(incompleteRoot);
  const missingFallback = await fetch(`${incompleteServer.origin}/missing`);
  if (missingFallback.status !== 500 || await missingFallback.text() !== 'Internal Server Error') {
    throw new Error(`site server did not contain a missing fallback: ${missingFallback.status}`);
  }
} finally {
  await incompleteServer?.close();
  rmSync(incompleteRoot, { recursive: true, force: true });
}

console.log('Site server lifecycle passed HEAD, malformed-request, missing-fallback, awaitable, and idempotent shutdown checks.');
