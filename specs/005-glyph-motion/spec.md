# Feature specification: Shared glyphs and page motion

**Created**: 2026-09-05
**Status**: Retrospective baseline, not pre-implementation history
**Inspected revision**: `8ef9aa5e124f69c255ffb434bf21505eb322c4ed`
**Documentation branch**: `feat/404-season-moon`
**Input**: Explicit user request to backfill specs for meaningful repository consistency and improvement.

## Scope and provenance

Non-404 reusable glyphs, home illustration motion, detail-row layout, page entrance/loading, and native cross-document transitions.

This records the existing contract, not decisions written before implementation.
The local extension is separate in [001-season-moon](../001-season-moon/spec.md).
See [plan.md](plan.md) for evidence and [tasks.md](tasks.md) for verification status.

## User Scenarios & Testing

### User Story 1 - Read illustrated content at every supported width (Priority: P1)

Decorative detail must not obscure text or make links unstable during hover and focus.

**Independent Test / Acceptance Scenario**: Given a page row at a narrow or desktop width, when the visitor hovers or focuses its link, then text stays within its cell and the arrow/glyph remains separated from the label.

**Requirement coverage**: FR-001, FR-002, FR-003.

### User Story 2 - Enjoy motion without losing control or content (Priority: P2)

Animation should respect visibility, overlays, and reduced motion while retaining complete illustrations.

**Independent Test / Acceptance Scenario**: Given an active illustration, when reduced motion or an overlay becomes active, then motion pauses or reduces without leaving incomplete artwork or restarting timelines on duplicate notifications.

**Requirement coverage**: FR-004, FR-005, FR-006.

### Edge Cases

- Native browsers may decline a cross-document snapshot; navigation still succeeds.
- Repeated observer entries or overlay events do not restart SVG timelines.
- Role nods and wrench rotation keep their intended pivot and viewport bounds.

## Requirements

### Functional Requirements

- **FR-001**: Shared glyph enhancement must preserve existing content, map labels/categories consistently, and keep decorative artwork out of the accessibility name.
- **FR-002**: Reusable interface symbols must retain base/accent artwork and legible theme colors across day/night, hover, focus, and filled surfaces.
- **FR-003**: Detail rows and project evidence must keep text, accents, and arrows within their intended boundaries at the tested responsive widths and motion phases.
- **FR-004**: Home illustration playback must follow independent visibility and aggregate overlay/motion gates without restarting on redundant notifications.
- **FR-005**: Page transitions must respect route/history direction, use at most three named snapshot layers, and skip unsupported, reduced-motion, unknown-route, and fragment-only cases without blocking navigation.
- **FR-006**: Loading reveal must be bounded and idempotent; reduced-motion fallbacks must show complete graphics, including when JavaScript is disabled.

### Key Entities

- Glyph placement: reusable symbol, base/accent groups, decorative semantics, and local orientation.
- Illustration playback state: independent visibility plus shared overlay and motion gates.
- Transition context: old/new route and navigation type, with browser-owned snapshot availability.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Both acceptance scenarios produce their stated visitor or maintainer result while retaining the fallback required by their functional requirements.
- **SC-002**: Every functional requirement has named automated evidence or an explicit manual check. No manual outcome is inferred from a test count.
- **SC-003**: Each listed invalid-input or lifecycle case retains its stated usable behavior without contradicting the normal-case result.

## Assumptions

- Existing tests cover bounded fixtures, not every browser, device, or possible input.
- This documentation audit does not authorize runtime changes or publication.
- New behavior or discovered defects need a scoped prospective contract or normal fix workflow, as applicable.
- Review visual rhythm and contrast after artwork edits; deterministic geometry checks do not measure aesthetic quality.
