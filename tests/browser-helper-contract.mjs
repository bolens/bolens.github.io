import { startBrowser } from './lib/cdp-browser.mjs';
import { finishFiniteAnimations, waitFor } from './lib/browser-test.mjs';

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

  const finished = await finishFiniteAnimations(send, '.scope');
  const states = await send('Runtime.evaluate', {
    expression: `(()=>Object.fromEntries(['inside','ambient','outside'].map((name)=>[name,document.querySelector('.'+name).getAnimations()[0].playState])))()`,
    returnByValue: true,
  });
  if (finished !== 1 || JSON.stringify(states.result.value) !== JSON.stringify({ inside: 'finished', ambient: 'running', outside: 'running' })) {
    throw new Error(`finite animation scope leaked: ${JSON.stringify({ finished, states: states.result.value })}`);
  }

  await finishFiniteAnimations(send, '.missing').then(
    () => { throw new Error('missing animation scope was accepted'); },
    (error) => {
      if (!String(error).includes('animation scope not found: .missing')) throw error;
    },
  );

  console.log('Browser helper contract passed scoped finite, ambient, outside, and missing-target animation behavior.');
} finally {
  await browser.close();
}
