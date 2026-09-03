import { resolve } from 'node:path';
import { startSiteServer } from './lib/site-server.mjs';

const server = await startSiteServer(resolve(import.meta.dirname, '..'));
const response = await fetch(`${server.origin}/`);
if (!response.ok) throw new Error(`site server returned ${response.status} before shutdown`);
await response.body.cancel();

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
console.log('Site server lifecycle passed malformed-request, awaitable, and idempotent shutdown checks.');
