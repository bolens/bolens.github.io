# State and ownership: 404 conditions, time, and lighting

## Entity 1

Weather snapshot: condition, source, palette; theme fallback from generated palette data.

## Entity 2

Time snapshot: time, source, fixed/dynamic cycle, position, darkness, warmth, progress, fire eligibility.

## Entity 3

Motion profile: time-condition signature and bounded tempo, sway, drift, lift, glow, activity, play, water, smoke values.

## Transitions and boundaries

The weather owner exposes setLocationCondition/useThemeFallback and subscriptions. The time owner exposes setTime/useAppearanceFallback/refresh and subscriptions. Automatic windows are morning [05:00,08:00), day [08:00,17:00), evening [17:00,20:00), twilight [20:00,22:00), otherwise night. A single minute interval refreshes automatic state. Condition names come from data/themes.json. Baseline 001 extends environment and lunar state without replacing these precedence rules.

See [plan.md](plan.md) for source owners and [spec.md](spec.md) for acceptance
rules. These are existing browser/file contracts, not a new database schema.
