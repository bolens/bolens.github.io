# Season and moon requirement coverage

This map separates automated assertions, source inspection, and visual evidence.
The original local implementation receipt remains in [tasks.md](tasks.md).

| Requirement | Tasks | Evidence |
| --- | --- | --- |
| FR-001 | T001, T002 | weather-fallback validates several malformed values; source inspection establishes the -90/60 acceptance bounds |
| FR-002 | T003, T007 | scene-atmosphere checks zero canvas particles under exclusion; season-moon-browser checks the fallback SVG eligibility gate |
| FR-003 | T001, T002, T007 | weather-fallback checks frozen environment, reset, 12/32 thresholds, and preservation across weather changes; field-independent normalization follows the state owner |
| FR-004 | T004, T005, T006, T007 | scene-time tests phase anchor, illumination, fixed defaults, and unchanged sunlight; browser tests phase geometry and bounds |
| FR-005 | T004, T005 | scene-time tests phase endpoints and invalid override reset; persistence across time/appearance is established by separate state ownership |
| FR-006 | T006, T007 | browser native path checks and reduced motion; existing terrain-opacity, layer, lighting, and weather suites guard shared rendering contracts |
| FR-007 | T005, T008 | scene-time asserts one interval; no new continuous loop or animation target in the feature diff; existing renderer budget tests remain applicable |
| SC-001 | T003, T007 | time/weather canvas exclusions and browser environment gates |
| SC-002 | T006, T007 | four phase shapes at two widths plus inspected captures |
| SC-003 | T001, T004 | invalid input/reset assertions; further boundary and interleaving cases below |
| SC-004 | T008 | full repository gate and source/budget inspection |

## Verification improvements identified by the documentation audit

The current assertions do not independently cover every -90/60 input boundary,
mixed valid/invalid field combination, environment subscriber ordering, or phase
override persistence across all time/appearance/reset interleavings. The source
implements these contracts, but source inspection is weaker than regression tests.
T010 tracks those additions rather than claiming exhaustive coverage.

The lunar estimate is approximate. Browser tests do not prove species-specific
firefly behavior, astronomical accuracy, or all-browser visual equivalence.
