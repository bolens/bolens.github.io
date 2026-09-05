# Feature specification: Appearance, overlays, and commands

**Created**: 2026-09-05
**Status**: Retrospective baseline, not pre-implementation history
**Inspected revision**: `8ef9aa5e124f69c255ffb434bf21505eb322c4ed`
**Documentation branch**: `feat/404-season-moon`
**Input**: Explicit user request to backfill specs for meaningful repository consistency and improvement.

## Scope and provenance

Shared appearance preferences, picker controls, command search/actions, keyboard handling, focus restoration, and aggregate overlay state on every page. Scene-specific state resolution remains in baseline 006.

This records the existing contract, not decisions written before implementation.
The local extension is separate in [001-season-moon](../001-season-moon/spec.md).
See [plan.md](plan.md) for evidence and [tasks.md](tasks.md) for verification status.

## User Scenarios & Testing

### User Story 1 - Choose appearance without losing a usable interface (Priority: P1)

Visitors need a consistent palette and motion preference across controls, routes, and browser metadata.

**Independent Test / Acceptance Scenario**: Given an existing preference, when the visitor changes or resets appearance with keyboard or pointer, then controls and rendered appearance agree and focus remains usable.

**Requirement coverage**: FR-001, FR-002, FR-003.

### User Story 2 - Find and run commands without conflicting dialogs (Priority: P2)

Search and shortcuts should remain usable around text fields, optional browser APIs, and other overlays.

**Independent Test / Acceptance Scenario**: Given a focused control, when the visitor opens search, selects an available result, and closes the dialog, then the intended command runs and focus returns without leaving a second overlay active.

**Requirement coverage**: FR-004, FR-005, FR-006.

### Edge Cases

- Invalid or removed preference values normalize to documented defaults.
- Missing clipboard/share support and rejected actions do not disable unrelated commands.
- 404 weather/time controls are contextual; they do not become global appearance owners.

## Requirements

### Functional Requirements

- **FR-001**: Appearance must validate restored and incoming preferences, resolve automatic mode from the system, and preserve explicit choices across system changes.
- **FR-002**: Preview, committed preference, persistence, browser metadata, and subscriber state must remain synchronized without exposing partially committed appearance.
- **FR-003**: Unavailable storage must not prevent in-memory appearance changes; cross-tab updates must not echo unnecessary writes.
- **FR-004**: The picker and command dialog must support keyboard selection, close controls, outside interaction where applicable, and focus restoration without overlapping active dialogs.
- **FR-005**: Command search, scope, history, contextual availability, and selection must use validated data and avoid treating command text as executable markup.
- **FR-006**: Shortcuts must respect editing/modifier guards, optional actions must handle denial or cancellation, and duplicate overlay opens/closes must not corrupt aggregate state.

### Key Entities

- Appearance snapshot: palette, chosen/resolved theme, motion preferences, and preview state owned by the appearance controller.
- Overlay source: picker or command dialog; aggregate active state changes only when the source set changes.
- Command entry: searchable label/detail, scope, availability, and action, with project content supplied by generated data.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Both acceptance scenarios produce their stated visitor or maintainer result while retaining the fallback required by their functional requirements.
- **SC-002**: Every functional requirement has named automated evidence or an explicit manual check. No manual outcome is inferred from a test count.
- **SC-003**: Each listed invalid-input or lifecycle case retains its stated usable behavior without contradicting the normal-case result.

## Assumptions

- Existing tests cover bounded fixtures, not every browser, device, or possible input.
- This documentation audit does not authorize runtime changes or publication.
- New behavior or discovered defects need a scoped prospective contract or normal fix workflow, as applicable.
- Inspect actual focus visibility and labels on desktop and narrow screens after visual control changes.
