# Validate season and moon state

Use Node.js 24 and isolated Chrome/Chromium fixtures from the repository root.

```sh
node scripts/lint.mjs
node --test --test-concurrency=2 --test-timeout=60000 tests/weather-fallback.mjs tests/scene-time.mjs tests/scene-atmosphere.mjs tests/season-moon-browser.mjs
```

Expected: all tests pass without retries. The browser suite fixes time and checks
1440x900 and 390x844, phase path containment, stable orb bounds, reduced motion,
environment reset, and day/night override interaction. It writes local phase
captures in the unique temporary directory printed after `Moon captures:`.

Use the complete README gate for combined changes. See [coverage.md](coverage.md)
for what the tests do and do not prove. API preview/reset examples are in
[plan.md](plan.md). No provider, new UI control, or publication is required.
