# Feature specification: 404 terrain, habitat, cryptids, and camp

**Created**: 2026-09-05
**Status**: Retrospective baseline, not pre-implementation history
**Inspected revision**: `8ef9aa5e124f69c255ffb434bf21505eb322c4ed`
**Documentation branch**: `feat/404-season-moon`
**Input**: Explicit user request to backfill specs for meaningful repository consistency and improvement.

## Scope and provenance

Shared 404 symbol families, named layers/regions, landscape and habitat placement, reusable cryptid poses, tent occupants, river/trail continuity, firepit and food details.

This records the existing contract, not decisions written before implementation.
The local extension is separate in [001-season-moon](../001-season-moon/spec.md).
See [plan.md](plan.md) for evidence and [tasks.md](tasks.md) for verification status.

## User Scenarios & Testing

### User Story 1 - Recognize a grounded campsite across conditions (Priority: P1)

Reusable items should read as physical objects with coherent scale, occlusion, and habitat.

**Independent Test / Acceptance Scenario**: Given the full campsite, when the view narrows or weather changes, then solid objects retain their silhouettes and river, trail, plants, shelter, and subjects remain in their intended layer/habitat.

**Requirement coverage**: FR-001, FR-002, FR-003.

### User Story 2 - Find reusable characters and condition-aware camp activity (Priority: P2)

Daytime hiding and nighttime gathering should reuse recognizable characters while fire and food reflect the scene state.

**Independent Test / Acceptance Scenario**: Given nighttime seated cryptids, when daytime is selected, then reusable Bigfoot, dogman, and perched mothman poses hide near trees and the alien appears in the flying craft without leftover seated-body lighting.

**Requirement coverage**: FR-004, FR-005, FR-006.

### Edge Cases

- Fixed day represents a between-meal cold fire; fixed morning/evening are representative cooking scenes.
- Automatic fire meal windows are [07:00,09:00), [12:00,14:00), [18:00,20:00); night/twilight permit fire, with drought taking precedence.
- Leaf litter, mushroom groups, and dead trees vary authored scale/rotation/form without unseeded placement randomization.
- Cryptid designs interpret folklore, not verified biological observations.

## Requirements

### Functional Requirements

- **FR-001**: Terrain, trees, deadwood, shrubs, floor cover, river elements, shelter, and gear must reuse named symbols with addressable material/detail regions.
- **FR-002**: Solid object geometry must remain opaque; translucency must be confined to optical, atmospheric, or surface-detail regions. Weather must paint in front of the terrain it covers.
- **FR-003**: Tree and brush placement must respect the river channel and campsite footprints; river/trail ends must disappear through intended occlusion rather than terminating on unrelated trees.
- **FR-004**: Bigfoot, dogman, alien, mothman, and campers must retain distinct authored body plans and named detail layers; alternate poses reuse the character glyphs.
- **FR-005**: Fire ring stones, coals, ash, logs, and flames must share grounded placement and scale. Coals remain planted, and only small sparks travel away from the flame.
- **FR-006**: Daytime fire must be cold outside automatic meal windows; drought substitutes stove cooking. Marshmallow appearance must follow bounded accumulated fire exposure without discarding earlier cooking when weather changes.

### Key Entities

- Terrain asset: shared symbol, species/material variant, local scale, placement, weather/time style, named detail layers.
- Scene region: paint-order band and habitat/footprint controlling which placements may occupy it.
- Character pose: reusable glyph body and pose-specific transform/visibility; standalone light accents follow the pose.
- Fire/food state: fire eligibility, condition heat, planted fuel/bed geometry, and bounded cooking exposure.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Both acceptance scenarios produce their stated visitor or maintainer result while retaining the fallback required by their functional requirements.
- **SC-002**: Every functional requirement has named automated evidence or an explicit manual check. No manual outcome is inferred from a test count.
- **SC-003**: Each listed invalid-input or lifecycle case retains its stated usable behavior without contradicting the normal-case result.

## Assumptions

- Existing tests cover bounded fixtures, not every browser, device, or possible input.
- This documentation audit does not authorize runtime changes or publication.
- New behavior or discovered defects need a scoped prospective contract or normal fix workflow, as applicable.
- Inspect silhouettes, species/folklore interpretation, camp clearance, and river continuity at desktop and narrow widths. Source selectors cannot prove every placement is visually plausible.
