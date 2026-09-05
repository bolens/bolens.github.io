# Behavior boundaries: 404 conditions, time, and lighting

The weather owner exposes setLocationCondition/useThemeFallback and subscriptions. The time owner exposes setTime/useAppearanceFallback/refresh and subscriptions. Automatic windows are morning [05:00,08:00), day [08:00,17:00), evening [17:00,20:00), twilight [20:00,22:00), otherwise night. A single minute interval refreshes automatic state. Condition names come from data/themes.json. Baseline 001 extends environment and lunar state without replacing these precedence rules.

## Compatibility

Preserve the routes, authored content, state ownership, and failure behavior in
[spec.md](../spec.md). This record adds no external service, persistence format,
or authority to publish.

## Evidence

[plan.md](../plan.md) maps requirements to tests or manual checks.
[quickstart.md](../quickstart.md) describes runnable verification.
