const pollInterval = 25;

export const pause = (duration) => new Promise((resolve) => setTimeout(resolve, duration));

export async function waitFor(send, expression, description = expression, timeout = 10_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true });
    if (result.result.value) return result.result.value;
    await pause(pollInterval);
  }
  throw new Error(`timed out waiting for ${description} after ${timeout}ms`);
}

export async function waitForFrames(send, count = 2) {
  await send('Runtime.evaluate', {
    expression: `new Promise((resolve)=>{let remaining=${count};const next=()=>{if(--remaining<=0)resolve(true);else requestAnimationFrame(next)};requestAnimationFrame(next)})`,
    awaitPromise: true,
    returnByValue: true,
  });
}

export async function hoverElement(send, selector, timeout = 10_000) {
  await send('Runtime.evaluate', {
    expression: `(()=>{document.documentElement.style.scrollBehavior='auto';document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center',behavior:'auto'})})()`,
  });
  await waitFor(send, `(()=>{const box=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return box.bottom>0&&box.top<innerHeight})()`, `${selector} visible after scroll`, timeout);
  const deadline = Date.now() + timeout;
  let lastHit = null;
  while (Date.now() < deadline) {
    await waitForFrames(send);
    const target = await send('Runtime.evaluate', {
      expression: `(()=>{const target=document.querySelector(${JSON.stringify(selector)});const box=target.getBoundingClientRect();const x=Math.min(innerWidth-1,Math.max(0,box.left+box.width/2));const y=Math.min(innerHeight-1,Math.max(0,box.top+box.height/2));const hit=document.elementFromPoint(x,y);return {x,y,hit:hit?.tagName.toLowerCase()+(hit?.className?.baseVal||hit?.className?'.'+String(hit.className.baseVal||hit.className).trim().replace(/\\s+/g,'.'):'')}})()`,
      returnByValue: true,
    });
    const { x, y, hit } = target.result.value;
    lastHit = hit;
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
    const hovered = await send('Runtime.evaluate', {
      expression: `document.querySelector(${JSON.stringify(selector)}).matches(':hover')`,
      returnByValue: true,
    });
    if (hovered.result.value) return;
    await pause(pollInterval);
  }
  throw new Error(`timed out acquiring ${selector} hover after ${timeout}ms (last hit: ${lastHit ?? 'none'})`);
}
