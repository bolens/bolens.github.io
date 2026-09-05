# Validate site content and generation

Run from the repository root with Node.js 24 and Chrome/Chromium installed.
Use isolated fixtures, not a personal browser.

## Automated checks

```sh
node scripts/lint.mjs
node --test --test-concurrency=2 --test-timeout=60000 tests/build-site-contract.mjs tests/command-data-contract.mjs tests/check-site-contract.mjs tests/site-checker-validation.mjs tests/browser-smoke.mjs tests/build-and-lint-validation.mjs
```

Expected: lint and every listed test pass without retries. For combined changes,
run the complete gate instead of only the focused list:

```sh
node --test --test-concurrency=2 --test-timeout=60000 tests/*.mjs
```

See [plan.md](plan.md) for coverage and [../audit.md](../audit.md) for the actual
backfill receipt. A command listed here is not a passing result.

## Manual checks

Review factual public claims and private-data exposure before each publication. Application tests cannot establish either on their own.

Keep manual checks pending until performed for the relevant revision. Follow
[RELEASING.md](../../RELEASING.md) for authorized delivery. This guide does not
authorize a push, merge, deployment, or live mutation.
