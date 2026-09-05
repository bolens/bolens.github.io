# Validate 404 rendering, parallax, and atmosphere

Run from the repository root with Node.js 24 and Chrome/Chromium installed.
Use isolated fixtures, not a personal browser.

## Automated checks

```sh
node scripts/lint.mjs
node --test --test-concurrency=2 --test-timeout=60000 tests/parallax-stability.mjs tests/parallax-plane-contract.mjs tests/parallax-browser-stability.mjs tests/responsive-scene-density.mjs tests/scene-placement-layers.mjs tests/scene-renderer-budget.mjs tests/night-visibility-browser.mjs tests/scene-atmosphere.mjs tests/night-sky-reactivity.mjs tests/scene-flash-safety.mjs tests/weather-flow.mjs tests/marshmallow-cooking.mjs
```

Expected: lint and every listed test pass without retries. For combined changes,
run the complete gate instead of only the focused list:

```sh
node --test --test-concurrency=2 --test-timeout=60000 tests/*.mjs
```

See [plan.md](plan.md) for coverage and [../audit.md](../audit.md) for the actual
backfill receipt. A command listed here is not a passing result.

## Manual checks

Inspect consecutive animation phases for flashes and collect device-specific performance measurements before claiming universal smoothness. Current tests do not establish an FPS SLA.

Keep manual checks pending until performed for the relevant revision. Follow
[RELEASING.md](../../RELEASING.md) for authorized delivery. This guide does not
authorize a push, merge, deployment, or live mutation.
