# Validate 404 terrain, habitat, cryptids, and camp

Run from the repository root with Node.js 24 and Chrome/Chromium installed.
Use isolated fixtures, not a personal browser.

## Automated checks

```sh
node scripts/lint.mjs
node --test --test-concurrency=2 --test-timeout=60000 tests/landscape-asset-reuse.mjs tests/terrain-detail-layers.mjs tests/asset-region-contract.mjs tests/terrain-opacity-contract.mjs tests/glyph-paint-order.mjs tests/weather-overlay-contract.mjs tests/scene-habitat-placement.mjs tests/route-continuity.mjs tests/scene-placement-layers.mjs tests/cryptid-anatomy.mjs tests/daytime-cryptid-poses.mjs tests/misty-ground-and-campers.mjs tests/firepit-layout.mjs tests/fire-motion-contract.mjs tests/scene-time.mjs tests/condition-reactivity.mjs tests/marshmallow-cooking.mjs tests/camp-food-detail.mjs
```

Expected: lint and every listed test pass without retries. For combined changes,
run the complete gate instead of only the focused list:

```sh
node --test --test-concurrency=2 --test-timeout=60000 tests/*.mjs
```

See [plan.md](plan.md) for coverage and [../audit.md](../audit.md) for the actual
backfill receipt. A command listed here is not a passing result.

## Manual checks

Inspect silhouettes, species/folklore interpretation, camp clearance, and river continuity at desktop and narrow widths. Source selectors cannot prove every placement is visually plausible.

Keep manual checks pending until performed for the relevant revision. Follow
[RELEASING.md](../../RELEASING.md) for authorized delivery. This guide does not
authorize a push, merge, deployment, or live mutation.
