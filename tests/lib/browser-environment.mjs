export const fixedNow = Date.UTC(2026, 8, 3, 12);

// Wall-clock state must not depend on the host date. Animation timestamps and
// real browser timers remain native so integration tests exercise scheduling.
export const browserEnvironment = `(() => {
  const NativeDate = Date;
  function FixedDate(...args) {
    if (!new.target) return new NativeDate(${fixedNow}).toString();
    return Reflect.construct(NativeDate, args.length ? args : [${fixedNow}], new.target);
  }
  Object.setPrototypeOf(FixedDate, NativeDate);
  FixedDate.prototype = NativeDate.prototype;
  FixedDate.now = () => ${fixedNow};
  window.Date = FixedDate;
  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input, options) => {
    const url = new URL(input instanceof Request ? input.url : input, location.href);
    if (url.origin !== location.origin) return Promise.reject(new Error('External fetch requires a test fixture: ' + url.origin));
    return nativeFetch(input, options);
  };
})();`;
