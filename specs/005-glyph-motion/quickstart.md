# Validate shared glyphs and page motion

Run from the repository root with Node.js 24 and Chrome/Chromium installed.
Use isolated fixtures, not a personal browser.

## Automated checks

```sh
node scripts/lint.mjs
node --test --test-concurrency=2 --test-timeout=60000 tests/glyph-enhancement.mjs tests/glyph-site-placement.mjs tests/glyph-colors.mjs tests/detail-row-layout.mjs tests/project-evidence-layout.mjs tests/glyph-layout-stability.mjs tests/hobby-motion-contract.mjs tests/hobby-sequence.mjs tests/non404-motion.mjs tests/page-transition-contract.mjs tests/page-transitions.mjs tests/loading-state-contract.mjs
```

Expected: lint and every listed test pass without retries. For combined changes,
run the complete gate instead of only the focused list:

```sh
node --test --test-concurrency=2 --test-timeout=60000 tests/*.mjs
```

See [plan.md](plan.md) for coverage and [../audit.md](../audit.md) for the actual
backfill receipt. A command listed here is not a passing result.

## Manual checks

Review visual rhythm and contrast after artwork edits; deterministic geometry checks do not measure aesthetic quality.

Keep manual checks pending until performed for the relevant revision. Follow
[RELEASING.md](../../RELEASING.md) for authorized delivery. This guide does not
authorize a push, merge, deployment, or live mutation.
