# Feature specification: 404 rendering, parallax, and atmosphere

**Created**: 2026-09-05
**Status**: Retrospective baseline, not pre-implementation history
**Inspected revision**: `8ef9aa5e124f69c255ffb434bf21505eb322c4ed`
**Documentation branch**: `feat/404-season-moon`
**Input**: Explicit user request to backfill specs for meaningful repository consistency and improvement.

## Scope and provenance

Native animation tier selection, shared canvas atmosphere, responsive density, coherent parallax planes, overlay/visibility/reduced-motion gates, lifecycle cleanup, and flash prevention.

This records the existing contract, not decisions written before implementation.
The local extension is separate in [001-season-moon](../001-season-moon/spec.md).
See [plan.md](plan.md) for evidence and [tasks.md](tasks.md) for verification status.

## User Scenarios & Testing

### User Story 1 - Move through a stable responsive scene (Priority: P1)

Pointer movement and resizing must not produce overshoot, flashing planes, or loss of the main subjects.

**Independent Test / Acceptance Scenario**: Given active parallax, when the pointer moves in bursts, leaves the scene, or the viewport resizes, then bounded coherent planes ease to the latest target and settle without moving the camp focal subjects.

**Requirement coverage**: FR-001, FR-002, FR-003.

### User Story 2 - Keep ambient activity within a shared budget (Priority: P2)

Condition-specific motion should remain bounded and respect user and browser pause signals.

**Independent Test / Acceptance Scenario**: Given running atmospheric effects, when an overlay, hidden page, or reduced-motion preference pauses the scene, then owned effects stop or become static and resume only when their gates permit.

**Requirement coverage**: FR-004, FR-005, FR-006, FR-007.

### Edge Cases

- Slow frames must not cause unbounded parallax jumps.
- Low-core or save-data devices select a constrained tier even on a wide viewport.
- Without canvas enhancement, SVG remains the fallback rather than a blank scene.
- New animation consumers must use existing owners and budgets instead of independent unbounded loops.

## Requirements

### Functional Requirements

- **FR-001**: Parallax must coalesce pointer bursts, ease by elapsed time, bound delayed/out-of-range input, and stop scheduling once settled.
- **FR-002**: Only the intended coherent terrain planes may receive live parallax; focal subjects and reactive overlays must remain outside those moving planes.
- **FR-003**: Density must resolve deterministically from measured width, removing secondary rows/scatter before focal campsite subjects.
- **FR-004**: The renderer must select a bounded full/balanced/minimal animation and canvas budget and reuse daytime slots for eligible night events rather than adding unrestricted targets.
- **FR-005**: Canvas stars, fireflies, embers, and weather-related activity must obey resolved time/condition state. Hidden or ineligible effects must not leave visible halos.
- **FR-006**: Initial enhancement and SVG-to-canvas takeover must preserve visible fallback content without double-painted effects; state changes must avoid large abrupt flashes and primitive transition storms.
- **FR-007**: Motion gates must respect reduced motion, overlays, visibility, and page exit; weather flow must remain continuous across authored loop boundaries.

### Key Entities

- Render budget: tier, target frame rate, pixel ratio, and allowed authored motion targets.
- Parallax state: latest pointer target, eased offsets, pending frame, and stable terrain plane ownership.
- Atmosphere state: time/condition/motion profile and renderer budget shared by deterministic particle drawing.
- Density state: measured width and authored visibility tiers, not random per-frame placement.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Both acceptance scenarios produce their stated visitor or maintainer result while retaining the fallback required by their functional requirements.
- **SC-002**: Every functional requirement has named automated evidence or an explicit manual check. No manual outcome is inferred from a test count.
- **SC-003**: Each listed invalid-input or lifecycle case retains its stated usable behavior without contradicting the normal-case result.

## Assumptions

- Existing tests cover bounded fixtures, not every browser, device, or possible input.
- This documentation audit does not authorize runtime changes or publication.
- New behavior or discovered defects need a scoped prospective contract or normal fix workflow, as applicable.
- Inspect consecutive animation phases for flashes and collect device-specific performance measurements before claiming universal smoothness. Current tests do not establish an FPS SLA.
