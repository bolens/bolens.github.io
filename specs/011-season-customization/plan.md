# Implementation Plan: Seasonal scene customization

**Branch**: `011-season-customization` | **Date**: 2026-09-05 | **Spec**: [spec.md](spec.md)

**Input**: `specs/011-season-customization/spec.md`

## Summary

Expose existing environment seasons and lunar overrides in the 404 appearance
picker. Compose seasonal material tokens and named leaf visibility with existing
weather, lighting, detail, and motion layers. No new renderer or animation owner.

## Technical Context

**Language/Version**: Browser JavaScript, CSS, inline SVG; Node.js 24 tests.
**Primary Dependencies**: Existing appearance, weather, time, and overlay controllers.
**Storage**: Existing in-memory scene state only; no new persistence.
**Testing**: Node VM fixtures and isolated Chromium/CDP browser harness.
**Target Platform**: Responsive static website, desktop and mobile browsers.
**Project Type**: Static web application.
**Performance Goals**: No additional continuous effects, timers, geometry rebuilds,
or placement changes; material updates only when existing controllers notify.
**Constraints**: No client dependency, translucent structural bodies, generated-file
edits, location requests, automatic season inference, or publication.
**Scale/Scope**: One scene; five seasonal states, eleven weather conditions,
six vegetation families, eight lunar presets plus automatic/custom display.

## Constitution Check

Pre-design and post-design gates pass: no unsupported public claims or personal
data; generated sources unchanged; existing controller ownership and keyboard
controls retained; isolated deterministic tests and visual evidence required;
delivery is not part of this task. No exceptions.

## Project Structure

Documentation lives in this feature directory: spec, quality checklist, plan,
research, data model, UI contract, quickstart, tasks, and verification receipt.

Source ownership:

- `assets/404-weather.js`: season catalog and committed DOM season state.
- `assets/appearance-picker.js`: native season/moon selection and synchronization.
- `assets/404.css`, `404.html`: instance-safe region classes, seasonal materials,
  leaf-only visibility, and opaque ground shading composed with the light cycle.
- `tests/weather-fallback.mjs`, `tests/season-customization.mjs`,
  `tests/season-motion.mjs`: state, actual instance paint, motion, and browser proof.
- `tests/terrain-detail-layers.mjs`: detail-class membership with companion classes.
- `specs/README.md`, `tests/README.md`: coverage links.

Root checkout is owned by this task at base `e78b99c`; other linked worktrees and
the divergent local main branch are excluded. No parallel source writers.

## Complexity Tracking

No constitution violations or additional abstraction layers required.
