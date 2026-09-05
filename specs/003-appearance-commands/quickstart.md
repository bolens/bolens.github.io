# Validate appearance, overlays, and commands

Run from the repository root with Node.js 24 and Chrome/Chromium installed.
Use isolated fixtures, not a personal browser.

## Automated checks

```sh
node scripts/lint.mjs
node --test --test-concurrency=2 --test-timeout=60000 tests/appearance-controller.mjs tests/theme-smoke.mjs tests/interaction-contract.mjs tests/picker-and-shortcuts.mjs tests/command-behavior.mjs tests/command-data-contract.mjs tests/command-failures.mjs tests/overlay-state.mjs
```

Expected: lint and every listed test pass without retries. For combined changes,
run the complete gate instead of only the focused list:

```sh
node --test --test-concurrency=2 --test-timeout=60000 tests/*.mjs
```

See [plan.md](plan.md) for coverage and [../audit.md](../audit.md) for the actual
backfill receipt. A command listed here is not a passing result.

## Manual checks

Inspect actual focus visibility and labels on desktop and narrow screens after visual control changes.

Keep manual checks pending until performed for the relevant revision. Follow
[RELEASING.md](../../RELEASING.md) for authorized delivery. This guide does not
authorize a push, merge, deployment, or live mutation.
