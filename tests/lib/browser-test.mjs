const pollInterval = 25;

export const pause = (duration) => new Promise((resolve) => setTimeout(resolve, duration));

export async function evaluate(send, expression, options = {}) {
  const response = await send('Runtime.evaluate', {
    expression,
    ...options,
    returnByValue: true,
  });
  if (response.exceptionDetails) {
    throw new Error(response.exceptionDetails.exception?.description ?? response.exceptionDetails.text);
  }
  return response.result.value;
}

export async function waitFor(send, expression, description = expression, timeout = 10_000) {
  const deadline = performance.now() + timeout;
  while (performance.now() < deadline) {
    const value = await evaluate(send, expression);
    if (value) return value;
    await pause(pollInterval);
  }
  throw new Error(`timed out waiting for ${description} after ${timeout}ms`);
}

// A ready selector can still belong to the previous document, especially on
// reload. Require a new document before consulting application readiness.
export async function navigate(send, url) {
  const previous = await evaluate(send, 'performance.timeOrigin');
  const response = await send(url === undefined ? 'Page.reload' : 'Page.navigate', url === undefined ? {} : { url });
  if (response.errorText) throw new Error(`navigation failed: ${response.errorText}`);
  const deadline = performance.now() + 10_000;
  while (performance.now() < deadline) {
    try {
      const ready = await evaluate(send, `performance.timeOrigin!==${previous}&&document.readyState==='complete'`);
      if (ready) return;
    } catch (error) {
      // Context replacement is expected during navigation. Page exceptions and
      // unrelated protocol failures still fail immediately.
      if (!/Cannot find context|Execution context was destroyed/.test(error.message ?? String(error))) throw error;
    }
    await pause(pollInterval);
  }
  throw new Error(`timed out waiting for a new document: ${url ?? 'reload'}`);
}

export async function waitForFrames(send, count = 2) {
  await evaluate(
    send,
    `new Promise((resolve)=>{let remaining=${count};const next=()=>{if(--remaining<=0)resolve(true);else requestAnimationFrame(next)};requestAnimationFrame(next)})`,
    {
      awaitPromise: true,
    },
  );
}

export async function finishFiniteAnimations(send, selector) {
  await waitForFrames(send);
  return evaluate(send, `(()=>{const scope=document.querySelector(${JSON.stringify(selector)});if(!scope)throw new Error(${JSON.stringify(`animation scope not found: ${selector}`)});let finished=0;for(const animation of document.getAnimations()){const target=animation.effect?.target;const timing=animation.effect?.getComputedTiming();if(target&&scope.contains(target)&&Number.isFinite(timing?.endTime)){animation.finish();finished+=1}}return finished})()`);
}

export async function hoverElement(send, selector, timeout = 10_000) {
  await evaluate(send, `(()=>{document.documentElement.style.scrollBehavior='auto';document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center',behavior:'auto'})})()`);
  await waitFor(send, `(()=>{const box=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return box.bottom>0&&box.top<innerHeight})()`, `${selector} visible after scroll`, timeout);
  const deadline = performance.now() + timeout;
  let lastHit = null;
  while (performance.now() < deadline) {
    await waitForFrames(send);
    const { x, y, hit } = await evaluate(send, `(()=>{const target=document.querySelector(${JSON.stringify(selector)});const box=target.getBoundingClientRect();const x=Math.min(innerWidth-1,Math.max(0,box.left+box.width/2));const y=Math.min(innerHeight-1,Math.max(0,box.top+box.height/2));const hit=document.elementFromPoint(x,y);return {x,y,hit:hit?.tagName.toLowerCase()+(hit?.className?.baseVal||hit?.className?'.'+String(hit.className.baseVal||hit.className).trim().replace(/\\s+/g,'.'):'')}})()`);
    lastHit = hit;
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
    const hovered = await evaluate(send, `document.querySelector(${JSON.stringify(selector)}).matches(':hover')`);
    if (hovered) {
      await waitForFrames(send);
      const stable = await evaluate(send, `document.querySelector(${JSON.stringify(selector)}).matches(':hover')`);
      if (stable) return;
    }
    await pause(pollInterval);
  }
  throw new Error(`timed out acquiring ${selector} hover after ${timeout}ms (last hit: ${lastHit ?? 'none'})`);
}
