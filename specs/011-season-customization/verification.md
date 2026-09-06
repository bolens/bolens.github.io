# Verification receipt

Date: 2026-09-05. Branch: `011-season-customization`, based on
`e78b99c4baeabf601feb74df4a89e2cdce0b8d72`. Changes are local and uncommitted.
Other worktrees and the divergent local main branch were not changed.

## Baseline and regression sequence

- Existing weather tests and the lunar browser suite passed before implementation.
  The new catalog test failed because `portfolioWeather.seasons` did not exist.
- The new browser suite first failed at the missing season controls. After controls
  were implemented it reached and failed the missing autumn/winter petal state.
  Lunar assertions were authored before implementation but the initial failing
  run stopped before reaching them.
- Definition-level seasonal checks passed the first CSS draft, but visual inspection
  showed unchanged SVG copies. Region-local classes fixed the instance-tree styling.
  Added pixel checks prove rendered summer green, autumn gold, and reduced winter
  canopy coverage. The definition-only draft is not considered valid evidence.
- The first full run found two detail-layer source assertions that required an
  exact single-class attribute. They now test exact class tokens with companions.
  The focused detail and opacity suites passed all 18 tests after that repair.

## Automated evidence

- `node scripts/lint.mjs`: passed after the final source changes.
- `node --test --test-concurrency=2 --test-timeout=60000 tests/*.mjs`:
  437 passed, zero failed/skipped, about 274 seconds. Log:
  `/tmp/404-season-full-final.log`.
- `node --test --test-timeout=60000 tests/season-motion.mjs`: passed. This test
  was added after the full-run file list was expanded and was verified separately.
- `TZ=Pacific/Auckland LANG=C node --test --test-concurrency=3 --test-timeout=60000 tests/weather-fallback.mjs tests/season-customization.mjs tests/season-motion.mjs`:
  all 14 passed, zero failed/skipped, about 88 seconds. Log:
  `/tmp/404-season-determinism.log`. This includes the additional motion test.

The new browser coverage includes all 55 season/weather combinations, native
arrow-key selection of five seasons and nine lunar choices, independent resets,
environment-field preservation, external custom-phase display, absence of controls
on the home page, opaque/visible structural regions, and stable campsite anchors.
Motion checks seek two distinct phases of existing wind sway, verify no extra
continuous effects across seasons, and exercise both reduced-motion preferences.

## Rendered evidence

Chromium 152.0.7977.75 on Linux, Node.js 24.20.0, isolated profiles and owned
ephemeral loopback servers. Browser fixtures fix the wall clock to
2026-09-03 12:00 UTC and locale to en-US. Route: `/404.html`, glacier palette.

Final full-suite captures: `/tmp/404-seasons-r3OYyA/`.
Earlier instance-repair captures: `/tmp/404-seasons-d4ly2y/`.

Inspected desktop 1440×900 default/spring/summer/autumn/winter in clear daytime,
autumn rainy evening, winter snowy night, and spring drought daytime. Inspected
phone 390×844 autumn/winter, rainy evening, snowy night, and the scrolled controls.
Confirmed gold foliage, bare winter deciduous branches, retained evergreens,
seasonal ground shading, visible weather deposits, and unchanged camp composition.
Keyboard geometry checks also pass at 320×568 and 844×390. Final full-suite phone
default and all four seasonal captures were inspected after the ground tint change.

Assertions include no scene overflow and no uncaught page exceptions in the
seasonal browser flow. The existing full browser smoke suite separately covers
console/network errors, no-script routes, forced colors, and responsive pages.

## Limits

These checks cover Chromium, not Safari/Firefox or a real touch device. No screen
reader session, frame-time benchmark, or astronomical/species prediction is claimed.
Reduced-motion screenshots prove static composition; normal motion is checked by
fixed-phase assertions. No new timers, continuous effects, dependencies, storage,
location requests, or publication were added.

Spec Kit's quality checklist passed before implementation. No extension-hook
configuration exists for this repository. All feature tasks are complete.
