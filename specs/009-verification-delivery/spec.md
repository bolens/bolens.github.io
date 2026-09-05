# Feature specification: Verification, delivery, and repository tooling

**Created**: 2026-09-05
**Status**: Retrospective baseline, not pre-implementation history
**Inspected revision**: `8ef9aa5e124f69c255ffb434bf21505eb322c4ed`
**Documentation branch**: `feat/404-season-moon`
**Input**: Explicit user request to backfill specs for meaningful repository consistency and improvement.

## Scope and provenance

Local lint/test contracts, isolated browser fixtures, generated-file validation, CI aggregation, reviewed Pages delivery, metadata-only maintainer assignment, and managed Spec Kit integration.

This records the existing contract, not decisions written before implementation.
The local extension is separate in [001-season-moon](../001-season-moon/spec.md).
See [plan.md](plan.md) for evidence and [tasks.md](tasks.md) for verification status.

## User Scenarios & Testing

### User Story 1 - Validate changes with attributable deterministic failures (Priority: P1)

Maintainers need failures tied to repository behavior rather than personal browser state or third-party timing.

**Independent Test / Acceptance Scenario**: Given a proposed change, when lint and the full test command run, then invalid source or behavior fails with bounded diagnostics and no retry-until-green loop.

**Requirement coverage**: FR-001, FR-002, FR-003.

### User Story 2 - Publish only reviewed validated public files (Priority: P2)

A passing local test must not become authority to publish unreviewed or private repository material.

**Independent Test / Acceptance Scenario**: Given an authorized reviewed PR with passing current-head checks, when it merges, then Pages may deploy only the exact still-current validated main revision and the public file allowlist.

**Requirement coverage**: FR-004, FR-005, FR-006, FR-007.

### Edge Cases

- New top-level public paths require deliberate addition to the Pages staging list.
- Markdown-only skipping does not skip lint and does not apply to main/manual runs.
- Fixture tests ignore deliberate native transition cancellation, not unrelated application exceptions.
- The metadata-only pull_request_target caller does not authorize checking out or executing untrusted PR code.

## Requirements

### Functional Requirements

- **FR-001**: Lint must check JavaScript syntax, JSON, generated drift, and site contracts; validation fixtures must mutate disposable copies rather than the working source.
- **FR-002**: Browser tests must use isolated profiles and loopback servers, controlled time/locale/responses, owned cleanup, and attributable exception reporting.
- **FR-003**: PR lint must always run; only Markdown-only PRs may skip test shards. Main/manual runs execute the complete suite and the required aggregate must fail on failed, cancelled, or unexpectedly skipped required jobs.
- **FR-004**: Changes must use reviewed PRs and focused commits, without direct main pushes, protection bypasses, or history rewriting; merged branches are cleaned only after exact-head verification.
- **FR-005**: Pages must accept successful main push/manual validation, reject PR/failed/superseded runs, and stage only root public pages/metadata plus assets, about, work, and case-studies.
- **FR-006**: Delivery must retain merged SHA/check evidence, signed-out home/affected-route/navigation/404 verification, and use corrective or revert PRs for source recovery.
- **FR-007**: Maintainer assignment must remain metadata-only through its pinned reusable workflow; managed Spec Kit tooling stays under manifests and project-specific guidance stays in owned memory.

### Key Entities

- Validation candidate: exact source revision, lint result, required shard results, and retained diagnostics.
- Deployment candidate: successful main validation SHA, still-current check, public artifact, and live URL.
- Managed integration: immutable workflow/tooling references and file manifests, separate from project-owned memory.
- Delivery receipt: PR/head/merge SHAs, workflow outcomes, live checks, and exact completed branch cleanup.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Both acceptance scenarios produce their stated visitor or maintainer result while retaining the fallback required by their functional requirements.
- **SC-002**: Every functional requirement has named automated evidence or an explicit manual check. No manual outcome is inferred from a test count.
- **SC-003**: Each listed invalid-input or lifecycle case retains its stated usable behavior without contradicting the normal-case result.

## Assumptions

- Existing tests cover bounded fixtures, not every browser, device, or possible input.
- This documentation audit does not authorize runtime changes or publication.
- New behavior or discovered defects need a scoped prospective contract or normal fix workflow, as applicable.
- Current-head CI, branch protection, upstream reusable workflow behavior, environment approvals, artifact contents, and signed-out deployment checks require host/delivery evidence. They are not proven by 433 application tests.
