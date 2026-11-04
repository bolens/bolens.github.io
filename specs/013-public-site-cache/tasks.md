# Tasks and evidence

- [x] T001 Implement and document the post-deploy hostname purge contract (AC3–AC5).
- [x] T002 Validate workflow syntax/security and success/failure paths using fake credentials and a stub transport; run repository gates (AC3–AC5).
- [ ] T003 Review source and artifact boundaries, pass PR checks and deliver the exact validated revision (AC3–AC6).
- [ ] T004 Configure credentials and hostname-scoped edge caching, verify HTTPS/HIT/purge/404 behavior, and preserve dynamic-app settings (AC1–AC6).

Live delivery evidence will be retained in private operational receipts. Unchecked tasks are pending, not delivery claims.

Pre-merge evidence: Node24.22.2 lint and all468 tests passed without failures/skips. Both workflows passed actionlint and offline zizmor. Twelve isolated workflow fixtures verified exact hostname payloads, secret exclusion from arguments/output and fail-closed behavior for missing credentials, invalid zone IDs, HTTP failures, API rejection and malformed JSON. Live configuration and exact-SHA deployment remain pending under T003/T004.
