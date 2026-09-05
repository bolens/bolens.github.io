# Feature specification: 404 conditions, time, and lighting

**Created**: 2026-09-05
**Status**: Retrospective baseline, not pre-implementation history
**Inspected revision**: `8ef9aa5e124f69c255ffb434bf21505eb322c4ed`
**Documentation branch**: `feat/404-season-moon`
**Input**: Explicit user request to backfill specs for meaningful repository consistency and improvement.

## Scope and provenance

Committed 404 weather fallback, explicit scene controls, five time states, celestial positioning, material/optical condition state, and coherent motion profiles. New season/temperature eligibility and moon phases belong to 001-season-moon.

This records the existing contract, not decisions written before implementation.
The local extension is separate in [001-season-moon](../001-season-moon/spec.md).
See [plan.md](plan.md) for evidence and [tasks.md](tasks.md) for verification status.

## User Scenarios & Testing

### User Story 1 - Choose a coherent condition and time (Priority: P1)

The scene should reflect one resolved state even when palette and explicit scene choices differ.

**Independent Test / Acceptance Scenario**: Given a theme-based condition, when an explicit condition or time is selected and the appearance changes, then the explicit scene choice remains until released.

**Requirement coverage**: FR-001, FR-002, FR-003.

### User Story 2 - See weather and light affect the same physical scene (Priority: P2)

Lighting and precipitation must agree across terrain, plants, fire, sky, and shelter.

**Independent Test / Acceptance Scenario**: Given a dry daytime scene, when rain, snow, wind, or night is selected, then materials and atmosphere change without changing the identity of the campsite.

**Requirement coverage**: FR-004, FR-005, FR-006.

### Edge Cases

- Location-named overrides are caller input, not proof that location permission was requested or a weather provider exists.
- Automatic clock boundaries are local scene hours, not latitude-specific sunrise/sunset.
- Overcast and precipitation occlude sky events; wet ground does not imply falling rain.

## Requirements

### Functional Requirements

- **FR-001**: Weather must resolve a supported explicit condition before the named palette fallback, and invalid input must release the explicit condition.
- **FR-002**: Time must resolve explicit scene time before fixed appearance before automatic local-clock state. The supported states are day, night, morning, evening, and twilight.
- **FR-003**: All eleven supported conditions and five time states must resolve a deterministic shared motion profile; state subscribers must receive committed state and support unsubscribe.
- **FR-004**: Clear, cloudy, misty, overcast, rainy, wet, dry, snowy, drought, windy, and thunderstorm must have condition-specific sky, material, or motion state. Rain and snow use distinct foreground geometry.
- **FR-005**: Sun/moon placement, shadow direction, and sunbeam origin must follow the shared time state while fixed choices remain stationary across clock updates.
- **FR-006**: Wind must drive coherent motion in flexible plants, tent, flames, smoke, and embers; reduced motion retains a complete static condition pose.

### Key Entities

- Weather snapshot: condition, source, palette; theme fallback from generated palette data.
- Time snapshot: time, source, fixed/dynamic cycle, position, darkness, warmth, progress, fire eligibility.
- Motion profile: time-condition signature and bounded tempo, sway, drift, lift, glow, activity, play, water, smoke values.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Both acceptance scenarios produce their stated visitor or maintainer result while retaining the fallback required by their functional requirements.
- **SC-002**: Every functional requirement has named automated evidence or an explicit manual check. No manual outcome is inferred from a test count.
- **SC-003**: Each listed invalid-input or lifecycle case retains its stated usable behavior without contradicting the normal-case result.

## Assumptions

- Existing tests cover bounded fixtures, not every browser, device, or possible input.
- This documentation audit does not authorize runtime changes or publication.
- New behavior or discovered defects need a scoped prospective contract or normal fix workflow, as applicable.
- Review weather readability and material realism in screenshots. No claim of meteorological or astronomical accuracy beyond the documented illustrative rules.
