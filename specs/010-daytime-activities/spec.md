# Feature specification: Daytime campsite activities
**Created**: 2026-09-05
**Status**: Implemented and verified locally. Specification began before implementation.
**Branch**: feat/404-season-moon
**Input**: Hide Mothman behind a pine tip, scale daytime Bigfoot/dogman realistically, show the man fishing with the dog and the woman mushroom picking, and make the flying alien/saucer emerge from and return behind cloud/ridge cover.

## User Scenarios & Testing

### User Story 1 - Find cryptids behind trees (Priority: P1)
Given daytime, viewers see recognizable but smaller Bigfoot/dogman peeks and Mothman's eyes/wings behind a pine crown, not feet standing on its tip. Tree and character move together.

### User Story 2 - Find the campers outdoors (Priority: P1)
Given daytime, the man fishes from dry riverbank ground with the seated dog nearby, while the woman kneels at a separate mushroom patch. Night restores the tent occupants and camera with no duplicate people or dog.

### User Story 3 - Watch the alien peek from cover (Priority: P2)
Given ordinary motion, the reused piloted saucer emerges into open sky and returns behind an opaque ridge, with clouds also occluding it when present. Reduced motion preserves a visible static peek.

### Edge Cases
- Explicit scene time wins over opposite appearance.
- Narrow layouts retain both activities and their local ground/prop relationships.
- Severe precipitation returns people and dog to shelter. Ordinary rainy/wet ground still uses material styling.
- Clouds are optional, so the clear-weather route needs retained mountain cover.
- No new continuous animation slot, timer, or random placement is added.

## Requirements

### Functional Requirements
- **FR-001**: Tree peeks reuse existing portraits with consistent head/torso scale; their heads are smaller than one fifth of their cover tree height.
- **FR-002**: The pine crown paints in front of Mothman's lower body, with recognizable visible eyes or wing edges.
- **FR-003**: Fishing and picking poses reuse the camper portrait; the seated dog reuses the windhound artwork.
- **FR-004**: Fishing feet and dog sit on dry bank ground, line reaches water, and the picker reaches a distinct mushroom patch away from the tent footprint.
- **FR-005**: Day/morning/evening show outdoor activities unless snowy or thunderstorm shelter applies; night/twilight restore indoor occupants. Never show both.
- **FR-006**: The alien remains inside the shared saucer, whose motion endpoints are occluded by retained terrain rather than opacity disappearance.
- **FR-007**: Weather/light/detail inheritance, reduced motion, existing animation budgets, and stable named regions remain supported.
- **FR-008**: Desktop and narrow views retain activity visibility, finite geometry, no horizontal overflow, and no new browser exceptions.
- **FR-009**: River and trail start at forest-floor elevation behind low, opaque ground and underbrush, not on a pine crown. Woody roots remain outside all seasonal water extents.
- **FR-010**: The adult fishing stance, seated Silken Windhound, and foreground kneeling pose maintain depth-relative proportions and grounded feet/paws. Hands meet the rod and mushroom patch. The windhound has folded ears, slender limbs, and layered coat feathering.

### Key Entities
- Tree hideout: reused character, shared cover tree, relative scale, common motion plane.
- Daytime activity: reusable person/dog/prop, ground anchor, pose, weather shelter gate.
- Saucer route: one reused moving craft, retained ridge endpoint cover, optional foreground clouds.

## Success Criteria
- **SC-001**: All three tree hideouts have verified cover ordering and bounded proportions.
- **SC-002**: At desktop and phone sizes, the fishing and picking activities are visible in daytime and absent at night without duplicate occupants.
- **SC-003**: Fixed route phases show an exposed craft between covered endpoints; reduced motion remains a visible peek.
- **SC-004**: Focused and full repository checks pass without increasing runtime motion allocation.

## Assumptions
- This is an illustration, not guidance for identifying edible mushrooms or verified cryptid anatomy.
- Existing fallback time rules and renderer ownership remain intact.
