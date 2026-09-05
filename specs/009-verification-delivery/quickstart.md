# Validate verification, delivery, and repository tooling

Run from the repository root with Node.js 24 and Chrome/Chromium installed.
Use isolated fixtures, not a personal browser.

## Automated checks

```sh
node scripts/lint.mjs
node --test --test-concurrency=2 --test-timeout=60000 tests/build-and-lint-validation.mjs tests/check-site-contract.mjs tests/site-checker-validation.mjs tests/browser-helper-contract.mjs tests/browser-isolation.mjs tests/server-lifecycle.mjs tests/ui-fixture-contract.mjs
```

Expected: lint and every listed test pass without retries. For combined changes,
run the complete gate instead of only the focused list:

```sh
node --test --test-concurrency=2 --test-timeout=60000 tests/*.mjs
```

See [plan.md](plan.md) for coverage and [../audit.md](../audit.md) for the actual
backfill receipt. A command listed here is not a passing result.

## Manual checks

Current-head CI, branch protection, upstream reusable workflow behavior, environment approvals, artifact contents, and signed-out deployment checks require host/delivery evidence. They are not proven by 433 application tests.

Keep manual checks pending until performed for the relevant revision. Follow
[RELEASING.md](../../RELEASING.md) for authorized delivery. This guide does not
authorize a push, merge, deployment, or live mutation.
