# Tasks and evidence

- [x] T001 Add the production-only, opt-out-aware shared loader and generator reference (AC1–AC5).
- [x] T002 Verify production, preview, opt-out, duplicate and blocked-provider behavior using controlled tests (AC2–AC4).
- [x] T003 Update owner documentation and run source, generated-content, and full browser gates (AC1–AC5).
- [x] T004 Review the publication artifact, pass PR CI, merge, and verify the exact deployed revision and beacon (AC5–AC6).

Pre-merge evidence: Node 24.22.2 source lint passed; all 468 tests passed with no failures or skips. The 13 new deterministic checks cover host restrictions, privacy opt-outs, single inclusion, duplicate execution, and an unavailable provider. Publication/deployment verification passed under T004.

Delivery verified November 4, 2026:

- [PR33](https://github.com/bolens/bolens.github.io/pull/33) passed every applicable check and merged as `b3bb93059a1b07e95556eec7ac12e893fc47361a`.
- [Main validation](https://github.com/bolens/bolens.github.io/actions/runs/41886497626) and [Pages deployment](https://github.com/bolens/bolens.github.io/actions/runs/41887313192) succeeded for that exact revision.
- All nine public HTML files, the analytics loader, and security.txt matched the validated source over HTTPS. A missing route returned the unchanged custom 404 content with HTTP404.
- Browser verification on the production home page found exactly one official module beacon with the registered portfolio identifier. The vendor script appeared in the observed resource inventory; browser logs were empty.
- Credential review confirmed that the only Gitleaks generic-key finding is the registered public beacon identifier. No API credential is in the publication tree. Existing public contact and test-fixture email indicators were reviewed.
- Dashboard statistics are not asserted by this receipt; ingestion and aggregation may lag installation. Browser privacy opt-outs and preview exclusions are verified by the deterministic tests.
