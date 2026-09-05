# State and ownership: 404 terrain, habitat, cryptids, and camp

## Entity 1

Terrain asset: shared symbol, species/material variant, local scale, placement, weather/time style, named detail layers.

## Entity 2

Scene region: paint-order band and habitat/footprint controlling which placements may occupy it.

## Entity 3

Character pose: reusable glyph body and pose-specific transform/visibility; standalone light accents follow the pose.

## Entity 4

Fire/food state: fire eligibility, condition heat, planted fuel/bed geometry, and bounded cooking exposure.

## Transitions and boundaries

Named data-region/data-layer areas identify edit targets; symbol definitions do not own world placement. Solid silhouettes occlude rear layers. The scene-time owner determines fire eligibility, the weather owner supplies drought/rain state, and the scene runtime accumulates cooking exposure. Food geometry consumes that exposure rather than running per-item timers.

See [plan.md](plan.md) for source owners and [spec.md](spec.md) for acceptance
rules. These are existing browser/file contracts, not a new database schema.
