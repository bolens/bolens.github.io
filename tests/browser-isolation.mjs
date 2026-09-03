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
  console.log('Browser isolation passed concurrent port and session checks.');
} finally {
  await Promise.all(browsers.map((browser) => browser.close()));
}
