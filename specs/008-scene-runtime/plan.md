# Baseline plan: 404 rendering, parallax, and atmosphere

**Date**: 2026-09-05 | **Spec**: [spec.md](spec.md)

## Summary

The committed renderer uses native SVG/CSS animation plus bounded canvas effects. No Three.js, GSAP, or client framework migration is part of this baseline.

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

- `assets/404-renderer.js`
- `assets/404-scene.js`
- `assets/404-motion.js`
- `assets/404.css`
- `404.html`
- `assets/ui-overlay.js`

Supporting documents: [research.md](research.md), [data-model.md](data-model.md),
[contracts/behavior.md](contracts/behavior.md).

## Requirement traceability

| Requirement | Story | Documentation task | Verification | Evidence |
| --- | --- | --- | --- | --- |
| FR-001 | US1 | T003 | T005, automated | [parallax-stability.mjs](../../tests/parallax-stability.mjs) |
| FR-002 | US1 | T003 | T005, automated | [parallax-plane-contract.mjs](../../tests/parallax-plane-contract.mjs), [parallax-browser-stability.mjs](../../tests/parallax-browser-stability.mjs) |
| FR-003 | US1 | T003 | T005, automated | [responsive-scene-density.mjs](../../tests/responsive-scene-density.mjs), [scene-placement-layers.mjs](../../tests/scene-placement-layers.mjs) |
| FR-004 | US2 | T004 | T005, automated | [scene-renderer-budget.mjs](../../tests/scene-renderer-budget.mjs), [night-visibility-browser.mjs](../../tests/night-visibility-browser.mjs) |
| FR-005 | US2 | T004 | T005, automated | [scene-atmosphere.mjs](../../tests/scene-atmosphere.mjs), [night-sky-reactivity.mjs](../../tests/night-sky-reactivity.mjs), [night-visibility-browser.mjs](../../tests/night-visibility-browser.mjs) |
| FR-006 | US2 | T004 | T005, automated | [scene-flash-safety.mjs](../../tests/scene-flash-safety.mjs), [parallax-browser-stability.mjs](../../tests/parallax-browser-stability.mjs) |
| FR-007 | US2 | T004 | T005, automated | [scene-atmosphere.mjs](../../tests/scene-atmosphere.mjs), [weather-flow.mjs](../../tests/weather-flow.mjs), [marshmallow-cooking.mjs](../../tests/marshmallow-cooking.mjs) |

SC-001 and SC-003 use story-specific checks above. SC-002 uses T007.
A named suite is a coverage pointer, not proof beyond its assertions.

## Verification and gaps

Inspect consecutive animation phases for flashes and collect device-specific performance measurements before claiming universal smoothness. Current tests do not establish an FPS SLA.

See [tasks.md](tasks.md) and the shared [audit receipt](../audit.md) for actual
outcomes. Source checks do not replace manual visual, privacy, or host checks.

## Maintenance sequence

Record provenance and interfaces before checking US1 and US2. US1 is the smallest
independent acceptance slice. Both stories already exist, so this backfill does
not require reconstruction or redeployment. A future defect gets a regression
test and a bounded fix.
