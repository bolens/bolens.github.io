# Baseline plan: Appearance, overlays, and commands

**Date**: 2026-09-05 | **Spec**: [spec.md](spec.md)

## Summary

Keep one appearance owner and one aggregate overlay owner. Controls consume their public state instead of creating parallel persistence.

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

- `assets/appearance-controller.js`
- `assets/appearance-picker.js`
- `assets/ui-overlay.js`
- `assets/command-palette.js`
- `assets/site.css`
- `data/themes.json`

Supporting documents: [research.md](research.md), [data-model.md](data-model.md),
[contracts/behavior.md](contracts/behavior.md).

## Requirement traceability

| Requirement | Story | Documentation task | Verification | Evidence |
| --- | --- | --- | --- | --- |
| FR-001 | US1 | T003 | T005, automated | [appearance-controller.mjs](../../tests/appearance-controller.mjs), [theme-smoke.mjs](../../tests/theme-smoke.mjs) |
| FR-002 | US1 | T003 | T005, automated | [appearance-controller.mjs](../../tests/appearance-controller.mjs), [interaction-contract.mjs](../../tests/interaction-contract.mjs) |
| FR-003 | US1 | T003 | T005, automated | [appearance-controller.mjs](../../tests/appearance-controller.mjs) |
| FR-004 | US2 | T004 | T005, automated | [picker-and-shortcuts.mjs](../../tests/picker-and-shortcuts.mjs), [interaction-contract.mjs](../../tests/interaction-contract.mjs) |
| FR-005 | US2 | T004 | T005, automated | [command-behavior.mjs](../../tests/command-behavior.mjs), [command-data-contract.mjs](../../tests/command-data-contract.mjs) |
| FR-006 | US2 | T004 | T005, automated | [command-failures.mjs](../../tests/command-failures.mjs), [picker-and-shortcuts.mjs](../../tests/picker-and-shortcuts.mjs), [overlay-state.mjs](../../tests/overlay-state.mjs) |

SC-001 and SC-003 use story-specific checks above. SC-002 uses T007.
A named suite is a coverage pointer, not proof beyond its assertions.

## Verification and gaps

Inspect actual focus visibility and labels on desktop and narrow screens after visual control changes.

See [tasks.md](tasks.md) and the shared [audit receipt](../audit.md) for actual
outcomes. Source checks do not replace manual visual, privacy, or host checks.

## Maintenance sequence

Record provenance and interfaces before checking US1 and US2. US1 is the smallest
independent acceptance slice. Both stories already exist, so this backfill does
not require reconstruction or redeployment. A future defect gets a regression
test and a bounded fix.
