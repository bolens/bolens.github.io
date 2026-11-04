import assert from 'node:assert/strict';
import test from 'node:test';
import { isApplicationException } from './lib/ui-fixture.mjs';

const origin = 'http://127.0.0.1:4321';

test('UI fixture reports only attributable application exceptions', () => {
  assert.equal(isApplicationException({ text: 'Uncaught', url: `${origin}/assets/site.js` }, origin), true);
  assert.equal(isApplicationException({ text: 'Uncaught', stackTrace: { callFrames: [{ url: `${origin}/assets/site.js` }] } }, origin), true);
  assert.equal(isApplicationException({ text: 'Uncaught', url: 'chrome://newtab/' }, origin), false);
  assert.equal(isApplicationException({ text: 'Uncaught' }, origin), false);
});

test('UI fixture ignores expected cross-document transition cancellation', () => {
  assert.equal(isApplicationException({ exception: { description: 'AbortError: Transition was skipped' }, url: `${origin}/case-studies/uddns/` }, origin), false);
});

test('UI fixture accepts explicit skip diagnostics without hiding other AbortErrors', () => {
  assert.equal(isApplicationException({ exception: { description: 'AbortError: Transition was skipped. skipTransition() called' }, url: `${origin}/about/` }, origin), false);
  assert.equal(isApplicationException({ exception: { description: 'AbortError: The operation was aborted' }, url: `${origin}/assets/site.js` }, origin), true);
  assert.equal(isApplicationException({ exception: { description: 'AbortError: Transition was skipped. unexpected application failure' }, url: `${origin}/assets/site.js` }, origin), true);
});
