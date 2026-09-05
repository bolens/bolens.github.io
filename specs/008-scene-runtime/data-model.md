# State and ownership: 404 rendering, parallax, and atmosphere

## Entity 1

Render budget: tier, target frame rate, pixel ratio, and allowed authored motion targets.

## Entity 2

Parallax state: latest pointer target, eased offsets, pending frame, and stable terrain plane ownership.

## Entity 3

Atmosphere state: time/condition/motion profile and renderer budget shared by deterministic particle drawing.

## Entity 4

Density state: measured width and authored visibility tiers, not random per-frame placement.

## Transitions and boundaries

Tier budgets are full 20 fps at .8 pixel ratio, balanced 15 at .7, minimal 10 at .5. Width <=430, save-data, or <=4 cores chooses minimal; otherwise width <=760 or <8 cores chooses balanced; otherwise full. These are configured caps, not achieved-device FPS claims. The renderer publishes its budget, the scene consumes it, and shared overlay/time/weather owners determine activity.

See [plan.md](plan.md) for source owners and [spec.md](spec.md) for acceptance
rules. These are existing browser/file contracts, not a new database schema.
