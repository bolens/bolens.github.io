# Feature specification: Navigation and project discovery

**Created**: 2026-09-05
**Status**: Retrospective baseline, not pre-implementation history
**Inspected revision**: `8ef9aa5e124f69c255ffb434bf21505eb322c4ed`
**Documentation branch**: `feat/404-season-moon`
**Input**: Explicit user request to backfill specs for meaningful repository consistency and improvement.

## Scope and provenance

Work search/filter/sort state and optional repository update dates, case-study reading position, deep links, and ordinary local navigation.

This records the existing contract, not decisions written before implementation.
The local extension is separate in [001-season-moon](../001-season-moon/spec.md).
See [plan.md](plan.md) for evidence and [tasks.md](tasks.md) for verification status.

## User Scenarios & Testing

### User Story 1 - Narrow projects with shareable filters (Priority: P1)

Visitors need useful discovery even when update metadata cannot be fetched.

**Independent Test / Acceptance Scenario**: Given a work URL with search and filters, when the page loads or the visitor resets the controls, then the visible set, count, order, and URL agree.

**Requirement coverage**: FR-001, FR-002, FR-003.

### User Story 2 - Read and navigate case-study chapters (Priority: P2)

Chapter navigation must follow reading position without fighting rapid input or native anchors.

**Independent Test / Acceptance Scenario**: Given a deep link or chapter selection, when the reader scrolls, resizes, or selects another chapter before alignment finishes, then the latest valid intent determines the selected chapter.

**Requirement coverage**: FR-004, FR-005, FR-006.

### Edge Cases

- Invalid JSON, unmatched repositories, missing dates, future cache timestamps, and failed HTTP responses must not fabricate update dates.
- A denied cache write must not discard successful fetched metadata.
- Unknown fragments do not authorize scrolling to stale chapters.

## Requirements

### Functional Requirements

- **FR-001**: Search text, language, and project type must combine; visible counts and empty results must describe the filtered set.
- **FR-002**: The URL must restore supported filters and sort order; reset must restore featured order and focus search while preserving the route fragment.
- **FR-003**: Recently updated sorting must use validated repository dates and stable original-order ties. A cache younger than ten minutes may avoid refresh; failed fetches or storage must leave ordinary filtering usable.
- **FR-004**: Chapter state must follow the last section at or above the reading line, including exact boundaries, and update after resize.
- **FR-005**: Rapid hash and resize changes must cancel stale alignment and coalesce pending frame work; unrelated fragments retain native behavior.
- **FR-006**: Empty/single-section cases must stay finite, native links and history remain usable, and project content remains available without enhancement.

### Key Entities

- Work filter state: q, language, type, sort; URL is the shareable representation.
- Update cache: savedAt and repository records keyed by repository URL; pushed_at is preferred when parseable, then updated_at.
- Chapter state: ordered sections, current reading line, selected chapter, and cancellable pending alignment.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Both acceptance scenarios produce their stated visitor or maintainer result while retaining the fallback required by their functional requirements.
- **SC-002**: Every functional requirement has named automated evidence or an explicit manual check. No manual outcome is inferred from a test count.
- **SC-003**: Each listed invalid-input or lifecycle case retains its stated usable behavior without contradicting the normal-case result.

## Assumptions

- Existing tests cover bounded fixtures, not every browser, device, or possible input.
- This documentation audit does not authorize runtime changes or publication.
- New behavior or discovered defects need a scoped prospective contract or normal fix workflow, as applicable.
- Confirm deep-link reading context and no-JavaScript navigation after document structure changes.
