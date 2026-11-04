# Tasks and evidence

- [x] T001 Implement and document the post-deploy hostname purge contract (AC3–AC5).
- [x] T002 Validate workflow syntax/security and success/failure paths using fake credentials and a stub transport; run repository gates (AC3–AC5).
- [x] T003 Review source and artifact boundaries, pass PR checks and deliver the exact validated revision (AC3–AC6).
- [x] T004 Configure credentials and hostname-scoped edge caching, verify HTTPS/HIT/purge/404 behavior, and preserve dynamic-app settings (AC1–AC6).

Live delivery evidence will be retained in private operational receipts. Unchecked tasks are pending, not delivery claims.

Pre-merge evidence: Node 24.22.2 lint and all 468 tests passed without failures/skips. Both workflows passed actionlint and offline zizmor. Twelve isolated workflow fixtures verified exact hostname payloads, secret exclusion from arguments/output and fail-closed behavior for missing credentials, invalid zone IDs, HTTP failures, API rejection and malformed JSON. Live configuration and deployment were pending at that stage. Delivery evidence follows.

Delivery verified November 4, 2026:

- [PR35](https://github.com/bolens/bolens.github.io/pull/35) merged as `400ac1a45bf72d554c7b800971aafc47b98cbff3` after all applicable checks passed. [Main validation](https://github.com/bolens/bolens.github.io/actions/runs/41893368554) and [Pages deployment](https://github.com/bolens/bolens.github.io/actions/runs/41893943557) passed for that exact SHA, including the automatic hostname purge step.
- Hostname-specific cache rules respect origin/browser TTL and mark HTTP status codes 400 and higher no-store. Public HTML and assets produced cache HITs. A query-bearing asset on each site followed HIT, accepted hostname purge, MISS, HIT. No zone-wide purge was used.
- Both origin certificates remain validated through hostname-specific Strict TLS configuration rules. The existing zone-wide TLS mode and all dynamic homelab DNS records remain unchanged. Private before/after comparison found exactly six website proxy flags changed, with two necessary website TTL changes to Auto. All other DNS fields and mail records were preserved.
- Browser checks found both sites working, one analytics beacon each, no console errors, three intact Privacy Path mail links and working portfolio About navigation. The Privacy Path rule preserves published mail links without edge email rewriting. Existing Cloudflare security processing remains active. The edge serves the existing valid managed security contact with the same address/expiry; the origin files retain their canonical URLs.
- Credential creation/storage was explicitly approved. Separate Cache Purge-only tokens live in each github-pages environment. Source/tree/history scans found no secret material in the new commits. Actual token bytes are absent from both source trees. Offline fixtures, live purge observations, DNS snapshots and detailed operational receipts remain private outside Git.

Cloudflare purging does not invalidate browser or GitHub Pages origin caches. No instantaneous browser-cache freshness claim is made.
