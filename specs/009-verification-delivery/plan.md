# Baseline plan: Verification, delivery, and repository tooling

**Date**: 2026-09-05 | **Spec**: [spec.md](spec.md)

## Summary

Retain the existing validated-main workflow_run deployment boundary and allowlisted artifact. Repository-only specs, tests, source data, and instructions are not public site content.

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

- `scripts/lint.mjs`
- `tests/check-site.mjs`
- `tests/lib/`
- `tests/README.md`
- `.githooks/pre-commit`
- `.github/workflows/lint.yml`
- `.github/workflows/deploy-pages.yml`
- `.github/workflows/auto-assign.yml`
- `.github/workflows/spec-kit.yml`
- `.specify/`
- `.agents/skills/speckit-*/`
- `AGENTS.md`
- `RELEASING.md`

Supporting documents: [research.md](research.md), [data-model.md](data-model.md),
[contracts/behavior.md](contracts/behavior.md).

## Requirement traceability

| Requirement | Story | Documentation task | Verification | Evidence |
| --- | --- | --- | --- | --- |
| FR-001 | US1 | T003 | T005, automated | [build-and-lint-validation.mjs](../../tests/build-and-lint-validation.mjs), [check-site-contract.mjs](../../tests/check-site-contract.mjs), [site-checker-validation.mjs](../../tests/site-checker-validation.mjs) |
| FR-002 | US1 | T003 | T005, automated | [browser-helper-contract.mjs](../../tests/browser-helper-contract.mjs), [browser-isolation.mjs](../../tests/browser-isolation.mjs), [server-lifecycle.mjs](../../tests/server-lifecycle.mjs), [ui-fixture-contract.mjs](../../tests/ui-fixture-contract.mjs) |
| FR-003 | US1 | T003 | T006, manual | inspect .github/workflows/lint.yml and current-head CI |
| FR-004 | US2 | T004 | T006, manual | RELEASING.md and host PR evidence |
| FR-005 | US2 | T004 | T006, manual | inspect .github/workflows/deploy-pages.yml and deployment artifact |
| FR-006 | US2 | T004 | T006, manual | RELEASING.md and live deployment receipt |
| FR-007 | US2 | T004 | T006, manual | inspect auto-assign.yml, spec-kit.yml, integration manifests and their host checks |

SC-001 and SC-003 use story-specific checks above. SC-002 uses T007.
A named suite is a coverage pointer, not proof beyond its assertions.

## Verification and gaps

Current-head CI, branch protection, upstream reusable workflow behavior, environment approvals, artifact contents, and signed-out deployment checks require host/delivery evidence. They are not proven by 433 application tests.

See [tasks.md](tasks.md) and the shared [audit receipt](../audit.md) for actual
outcomes. Source checks do not replace manual visual, privacy, or host checks.

## Maintenance sequence

Record provenance and interfaces before checking US1 and US2. US1 is the smallest
independent acceptance slice. Both stories already exist, so this backfill does
not require reconstruction or redeployment. A future defect gets a regression
test and a bounded fix.
