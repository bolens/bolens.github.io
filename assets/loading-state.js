(() => {
  const root = document.documentElement;
  let finished = false;
  const reveal = () => {
    if (finished) return;
    finished = true;
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('is-loading')));
  };
  if (document.readyState === 'complete') reveal();
  else addEventListener('load', reveal, { once: true });
  setTimeout(reveal, 3000);
})();
