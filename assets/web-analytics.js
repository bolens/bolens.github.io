// Optional aggregate analytics: production hosts only; honor browser opt-outs.
(() => {
  const hosts = new Set(["michael.bolens.dev", "bolens.github.io"]);
  const optedOut = navigator.globalPrivacyControl === true
    || navigator.doNotTrack === '1' || window.doNotTrack === '1';
  if (!['http:', 'https:'].includes(location.protocol) || !hosts.has(location.hostname)
    || optedOut || document.getElementById('cloudflare-web-analytics')) return;
  const beacon = document.createElement('script');
  beacon.id = 'cloudflare-web-analytics';
  beacon.type = 'module';
  beacon.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  beacon.dataset.cfBeacon = JSON.stringify({ token: "85c4901a5de6420c967e687e3a22b096" });
  document.body.append(beacon);
})();
