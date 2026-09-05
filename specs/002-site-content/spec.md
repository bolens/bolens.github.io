# Feature specification: Site content and generation

**Created**: 2026-09-05
**Status**: Retrospective baseline, not pre-implementation history
**Inspected revision**: `8ef9aa5e124f69c255ffb434bf21505eb322c4ed`
**Documentation branch**: `feat/404-season-moon`
**Input**: Explicit user request to backfill specs for meaningful repository consistency and improvement.

## Scope and provenance

Public home, about, work, and five case-study routes, shared navigation, project/theme data, generated outputs, and crawler metadata. This baseline describes the committed site, not new editorial claims.

This records the existing contract, not decisions written before implementation.
The local extension is separate in [001-season-moon](../001-season-moon/spec.md).
See [plan.md](plan.md) for evidence and [tasks.md](tasks.md) for verification status.

## User Scenarios & Testing

### User Story 1 - Find consistent public project information (Priority: P1)

Visitors need matching project names, destinations, and summaries wherever a project appears.

**Independent Test / Acceptance Scenario**: Given a listed project, when a visitor opens its work entry, command result, or case-study link, then the name and destination agree with the maintained project record.

**Requirement coverage**: FR-001, FR-002, FR-003.

### User Story 2 - Update one source without damaging authored content (Priority: P2)

Maintainers need repeatable generation without overwriting case-study prose.

**Independent Test / Acceptance Scenario**: Given valid changed project or palette data, when the maintainer regenerates the site twice, then dependent outputs update once and authored content outside generated regions remains unchanged.

**Requirement coverage**: FR-004, FR-005, FR-006.

### Edge Cases

- A project without a case-study slug still has a valid repository destination.
- Unknown or malformed data is rejected rather than published as broken navigation.
- Local asset references and social image dimensions are checked separately from editorial truth.

## Requirements

### Functional Requirements

- **FR-001**: Public project listings and command entries must derive names, links, and summaries from the maintained project records.
- **FR-002**: Existing home, about, work, and case-study routes must retain working local navigation, headings, titles, and metadata.
- **FR-003**: Public content must exclude credentials and private infrastructure details, and editorial claims must remain supportable.
- **FR-004**: Generation must update project surfaces, palette tokens, theme controls, and crawler outputs from their owners without independent generated edits.
- **FR-005**: Check mode must report stale generated output without rewriting files; a second unchanged generation must produce no diff.
- **FR-006**: Invalid source data must fail validation, and injected generation failures must not leave temporary output mistaken for successful content.

### Key Entities

- Project record: name, summary, status, technology, repository, optional site and case-study slug; one record feeds multiple public surfaces.
- Palette record: identifier, label, weather fallback, day/night tokens, and scene accents; generated consumers do not own these values.
- Generated region: output path and marked boundaries owned by the generator; surrounding authored content remains outside that ownership.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Both acceptance scenarios produce their stated visitor or maintainer result while retaining the fallback required by their functional requirements.
- **SC-002**: Every functional requirement has named automated evidence or an explicit manual check. No manual outcome is inferred from a test count.
- **SC-003**: Each listed invalid-input or lifecycle case retains its stated usable behavior without contradicting the normal-case result.

## Assumptions

- Existing tests cover bounded fixtures, not every browser, device, or possible input.
- This documentation audit does not authorize runtime changes or publication.
- New behavior or discovered defects need a scoped prospective contract or normal fix workflow, as applicable.
- Review factual public claims and private-data exposure before each publication. Application tests cannot establish either on their own.
