# Baseline plan: 404 terrain, habitat, cryptids, and camp

**Date**: 2026-09-05 | **Spec**: [spec.md](spec.md)

## Summary

Retain shared scalable symbols and inherited styling. Placement and named regions are the editing boundaries, rather than duplicating artwork per weather/time state.

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

- `404.html`
- `assets/404.css`
- `assets/404-time.js`
- `assets/404-scene.js`

Supporting documents: [research.md](research.md), [data-model.md](data-model.md),
[contracts/behavior.md](contracts/behavior.md).

## Requirement traceability

| Requirement | Story | Documentation task | Verification | Evidence |
| --- | --- | --- | --- | --- |
| FR-001 | US1 | T003 | T005, automated | [landscape-asset-reuse.mjs](../../tests/landscape-asset-reuse.mjs), [terrain-detail-layers.mjs](../../tests/terrain-detail-layers.mjs), [asset-region-contract.mjs](../../tests/asset-region-contract.mjs) |
| FR-002 | US1 | T003 | T005, automated | [terrain-opacity-contract.mjs](../../tests/terrain-opacity-contract.mjs), [glyph-paint-order.mjs](../../tests/glyph-paint-order.mjs), [weather-overlay-contract.mjs](../../tests/weather-overlay-contract.mjs) |
| FR-003 | US1 | T003 | T005, automated | [scene-habitat-placement.mjs](../../tests/scene-habitat-placement.mjs), [route-continuity.mjs](../../tests/route-continuity.mjs), [scene-placement-layers.mjs](../../tests/scene-placement-layers.mjs) |
| FR-004 | US2 | T004 | T005, automated | [cryptid-anatomy.mjs](../../tests/cryptid-anatomy.mjs), [daytime-cryptid-poses.mjs](../../tests/daytime-cryptid-poses.mjs), [misty-ground-and-campers.mjs](../../tests/misty-ground-and-campers.mjs) |
| FR-005 | US2 | T004 | T005, automated | [firepit-layout.mjs](../../tests/firepit-layout.mjs), [fire-motion-contract.mjs](../../tests/fire-motion-contract.mjs) |
| FR-006 | US2 | T004 | T005, automated | [scene-time.mjs](../../tests/scene-time.mjs), [condition-reactivity.mjs](../../tests/condition-reactivity.mjs), [marshmallow-cooking.mjs](../../tests/marshmallow-cooking.mjs), [camp-food-detail.mjs](../../tests/camp-food-detail.mjs) |

SC-001 and SC-003 use story-specific checks above. SC-002 uses T007.
A named suite is a coverage pointer, not proof beyond its assertions.

## Verification and gaps

Inspect silhouettes, species/folklore interpretation, camp clearance, and river continuity at desktop and narrow widths. Source selectors cannot prove every placement is visually plausible.

See [tasks.md](tasks.md) and the shared [audit receipt](../audit.md) for actual
outcomes. Source checks do not replace manual visual, privacy, or host checks.

## Maintenance sequence

Record provenance and interfaces before checking US1 and US2. US1 is the smallest
independent acceptance slice. Both stories already exist, so this backfill does
not require reconstruction or redeployment. A future defect gets a regression
test and a bounded fix.
