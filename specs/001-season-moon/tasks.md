# Tasks: Seasonal wildlife and moon phases

**Input**: [spec.md](spec.md), [plan.md](plan.md)

## Story 1: Suitable insect conditions

- [x] T001 [US1] Add failing environment validation/reset tests in `tests/weather-fallback.mjs`.
- [x] T002 [US1] Implement optional immutable environment and eligibility in `assets/404-weather.js`.
- [x] T003 [US1] Wire canvas and SVG firefly eligibility in `assets/404-scene.js`, `assets/404.css`, and fixture tests.

## Story 2: Moon phases

- [x] T004 [US2] Add failing phase boundary, fixed-mode, and light-strength tests in `tests/scene-time.mjs`.
- [x] T005 [US2] Implement phase and override in `assets/404-time.js` without another timer.
- [x] T006 [US2] Add the named opaque moon terminator in `404.html` and `assets/404.css`.

## Verification

- [x] T007 Verify both stories with `tests/season-moon-browser.mjs`, inspect desktop/phone phase captures, and check reduced motion.
- [x] T008 Run lint and the complete README gate. Record evidence and limitations.

## Documentation audit follow-up

- [x] T009 Add explicit state boundaries and requirement/evidence mappings in `contracts/scene-state.md`, `data-model.md`, `research.md`, `quickstart.md`, and `coverage.md` during the requested specification audit.
- [ ] T010 Add independent boundary, field-normalization, subscriber-order, and override-interleaving assertions in `tests/weather-fallback.mjs` and `tests/scene-time.mjs` for the gaps recorded in `coverage.md`. This is follow-up test work, not completed by the documentation pass.

## Dependencies

T001–T003 precede environment browser checks. T004–T006 precede moon browser checks. T007 and T008 complete the pass. One writer owns the shared scene files.

## Verification receipt — 2026-09-05

- `node scripts/lint.mjs`: passed.
- `node --test --test-concurrency=2 --test-timeout=60000 tests/*.mjs`: 433 passed, zero failures/skips; local log `/tmp/404-season-moon-full-gate.log`.
- Browser phase checks passed at 1440×900 and 390×844, including native path containment, stable bounds, environment resets, and reduced motion. Rechecked after the terminator edge adjustment.
- Inspected desktop quarter-moon and phone new-moon captures in `/tmp/404-moon-*.png`. Independent behavior review found no actionable defects.
- Phase is an approximate mean lunar cycle, not an ephemeris. Environment is optional caller-supplied data; no location provider, persistence, new timer, or species-specific biological model was added.
- This pass is local on `feat/404-season-moon`; the preceding scene changes were delivered separately in PR #12.
