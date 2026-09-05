# Specification backfill audit

**Date**: 2026-09-05
**Baseline revision**: `8ef9aa5e124f69c255ffb434bf21505eb322c4ed`
**Scope**: User-requested retrospective subsystem specs plus the existing local season/moon contract.

## Provenance

Packages 002 through 009 are retrospective. They do not represent original
implementation plans or claim that their acceptance criteria preceded the code.
Package 001 remains the separate local season/moon feature.

## Findings and corrections

| Finding | Correction |
| --- | --- |
| Meaningful committed subsystems had no retained specification baseline | Added eight retrospective packages covering content, shared UI, navigation, glyph motion, scene state, composition, runtime, and delivery |
| Existing no-backfill wording contradicted the user's explicit audit request | Updated AGENTS.md and project-owned guide to permit requested baselines with provenance and honest evidence |
| Active season/moon spec omitted explicit normalization and precedence details | Added state contract, data model, research, quickstart, and requirement/evidence map; clarified acceptance criteria |
| No repository-wide map joined sources, tests, and specifications | Added the coverage register and links from README and tests/README |
| Project guide implied publishing the whole repository | Matched its publication guidance to the existing Pages public-file allowlist |
| Several season/moon boundaries relied on source inspection rather than independent tests | Recorded the concrete gaps in package 001 coverage.md and open task T010 |

## Verification receipt

- Required artifact, relative-link, requirement/task ID, provenance, and inventory
  checks passed for all nine packages. The temporary checker was
  `node /tmp/spec-backfill-check.mjs`.
- The audit found 57 functional requirements, 66 task IDs, and 337 valid local
  links. All 47 current public/source/workflow surfaces were classified.
- All 76 top-level test files are referenced by at least one specification or
  the coverage register. References identify evidence, not complete assertion
  coverage of every sentence.
- `.specify/scripts/bash/check-prerequisites.sh --json --require-spec --require-tasks --include-tasks`
  passed for the preserved active feature, `specs/001-season-moon`.
- `node scripts/lint.mjs` passed.
- `node --test --test-concurrency=2 --test-timeout=60000 tests/*.mjs` passed:
  433 tests, zero failures, cancellations, or skips. Local log:
  `/tmp/spec-backfill-full-gate.log`.
- `git diff --check` passed. Managed templates, scripts, integration manifests,
  generated skills, and workflow files were not changed by this audit.

The test receipt is for the current checkout, including the pre-existing local
season/moon code, not a fresh checkout of the baseline SHA. Runtime source and
test code were preserved during this documentation pass.

## Remaining work and evidence limits

- T006 in each retrospective package stays open for its revision-specific manual
  visual, editorial/privacy, or host checks when that subsystem next changes.
  Local tests do not verify branch protection, upstream workflow implementation,
  production environment approval, or a live deployment.
- Package 001 T010 remains open for additional independent boundary and
  interleaving regression tests. Writing a precise spec did not add those tests.
- No new performance benchmark, all-browser matrix, live weather provider,
  ephemeris, or biological accuracy claim was introduced.
- Other agents' uncommitted worktrees were not audited or modified. This register
  cannot certify their feature documentation.
- No commit, push, merge, or deployment is part of this pass. Retrospective
  acceptance criteria do not rewrite historical evidence or authorize new work.

## Repeating the documentation audit

For each feature directory, check core and supporting artifacts, unique FR/task
IDs, complete requirement-to-task/evidence mappings, valid local references,
explicit scope/status, and any pending manual checks. Compare the register against
`assets/`, public HTML routes, `scripts/`, `data/`, workflow files, and the
top-level test list. Re-run the README gate on the candidate being delivered.
Do not turn a mapped test name into a claim it asserts every boundary.
