# Tasks and evidence

- [x] T001 Add the production-only, opt-out-aware shared loader and generator reference (AC1–AC5).
- [x] T002 Verify production, preview, opt-out, duplicate and blocked-provider behavior using controlled tests (AC2–AC4).
- [x] T003 Update owner documentation and run source, generated-content, and full browser gates (AC1–AC5).
- [ ] T004 Review the publication artifact, pass PR CI, merge, and verify the exact deployed revision and beacon (AC5–AC6).

Pre-merge evidence: Node 24.22.2 source lint passed; all 468 tests passed with no failures or skips. The 13 new deterministic checks cover host restrictions, privacy opt-outs, single inclusion, duplicate execution, and an unavailable provider. Publication/deployment verification remains pending under T004.
