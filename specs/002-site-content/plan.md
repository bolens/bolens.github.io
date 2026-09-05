# Baseline plan: Site content and generation

**Date**: 2026-09-05 | **Spec**: [spec.md](spec.md)

## Summary

Keep JSON inputs and the existing generator as the source of truth. This is an observed architecture, not a newly chosen migration.

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

- `data/projects.json`
- `data/themes.json`
- `scripts/build-site.mjs`
- `assets/project-data.js`
- `assets/theme-data.js`
- `assets/theme-tokens.css`
- `index.html`
- `about/index.html`
- `work/index.html`
- `case-studies/`
- `sitemap.xml`
- `llms.txt`
- `robots.txt`
- `assets/favicon.svg`
- `assets/social-card.svg`
- `assets/social-card.png`
- `assets/social-card-v2.png`

Supporting documents: [research.md](research.md), [data-model.md](data-model.md),
[contracts/behavior.md](contracts/behavior.md).

## Requirement traceability

| Requirement | Story | Documentation task | Verification | Evidence |
| --- | --- | --- | --- | --- |
| FR-001 | US1 | T003 | T005, automated | [build-site-contract.mjs](../../tests/build-site-contract.mjs), [command-data-contract.mjs](../../tests/command-data-contract.mjs) |
| FR-002 | US1 | T003 | T005, automated | [check-site-contract.mjs](../../tests/check-site-contract.mjs), [site-checker-validation.mjs](../../tests/site-checker-validation.mjs), [browser-smoke.mjs](../../tests/browser-smoke.mjs) |
| FR-003 | US1 | T003 | T006, manual | publication privacy and editorial review |
| FR-004 | US2 | T004 | T005, automated | [build-site-contract.mjs](../../tests/build-site-contract.mjs), [build-and-lint-validation.mjs](../../tests/build-and-lint-validation.mjs) |
| FR-005 | US2 | T004 | T005, automated | [build-site-contract.mjs](../../tests/build-site-contract.mjs), [build-and-lint-validation.mjs](../../tests/build-and-lint-validation.mjs) |
| FR-006 | US2 | T004 | T005, automated | [build-site-contract.mjs](../../tests/build-site-contract.mjs), [build-and-lint-validation.mjs](../../tests/build-and-lint-validation.mjs) |

SC-001 and SC-003 use story-specific checks above. SC-002 uses T007.
A named suite is a coverage pointer, not proof beyond its assertions.

## Verification and gaps

Review factual public claims and private-data exposure before each publication. Application tests cannot establish either on their own.

See [tasks.md](tasks.md) and the shared [audit receipt](../audit.md) for actual
outcomes. Source checks do not replace manual visual, privacy, or host checks.

## Maintenance sequence

Record provenance and interfaces before checking US1 and US2. US1 is the smallest
independent acceptance slice. Both stories already exist, so this backfill does
not require reconstruction or redeployment. A future defect gets a regression
test and a bounded fix.
