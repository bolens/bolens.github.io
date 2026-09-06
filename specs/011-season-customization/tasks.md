# Tasks: Seasonal scene customization

**Input**: [plan.md](plan.md), [spec.md](spec.md), research, model, and UI contract.

## Setup and foundation

- [x] T001 Record scope, ownership, and constitution checks in specs/011-season-customization/plan.md.
- [x] T002 Run baseline controller/browser checks and record evidence in specs/011-season-customization/verification.md.

## US1 — Choose a season (P1)

Independent test: keyboard selection, external changes, and independent reset.

- [x] T003 [US1] Add failing catalog/DOM and picker integration checks in tests/weather-fallback.mjs and tests/season-customization.mjs.
- [x] T004 [US1] Expose season state in assets/404-weather.js and add native season controls in assets/appearance-picker.js.

## US2 — Seasonal vegetation (P1)

Independent test: fixed scene comparisons and all 55 season/weather combinations.

- [x] T005 [US2] Add failing material, winter-region, and placement checks in tests/season-customization.mjs.
- [x] T006 [US2] Compose seasonal material and named-region visibility in assets/404.css, preserving weather/detail/lighting ownership.

## US3 — Moon customization (P2)

Independent test: preset selection, custom external phase, and automatic reset.

- [x] T007 [US3] Add lunar controls, external synchronization, and narrow keyboard checks in tests/season-customization.mjs before implementation; their initial run stopped at missing season controls.
- [x] T008 [US3] Add native lunar controls and truthful custom-phase display in assets/appearance-picker.js.

## Verification and polish

- [x] T009 Run focused and full gates, inspect desktop/phone/reduced-motion captures, and record outcomes in specs/011-season-customization/verification.md.
- [x] T010 Update specs/README.md and tests/README.md with the implemented coverage.
- [x] T011 Verify live animation budgets, fixed wind phases, and saved/system motion gates in tests/season-motion.mjs.

## Dependencies and execution

T001 → T002 → test tasks T003/T005/T007 → T004/T006/T008 → T009 → T010.
Stories use existing controllers and are independently observable. Shared picker
edits are serialized by the root writer. No parallel implementation is needed;
independent focused test commands may run concurrently with isolated browsers.
Tests must fail for the missing capability before implementation. Stop at each
story's validation boundary; no commit or publication is part of this task.
