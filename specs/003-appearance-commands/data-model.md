# State and ownership: Appearance, overlays, and commands

## Entity 1

Appearance snapshot: palette, chosen/resolved theme, motion preferences, and preview state owned by the appearance controller.

## Entity 2

Overlay source: picker or command dialog; aggregate active state changes only when the source set changes.

## Entity 3

Command entry: searchable label/detail, scope, availability, and action, with project content supplied by generated data.

## Transitions and boundaries

The appearance controller commits DOM/metadata before notifying subscribers. Overlay consumers respond to aggregate activity, not private dialog internals. Native browser actions keep their own permission/cancellation behavior. The dialog owns focus while open and restores a viable trigger on close.

See [plan.md](plan.md) for source owners and [spec.md](spec.md) for acceptance
rules. These are existing browser/file contracts, not a new database schema.
