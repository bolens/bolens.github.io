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
  const pending = browsers[0].send('Runtime.evaluate', {
    expression: 'new Promise(()=>{})',
    awaitPromise: true,
  });
  const firstClosing = browsers[0].close();
  await pending.then(
    () => { throw new Error('closing a browser resolved an in-flight request'); },
    (error) => {
      if (!String(error).includes('browser connection closed')) throw error;
    },
  );
  await firstClosing;
  await browsers[0].send('Runtime.enable').then(
    () => { throw new Error('a closed browser accepted a new request'); },
    (error) => {
      if (!String(error).includes('browser connection is closed')) throw error;
    },
  );
  await browsers[0].close();

  const disconnected = browsers[1].send('Runtime.evaluate', {
    expression: 'new Promise(()=>{})',
    awaitPromise: true,
  });
  await browsers[1].send('Browser.close').catch(() => {});
  let disconnectTimer;
  try {
    await Promise.race([
      disconnected.then(
        () => { throw new Error('browser exit resolved an in-flight request'); },
        (error) => {
          if (!String(error).includes('browser connection closed')) throw error;
        },
      ),
      new Promise((_, reject) => { disconnectTimer = setTimeout(() => reject(new Error('browser exit left an in-flight request pending')), 5_000); }),
    ]);
  } finally {
    clearTimeout(disconnectTimer);
  }
  console.log('Browser isolation passed concurrent port, session, timeout, pending-request, disconnect, and idempotent shutdown checks.');
} finally {
  await Promise.all(browsers.map((browser) => browser.close()));
}
