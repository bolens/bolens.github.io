# Behavior boundaries: 404 rendering, parallax, and atmosphere

Tier budgets are full 20 fps at .8 pixel ratio, balanced 15 at .7, minimal 10 at .5. Width <=430, save-data, or <=4 cores chooses minimal; otherwise width <=760 or <8 cores chooses balanced; otherwise full. These are configured caps, not achieved-device FPS claims. The renderer publishes its budget, the scene consumes it, and shared overlay/time/weather owners determine activity.

## Compatibility

Preserve the routes, authored content, state ownership, and failure behavior in
[spec.md](../spec.md). This record adds no external service, persistence format,
or authority to publish.

## Evidence

[plan.md](../plan.md) maps requirements to tests or manual checks.
[quickstart.md](../quickstart.md) describes runnable verification.
