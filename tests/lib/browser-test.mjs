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
