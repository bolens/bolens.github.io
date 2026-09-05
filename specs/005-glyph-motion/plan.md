# Baseline plan: Shared glyphs and page motion

**Date**: 2026-09-05 | **Spec**: [spec.md](spec.md)

## Summary

Keep native page navigation and shared motion gates. Tests seek authored animation phases rather than sampling arbitrary wall-clock instants.

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

- `assets/trail-glyphs.svg`
- `assets/trail-glyphs.js`
- `assets/hobby-motion.js`
- `assets/page-transitions.js`
- `assets/loading-state.js`
- `assets/site.css`
- `assets/home.css`
- `assets/pages.css`
- `assets/about.css`
- `assets/work.css`
- `assets/case-study.css`

Supporting documents: [research.md](research.md), [data-model.md](data-model.md),
[contracts/behavior.md](contracts/behavior.md).

## Requirement traceability

| Requirement | Story | Documentation task | Verification | Evidence |
| --- | --- | --- | --- | --- |
| FR-001 | US1 | T003 | T005, automated | [glyph-enhancement.mjs](../../tests/glyph-enhancement.mjs), [glyph-site-placement.mjs](../../tests/glyph-site-placement.mjs) |
| FR-002 | US1 | T003 | T005, automated | [glyph-colors.mjs](../../tests/glyph-colors.mjs) |
| FR-003 | US1 | T003 | T005, automated | [detail-row-layout.mjs](../../tests/detail-row-layout.mjs), [project-evidence-layout.mjs](../../tests/project-evidence-layout.mjs), [glyph-layout-stability.mjs](../../tests/glyph-layout-stability.mjs) |
| FR-004 | US2 | T004 | T005, automated | [hobby-motion-contract.mjs](../../tests/hobby-motion-contract.mjs), [hobby-sequence.mjs](../../tests/hobby-sequence.mjs), [non404-motion.mjs](../../tests/non404-motion.mjs) |
| FR-005 | US2 | T004 | T005, automated | [page-transition-contract.mjs](../../tests/page-transition-contract.mjs), [page-transitions.mjs](../../tests/page-transitions.mjs) |
| FR-006 | US2 | T004 | T005, automated | [loading-state-contract.mjs](../../tests/loading-state-contract.mjs), [non404-motion.mjs](../../tests/non404-motion.mjs) |

SC-001 and SC-003 use story-specific checks above. SC-002 uses T007.
A named suite is a coverage pointer, not proof beyond its assertions.

## Verification and gaps

Review visual rhythm and contrast after artwork edits; deterministic geometry checks do not measure aesthetic quality.

See [tasks.md](tasks.md) and the shared [audit receipt](../audit.md) for actual
outcomes. Source checks do not replace manual visual, privacy, or host checks.

## Maintenance sequence

Record provenance and interfaces before checking US1 and US2. US1 is the smallest
independent acceptance slice. Both stories already exist, so this backfill does
not require reconstruction or redeployment. A future defect gets a regression
test and a bounded fix.
