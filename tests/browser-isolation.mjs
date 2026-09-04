import assert from 'node:assert/strict';
import { startBrowser } from './lib/cdp-browser.mjs';

let browsers = [];
try {
  const started = await Promise.allSettled([0, 1].map(async () => {
    const browser = await startBrowser();
    browsers.push(browser);
    return browser;
  }));
  const failed = started.find((result) => result.status === 'rejected');
  if (failed) throw failed.reason;
  if (browsers[0].debugPort === browsers[1].debugPort) {
    throw new Error(`concurrent browsers shared debugging port ${browsers[0].debugPort}`);
  }
  await Promise.all(browsers.map(({ send }) => send('Runtime.enable')));
  const results = await Promise.all(browsers.map(({ send }, index) => send('Runtime.evaluate', {
    expression: `globalThis.__browserIdentity=${index};globalThis.__browserIdentity`,
    returnByValue: true,
  })));
  if (results.some((result, index) => result.result.value !== index)) {
    throw new Error(`concurrent browser state crossed sessions: ${JSON.stringify(results)}`);
  }
  await browsers[1].send('Runtime.evaluate', {
    expression: 'new Promise(()=>{})',
    awaitPromise: true,
  }, 50).then(
    () => { throw new Error('an unanswered browser command did not time out'); },
    (error) => {
      if (!String(error).includes('browser command timed out after 50ms: Runtime.evaluate')) throw error;
    },
  );
  const recovered = await browsers[1].send('Runtime.evaluate', { expression: '6*7', returnByValue: true });
  if (recovered.result.value !== 42) throw new Error('browser did not recover after a command timeout');
  const nativeFetch = globalThis.fetch;
  let targetAttempts = 0;
  const retryFetch = (input, options) => {
    if (String(input).includes('/json/new?about:blank') && targetAttempts++ === 0) return Promise.reject(new Error('simulated debugger target race'));
    return nativeFetch(input, options);
  };
  const retriedBrowser = await startBrowser(undefined, { fetch: retryFetch });
  browsers.push(retriedBrowser);
  const retried = await retriedBrowser.send('Runtime.evaluate', { expression: '21*2', returnByValue: true });
  if (targetAttempts < 2 || retried.result.value !== 42) throw new Error(`browser target startup did not recover after a transient endpoint failure (${targetAttempts} attempts)`);
  const pending = assert.rejects(browsers[0].send('Runtime.evaluate', {
    expression: 'new Promise(()=>{})',
    awaitPromise: true,
  }), /browser connection closed/);
  const firstClosing = browsers[0].close();
  await pending;
  await firstClosing;
  await browsers[0].send('Runtime.enable').then(
    () => { throw new Error('a closed browser accepted a new request'); },
    (error) => {
      if (!String(error).includes('browser connection is closed')) throw error;
    },
  );
  await browsers[0].close();

  const disconnected = assert.rejects(browsers[1].send('Runtime.evaluate', {
    expression: 'new Promise(()=>{})',
    awaitPromise: true,
  }), /browser connection closed/);
  await browsers[1].send('Browser.close').catch(() => {});
  let disconnectTimer;
  try {
    await Promise.race([
      disconnected,
      new Promise((_, reject) => { disconnectTimer = setTimeout(() => reject(new Error('browser exit left an in-flight request pending')), 5_000); }),
    ]);
  } finally {
    clearTimeout(disconnectTimer);
  }
  console.log('Browser isolation passed concurrent port, target retry, session, timeout, pending-request, disconnect, and idempotent shutdown checks.');
} finally {
  await Promise.all(browsers.map((browser) => browser.close()));
}
