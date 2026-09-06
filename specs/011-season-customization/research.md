# Design decisions

## Existing state ownership

Decision: Keep season in `portfolioWeather.environment`; expose its valid catalog
and mirror the normalized value as `data-scene-season` before subscribers run.
Rationale: `setEnvironment` already validates and gates fireflies; a second seasonal
controller would create competing state. The picker merges the current environment
when changing its season because that API intentionally replaces all fields.
Alternative rejected: calendar/location inference, which needs hemisphere context.

## Seasonal materials

Decision: Region-local classes compose inherited seasonal tokens with existing
material variables. Wet/dry canopy colors blend with seasonal colors, while
explicit shrub and flower stress colors retain precedence. Hide only named
deciduous leaf/accent regions in winter. Keep branch, snow, and lighting structures
separate. The opaque ground mixes seasonal color in proportion to the existing
light-cycle factor, with less tint after dark.
Rationale: Inline per-instance colors and weather rules already own variation;
whole-tree tint/opacity would defeat that and expose weather behind solid objects.
Alternative rejected: scene reconstruction or recoloring every placed instance.

Rendered verification rejected a first draft using symbol-ID ancestor selectors:
those affected hidden definitions but did not reach the SVG instance tree. Classes
on the referenced regions and inherited visibility tokens fix that. A pixel test
now proves actual copied canopies turn gold and lose leaves in winter.

## User controls

Decision: Native radio groups for season and moon use existing picker lifecycle,
subscriptions, and live status. A disabled custom-phase radio is displayed only
when an external override does not exactly match a preset.
Rationale: Existing keyboard arrow behavior, focus, and overlay pause remain intact;
an arbitrary numeric phase must not masquerade as a preset. Automatic means the
existing appearance/clock fallback, not necessarily the current astronomical phase.
Alternative rejected: a new slider/state owner and persisted preferences.

No new technology choice or unresolved research question remains; repository
contracts and inspected implementations supply the integration evidence.
