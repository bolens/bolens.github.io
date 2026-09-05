# Implementation plan: Seasonal wildlife and moon phases

**Branch**: `feat/404-season-moon` | **Date**: 2026-09-05 | **Spec**: [spec.md](spec.md)

## Summary

Extend existing state owners rather than adding a controller. The weather controller owns optional environment input. The celestial clock owns phase calculation and CSS geometry. SVG and canvas consume their committed state.

## Technical context

- Static HTML, CSS, browser JavaScript. Node 24 and isolated Chromium tests.
- No added dependencies, persistence, network access, timers, or animation slots.
- Weather data validates finite Celsius values from -90 to 60, named seasons, and a boolean habitat flag. Null resets optional input. Flying fireflies require 12–32 C when supplied, non-winter season, and no explicit habitat exclusion.
- Moon phase uses a 29.530588-day mean month anchored at the January 2000 new moon. Overrides accept 0 through 1; 1 normalizes to new moon. Fixed scene/appearance uses phase .5 unless overridden.
- A dark terminator path overlays the existing opaque moon body and craters. Phase controls halo and moon-derived light strength, not sun rays or geometry placement.

## Constitution check

Pass: no private data, new external requests, generated-content edits, or new motion owner. Tests use fixed dates and isolated browser profiles. New capability has a written contract before code changes. Publication requires a separate requested delivery cycle.

## Project structure and ownership

Supporting detail: [state contract](contracts/scene-state.md), [data model](data-model.md),
[research](research.md), [quickstart](quickstart.md), and [traceability](coverage.md).

- `assets/404-weather.js`: validated environment snapshot and eligibility.
- `assets/404-time.js`: mean phase, explicit override, CSS geometry and light strength.
- `assets/404-scene.js`, `assets/404.css`, `404.html`: consume eligibility and named moon terminator.
- `tests/weather-fallback.mjs`, `tests/scene-time.mjs`, `tests/scene-atmosphere.mjs`, `tests/season-moon-browser.mjs`: deterministic contracts and rendered coverage.

## Research and limits

- [NASA: mean synodic month](https://eclipse.gsfc.nasa.gov/SEhelp/moonorbit.html) supports the approximate 29.53059-day cycle.
- [NASA phase tables](https://ntrs.nasa.gov/api/citations/19950008253/downloads/19950008253.pdf) place the January 2000 new moon near January 6, 18:15 UT. The minute-level anchor is adequate for an explicitly approximate illustration.
- [Xerces: firefly biology](https://xerces.org/endangered-species/fireflies/about) describes distinct life histories and common late-spring/summer adult emergence. The 12–32 C art rule is not presented as a biological constant.

## Verification

Unit checks precede implementation. Assert reset, validation, immutable snapshots, time/condition combinations, phase boundaries, lighting, and unchanged scheduling. Browser checks cover 1440x900 and 390x844, opposite palette/time settings, phase shapes, winter/summer transitions, and reduced motion. Run lint and the full README gate afterward.

## Integration examples

```js
// Optional caller-supplied environment; each call replaces the entire input.
window.portfolioWeather.setEnvironment({
  temperatureC: 20,
  season: 'summer',
  fireflyHabitat: true,
});
window.portfolioWeather.setEnvironment(null); // Restore illustrative fallback.

window.portfolioSceneTime.setMoonPhase(0.25); // First quarter.
window.portfolioSceneTime.setMoonPhase(null); // Restore clock/fixed-mode default.
```

No location is inferred from a season name. A future provider must supply local season and habitat information explicitly when known.
