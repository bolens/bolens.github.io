# Behavior boundaries: Appearance, overlays, and commands

The appearance controller commits DOM/metadata before notifying subscribers. Overlay consumers respond to aggregate activity, not private dialog internals. Native browser actions keep their own permission/cancellation behavior. The dialog owns focus while open and restores a viable trigger on close.

## Compatibility

Preserve the routes, authored content, state ownership, and failure behavior in
[spec.md](../spec.md). This record adds no external service, persistence format,
or authority to publish.

## Evidence

[plan.md](../plan.md) maps requirements to tests or manual checks.
[quickstart.md](../quickstart.md) describes runnable verification.
