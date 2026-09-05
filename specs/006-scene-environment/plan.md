# Baseline plan: 404 conditions, time, and lighting

**Date**: 2026-09-05 | **Spec**: [spec.md](spec.md)

## Summary

Keep appearance, weather, time, and motion as separate state owners with explicit subscriptions. Weather material changes consume these owners rather than independently guessing time.

This is a maintenance and verification map, not an invented implementation sequence.

## Technical Context

Static HTML/CSS/SVG and browser JavaScript, Node.js 24 tooling, and isolated
Chromium tests. This documentation package introduces no dependency, migration,
new timer, or deployment change. Performance claims are limited to tested bounds
and configured budgets.

## Constitution Check

- Accurate content: no new editorial or private-data claims.
- Single-source generation: retain the owners below, not independent output edits.
- Resilient behavior: preserve applicable keyboard, motion, responsive, and optional-API fallbacks.
- Isolated verification: follow [quickstart.md](quickstart.md).
- Reviewed deployment: a local audit is not host or publication evidence.

No constitutional exception is required. The explicit retrospective policy change
belongs to AGENTS.md and project-owned memory, not managed templates.

## Project Structure

- `assets/404-weather.js`
- `assets/404-time.js`
- `assets/404-motion.js`
- `assets/404.css`
- `data/themes.json`
- `assets/appearance-picker.js`
- `404.html`

Supporting documents: [research.md](research.md), [data-model.md](data-model.md),
[contracts/behavior.md](contracts/behavior.md).

## Requirement traceability

| Requirement | Story | Documentation task | Verification | Evidence |
| --- | --- | --- | --- | --- |
| FR-001 | US1 | T003 | T005, automated | [weather-fallback.mjs](../../tests/weather-fallback.mjs) |
| FR-002 | US1 | T003 | T005, automated | [scene-time.mjs](../../tests/scene-time.mjs) |
| FR-003 | US1 | T003 | T005, automated | [scene-motion-profiles.mjs](../../tests/scene-motion-profiles.mjs), [weather-fallback.mjs](../../tests/weather-fallback.mjs), [scene-time.mjs](../../tests/scene-time.mjs) |
| FR-004 | US2 | T004 | T005, automated | [condition-reactivity.mjs](../../tests/condition-reactivity.mjs), [weather-overlay-contract.mjs](../../tests/weather-overlay-contract.mjs), [misty-ground-and-campers.mjs](../../tests/misty-ground-and-campers.mjs) |
| FR-005 | US2 | T004 | T005, automated | [scene-time.mjs](../../tests/scene-time.mjs), [surface-lighting.mjs](../../tests/surface-lighting.mjs) |
| FR-006 | US2 | T004 | T005, automated | [windy-condition.mjs](../../tests/windy-condition.mjs), [scene-motion-profiles.mjs](../../tests/scene-motion-profiles.mjs) |

SC-001 and SC-003 use story-specific checks above. SC-002 uses T007.
A named suite is a coverage pointer, not proof beyond its assertions.

## Verification and gaps

Review weather readability and material realism in screenshots. No claim of meteorological or astronomical accuracy beyond the documented illustrative rules.

See [tasks.md](tasks.md) and the shared [audit receipt](../audit.md) for actual
outcomes. Source checks do not replace manual visual, privacy, or host checks.

## Maintenance sequence

Record provenance and interfaces before checking US1 and US2. US1 is the smallest
independent acceptance slice. Both stories already exist, so this backfill does
not require reconstruction or redeployment. A future defect gets a regression
test and a bounded fix.
