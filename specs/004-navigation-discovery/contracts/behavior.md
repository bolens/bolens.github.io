# Behavior boundaries: Navigation and project discovery

Work query fields are q, language, type, and sort. Default sort is featured; name-asc, name-desc, and updated are supported. Filter changes replace URL state rather than creating navigation history per keystroke. The GitHub metadata boundary accepts only usable array records and parseable dates; tests provide controlled responses.

## Compatibility

Preserve the routes, authored content, state ownership, and failure behavior in
[spec.md](../spec.md). This record adds no external service, persistence format,
or authority to publish.

## Evidence

[plan.md](../plan.md) maps requirements to tests or manual checks.
[quickstart.md](../quickstart.md) describes runnable verification.
