# State and ownership: Shared glyphs and page motion

## Entity 1

Glyph placement: reusable symbol, base/accent groups, decorative semantics, and local orientation.

## Entity 2

Illustration playback state: independent visibility plus shared overlay and motion gates.

## Entity 3

Transition context: old/new route and navigation type, with browser-owned snapshot availability.

## Transitions and boundaries

Glyph enhancement augments markup without replacing reader content. Visibility and overlay owners determine whether authored animation may run. Cross-document transitions are optional visual enhancement, never the navigation mechanism. Loading completion must reveal once even if a fallback wins before a late load.

See [plan.md](plan.md) for source owners and [spec.md](spec.md) for acceptance
rules. These are existing browser/file contracts, not a new database schema.
