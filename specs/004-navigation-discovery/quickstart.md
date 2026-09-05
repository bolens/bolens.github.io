# Validate navigation and project discovery

Run from the repository root with Node.js 24 and Chrome/Chromium installed.
Use isolated fixtures, not a personal browser.

## Automated checks

```sh
node scripts/lint.mjs
node --test --test-concurrency=2 --test-timeout=60000 tests/work-filters.mjs tests/work-update-boundaries.mjs tests/work-data-validation.mjs tests/case-navigation.mjs tests/browser-navigation.mjs
```

Expected: lint and every listed test pass without retries. For combined changes,
run the complete gate instead of only the focused list:

```sh
node --test --test-concurrency=2 --test-timeout=60000 tests/*.mjs
```

See [plan.md](plan.md) for coverage and [../audit.md](../audit.md) for the actual
backfill receipt. A command listed here is not a passing result.

## Manual checks

Confirm deep-link reading context and no-JavaScript navigation after document structure changes.

Keep manual checks pending until performed for the relevant revision. Follow
[RELEASING.md](../../RELEASING.md) for authorized delivery. This guide does not
authorize a push, merge, deployment, or live mutation.
