import { startBrowser } from './lib/cdp-browser.mjs';

let browsers = [];
try {
  browsers = await Promise.all([startBrowser(() => {}), startBrowser(() => {})]);
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
  const pending = browsers[0].send('Runtime.evaluate', {
    expression: 'new Promise(()=>{})',
    awaitPromise: true,
  });
  browsers[0].close();
  await pending.then(
    () => { throw new Error('closing a browser resolved an in-flight request'); },
    (error) => {
      if (!String(error).includes('browser connection closed')) throw error;
    },
  );
  await browsers[0].send('Runtime.enable').then(
    () => { throw new Error('a closed browser accepted a new request'); },
    (error) => {
      if (!String(error).includes('browser connection is closed')) throw error;
    },
  );
  browsers[0].close();
  console.log('Browser isolation passed concurrent port, session, pending-request, and idempotent shutdown checks.');
} finally {
  await Promise.all(browsers.map((browser) => browser.close()));
}
