# Baseline plan: Navigation and project discovery

**Date**: 2026-09-05 | **Spec**: [spec.md](spec.md)

## Summary

Retain native anchors and progressively enhance existing project links. Repository update metadata is optional, not a prerequisite for rendering the project list.

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

- `assets/work-filters.js`
- `assets/case-study.js`
- `assets/work.css`
- `assets/case-study.css`
- `work/index.html`
- `case-studies/`

Supporting documents: [research.md](research.md), [data-model.md](data-model.md),
[contracts/behavior.md](contracts/behavior.md).

## Requirement traceability

| Requirement | Story | Documentation task | Verification | Evidence |
| --- | --- | --- | --- | --- |
| FR-001 | US1 | T003 | T005, automated | [work-filters.mjs](../../tests/work-filters.mjs) |
| FR-002 | US1 | T003 | T005, automated | [work-filters.mjs](../../tests/work-filters.mjs) |
| FR-003 | US1 | T003 | T005, automated | [work-update-boundaries.mjs](../../tests/work-update-boundaries.mjs), [work-data-validation.mjs](../../tests/work-data-validation.mjs) |
| FR-004 | US2 | T004 | T005, automated | [case-navigation.mjs](../../tests/case-navigation.mjs) |
| FR-005 | US2 | T004 | T005, automated | [case-navigation.mjs](../../tests/case-navigation.mjs) |
| FR-006 | US2 | T004 | T005, automated | [case-navigation.mjs](../../tests/case-navigation.mjs), [browser-navigation.mjs](../../tests/browser-navigation.mjs), [work-filters.mjs](../../tests/work-filters.mjs) |

SC-001 and SC-003 use story-specific checks above. SC-002 uses T007.
A named suite is a coverage pointer, not proof beyond its assertions.

## Verification and gaps

Confirm deep-link reading context and no-JavaScript navigation after document structure changes.

See [tasks.md](tasks.md) and the shared [audit receipt](../audit.md) for actual
outcomes. Source checks do not replace manual visual, privacy, or host checks.

## Maintenance sequence

Record provenance and interfaces before checking US1 and US2. US1 is the smallest
independent acceptance slice. Both stories already exist, so this backfill does
not require reconstruction or redeployment. A future defect gets a regression
test and a bounded fix.
