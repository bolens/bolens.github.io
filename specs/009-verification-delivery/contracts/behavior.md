# Behavior boundaries: Verification, delivery, and repository tooling

Local gate: node scripts/lint.mjs then node --test --test-concurrency=2 --test-timeout=60000 tests/*.mjs with Node 24 and Chromium. CI partitions the same file glob into three shards and retains diagnostics. Spec Kit workflow checks managed integration; semantic spec coverage is an additional documentation review, not implied by a green tooling check.

## Compatibility

Preserve the routes, authored content, state ownership, and failure behavior in
[spec.md](../spec.md). This record adds no external service, persistence format,
or authority to publish.

## Evidence

[plan.md](../plan.md) maps requirements to tests or manual checks.
[quickstart.md](../quickstart.md) describes runnable verification.
