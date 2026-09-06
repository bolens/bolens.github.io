# Season and moon requirement coverage

This map separates automated assertions, source inspection, and visual evidence.
The original local implementation receipt remains in [tasks.md](tasks.md).

| Requirement | Tasks | Evidence |
| --- | --- | --- |
| FR-001 | T001, T002, T010 | weather-fallback asserts both -90/60 endpoints, values immediately outside them, and independently invalid fields |
| FR-002 | T003, T007 | scene-atmosphere checks zero canvas particles under exclusion; season-moon-browser checks the fallback SVG eligibility gate |
| FR-003 | T001, T002, T007, T010 | weather-fallback checks frozen environment, reset, 12/32 thresholds, replacement of omitted fields, subscriber order, committed DOM state, unsubscribe, and preservation across weather changes |
| FR-004 | T004, T005, T006, T007 | scene-time tests phase anchor, illumination, fixed defaults, and unchanged sunlight; browser tests phase geometry and bounds |
| FR-005 | T004, T005, T010 | scene-time tests phase endpoints, all named time and appearance interleavings, clock refresh, independent invalid/reset behavior, and restoration of fixed/clock defaults |
| FR-006 | T006, T007 | browser native path checks and reduced motion; existing terrain-opacity, layer, lighting, and weather suites guard shared rendering contracts |
| FR-007 | T005, T008 | scene-time asserts one interval; no new continuous loop or animation target in the feature diff; existing renderer budget tests remain applicable |
| SC-001 | T003, T007 | time/weather canvas exclusions and browser environment gates |
| SC-002 | T006, T007 | four phase shapes at two widths plus inspected captures |
| SC-003 | T001, T004 | invalid input/reset assertions; further boundary and interleaving cases below |
| SC-004 | T008 | full repository gate and source/budget inspection |

## Verification improvements identified by the documentation audit

T010 closes the identified -90/60 input boundary, mixed valid/invalid field,
environment subscriber ordering, and phase override interleaving gaps with three
deterministic tests. The full gate passed 453 tests without failures or skips.
These cases cover the documented contract, not every possible JavaScript object
or concurrent consumer callback.

The lunar estimate is approximate. Browser tests do not prove species-specific
firefly behavior, astronomical accuracy, or all-browser visual equivalence.
