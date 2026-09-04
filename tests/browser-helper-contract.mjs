import { startBrowser } from './lib/cdp-browser.mjs';
import { evaluate, finishFiniteAnimations, waitFor } from './lib/browser-test.mjs';

const browser = await startBrowser();
const { send } = browser;

try {
  await Promise.all(['Page.enable', 'Runtime.enable'].map((method) => send(method)));
  const fixture = encodeURIComponent(`<!doctype html><style>
    @keyframes finite { to { translate: 10px 0; } }
    @keyframes ambient { to { rotate: 1turn; } }
    .finite { animation: finite 10s linear both; }
    .ambient { animation: ambient 10s linear infinite; }
  </style><main class="scope"><i class="inside finite"></i><i class="ambient"></i></main><i class="outside finite"></i>`);
  await send('Page.navigate', { url: `data:text/html,${fixture}` });
  await waitFor(send, `document.readyState==='complete'&&document.getAnimations().length===3`, 'browser helper animation fixtures');

  if (await evaluate(send, '6 * 7') !== 42) throw new Error('page evaluation did not return its serialized value');
  if (await evaluate(send, `Promise.resolve('ready')`, { awaitPromise: true }) !== 'ready') {
    throw new Error('page evaluation did not await its promise');
  }

  await evaluate(send, `(()=>{throw new Error('page seam exploded')})()`).then(
    () => { throw new Error('page evaluation exception was accepted'); },
    (error) => {
      if (!String(error).includes('page seam exploded')) throw error;
    },
  );

  await waitFor(send, `(()=>{throw new Error('wait seam exploded')})()`, 'impossible wait', 1_000).then(
    () => { throw new Error('wait expression exception was accepted'); },
    (error) => {
      if (!String(error).includes('wait seam exploded')) throw error;
    },
  );

  const finished = await finishFiniteAnimations(send, '.scope');
  const states = await evaluate(send, `(()=>Object.fromEntries(['inside','ambient','outside'].map((name)=>[name,document.querySelector('.'+name).getAnimations()[0].playState])))()`);
  if (finished !== 1 || JSON.stringify(states) !== JSON.stringify({ inside: 'finished', ambient: 'running', outside: 'running' })) {
    throw new Error(`finite animation scope leaked: ${JSON.stringify({ finished, states })}`);
  }

  await finishFiniteAnimations(send, '.missing').then(
    () => { throw new Error('missing animation scope was accepted'); },
    (error) => {
      if (!String(error).includes('animation scope not found: .missing')) throw error;
    },
  );

  console.log('Browser helper contract passed evaluation values, promises, exceptions, and scoped animation behavior.');
} finally {
  await browser.close();
}
