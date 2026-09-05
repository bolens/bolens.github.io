# Validate 404 conditions, time, and lighting

Run from the repository root with Node.js 24 and Chrome/Chromium installed.
Use isolated fixtures, not a personal browser.

## Automated checks

```sh
node scripts/lint.mjs
node --test --test-concurrency=2 --test-timeout=60000 tests/weather-fallback.mjs tests/scene-time.mjs tests/scene-motion-profiles.mjs tests/condition-reactivity.mjs tests/weather-overlay-contract.mjs tests/misty-ground-and-campers.mjs tests/surface-lighting.mjs tests/windy-condition.mjs
```

Expected: lint and every listed test pass without retries. For combined changes,
run the complete gate instead of only the focused list:

```sh
node --test --test-concurrency=2 --test-timeout=60000 tests/*.mjs
```

See [plan.md](plan.md) for coverage and [../audit.md](../audit.md) for the actual
backfill receipt. A command listed here is not a passing result.

## Manual checks

Review weather readability and material realism in screenshots. No claim of meteorological or astronomical accuracy beyond the documented illustrative rules.

Keep manual checks pending until performed for the relevant revision. Follow
[RELEASING.md](../../RELEASING.md) for authorized delivery. This guide does not
authorize a push, merge, deployment, or live mutation.
