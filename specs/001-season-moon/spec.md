# Feature Specification: Seasonal wildlife and moon phases

**Feature Branch**: `feat/404-season-moon`

**Created**: 2026-09-05

**Status**: Implemented and verified locally; not yet published

**Input**: Continue with the next candidates after merging the 404 scene pass.

## User Scenarios & Testing

### User Story 1 - Suitable insect conditions (Priority: P1)

Visitors should not see flying fireflies when supplied temperature, season, or habitat information makes them unsuitable.

**Why this priority**: Weather names alone cannot distinguish a warm evening from a cold one.

**Independent Test**: Change supplied environment information while retaining clear nighttime weather.

**Acceptance Scenarios**:

1. Given a warm summer night, when the supplied season becomes winter or temperature becomes cold, flying fireflies disappear in both rendered and fallback scenes.
2. Given unsuitable habitat information, when weather becomes clear, fireflies remain absent.
3. Given supplied environment information, when it is cleared, the documented illustrative fallback returns without requesting location access.
4. Given a supplied temperature, when it is below 12 C or above 32 C, flying fireflies are excluded. Both endpoints are eligible unless season, habitat, weather, or time excludes them.
5. Given a valid temperature with an invalid season, when the environment is replaced, the valid temperature is retained and the invalid season becomes unknown. Omitted fields do not carry over from the previous input.

### User Story 2 - Recognizable moon phases (Priority: P2)

Visitors using the automatic cycle see an approximate date-based moon phase. Explicit scene settings retain a stable representative phase unless a phase override is supplied.

**Why this priority**: A full moon on every automatic night makes the scene repetitive and overstates nighttime light.

**Independent Test**: Preview new, quarter, full, and waning moons at fixed geometry.

**Acceptance Scenarios**:

1. Given the automatic cycle, when the supplied date advances through a lunar month, the lit fraction changes through new, waxing, full, and waning phases.
2. Given a fixed night scene, when the clock changes, its representative full moon remains fixed unless explicitly overridden.
3. Given a crescent or new moon, moon glow and moon-derived surface lighting are weaker than at full moon. The sunlight appearance remains unchanged.
4. Given a valid phase override, when the scene time or appearance changes, the phase choice remains until reset. Clearing it restores the current fixed or automatic default.
5. Given phase values 0, 0.25, 0.5, 0.75, and 1, the result is new, first quarter, full, last quarter, and new moon respectively.

### Edge Cases

- Invalid environment or phase input releases that override without poisoning other scene settings.
- New moon has no bright disk or residual full-moon halo.
- Reduced motion and repeated weather/time changes do not add loops or move glyph placements.
- Missing provider data remains clearly illustrative, not an inferred user location or species observation.

## Requirements

### Functional Requirements

- **FR-001**: Accept optional finite temperature from -90 through 60 Celsius, spring/summer/autumn/winter season, and true/false firefly-habitat eligibility without fetching location or storing coordinates. Invalid fields become unknown independently.
- **FR-002**: Apply the same eligibility to glowing firefly bodies and halos. Existing rain, wind, drought, snow, and daylight exclusions still win.
- **FR-003**: Expose bounded, immutable environment state. Each supplied environment replaces the previous one; reset makes all fields unknown without changing weather or time. Supplied winter, unsuitable habitat, or temperature outside 12 through 32 Celsius excludes flying fireflies.
- **FR-004**: Show approximate date-based lunar phase in automatic time and a stable full moon in fixed time by default. Phase must reduce moon glow and moon-derived light/shadow strength without dimming sunlight.
- **FR-005**: Allow a finite numeric phase override from 0 through 1, with 1 equivalent to 0. Invalid input or reset releases only the phase override; valid overrides survive time and appearance changes.
- **FR-006**: Preserve opaque celestial geometry, named detail regions, existing weather occlusion, responsive layout, and reduced motion.
- **FR-007**: Keep the existing number of timers, frame loops, and animation slots.

### Key Entities

- Environment: supplied temperature in Celsius, named season, and optional firefly habitat eligibility. Unknown fields stay unknown.
- Lunar phase: normalized position in the lunar cycle, illuminated fraction, and source of the phase choice.

## Success Criteria

### Measurable Outcomes

- **SC-001**: All specified cold, winter, unsuitable-habitat, and weather exclusions yield zero visible flying fireflies.
- **SC-002**: New, quarter, full, and waning phases are visually distinct at desktop and phone sizes without changing orb bounds.
- **SC-003**: Fixed choices survive clock refreshes, invalid input remains finite, and resets restore documented defaults.
- **SC-004**: All affected deterministic tests and the full repository gate pass, with no new continuous animation slots.

## Assumptions

- This pass implements eligibility and lunar phases. Bird, moth, and rainbow glyphs remain later candidates.
- Without supplied environment data, the existing illustrated warm-season campsite remains the fallback. No season or region is guessed from the visitor's location.
- Temperature thresholds are conservative art-direction rules, not species-specific predictions.
- The lunar estimate uses a mean cycle, not an ephemeris. Moonrise, latitude-dependent orientation, eclipses, and live astronomical feeds are outside this pass.
