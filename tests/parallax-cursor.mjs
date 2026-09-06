import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startBrowser } from './lib/cdp-browser.mjs';
import { startSiteServer } from './lib/site-server.mjs';
import { evaluate, navigate, waitFor, waitForFrames, finishFiniteAnimations } from './lib/browser-test.mjs';

const server = await startSiteServer(new URL('..', import.meta.url).pathname);
const captures = mkdtempSync(join(tmpdir(), '404-cursor-'));
let browser;
try {
  browser = await startBrowser();
  const { send } = browser;
  await send('Runtime.enable');
  for (const width of [1440, 390]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height:900, deviceScaleFactor:1, mobile:false });
    await navigate(send, server.origin + '/404.html');
    await waitFor(send, `document.querySelector('.hybrid-effects-ready')&&!document.documentElement.classList.contains('is-loading')`, 'scene ready');
    await finishFiniteAnimations(send, 'body');
    const near = `Number.parseFloat(document.querySelector('.cryptid-camp').style.getPropertyValue('--parallax-near-x'))`;
    const points = await evaluate(send, `(()=>{const card=document.querySelector('.lost-copy').getBoundingClientRect(),figure=document.querySelector('.cryptid-camp').getBoundingClientRect();return [{x:figure.right-12,y:Math.min(innerHeight-12,figure.bottom-12)},{x:card.left+12,y:card.top+12}]})()`);
    const samples = [];
    for (const [index, point] of points.entries()) {
      await send('Input.dispatchMouseEvent', { type:'mouseMoved', ...point });
      const expected = await evaluate(send, `(()=>{const b=document.querySelector('.cryptid-camp').getBoundingClientRect();return Math.round(Math.max(-.5,Math.min(.5,(${point.x}-b.left)/b.width-.5))*5.2*20)/20})()`);
      await waitFor(send, `Math.abs(${near}-(${expected}))<.001`, 'cursor target settled');
      samples.push(await evaluate(send, near));
      const shot = await send('Page.captureScreenshot', { format:'png', fromSurface:true });
      writeFileSync(join(captures, `${width}-${index}.png`), Buffer.from(shot.data, 'base64'));
    }
    assert.ok(samples[0] > 0 && samples[1] < 0, 'real mouse tracks both scene and foreground card');
    assert.equal(await evaluate(send, `document.querySelector('.lost-copy').contains(document.elementFromPoint(${points[1].x},${points[1].y}))`), true);
    await evaluate(send, `portfolioAppearancePicker.open()`);
    await send('Input.dispatchMouseEvent', { type:'mouseMoved', ...points[0] });
    await waitForFrames(send, 3);
    assert.equal(await evaluate(send, near), 0, 'dialog blocks cursor tracking');
    await evaluate(send, `portfolioAppearancePicker.close();portfolioAppearance.setMotion('reduced')`);
    await send('Input.dispatchMouseEvent', { type:'mouseMoved', ...points[1] });
    await waitForFrames(send, 3);
    assert.equal(await evaluate(send, near), 0, 'saved reduced motion blocks tracking');
    await evaluate(send, `portfolioAppearance.setMotion('auto')`);
    await send('Emulation.setEmulatedMedia', { features:[{name:'prefers-reduced-motion',value:'reduce'}] });
    await send('Input.dispatchMouseEvent', { type:'mouseMoved', ...points[0] });
    await waitForFrames(send, 3);
    assert.equal(await evaluate(send, near), 0, 'system reduced motion blocks tracking');
    await send('Emulation.setEmulatedMedia', { features:[] });
    assert.equal(await evaluate(send, `document.documentElement.scrollWidth<=innerWidth`), true);
  }
  console.log(`Cursor captures: ${captures}`);
} finally { await browser?.close(); await server.close(); }
