# State and ownership: Verification, delivery, and repository tooling

## Entity 1

Validation candidate: exact source revision, lint result, required shard results, and retained diagnostics.

## Entity 2

Deployment candidate: successful main validation SHA, still-current check, public artifact, and live URL.

## Entity 3

Managed integration: immutable workflow/tooling references and file manifests, separate from project-owned memory.

## Entity 4

Delivery receipt: PR/head/merge SHAs, workflow outcomes, live checks, and exact completed branch cleanup.

## Transitions and boundaries

Local gate: node scripts/lint.mjs then node --test --test-concurrency=2 --test-timeout=60000 tests/*.mjs with Node 24 and Chromium. CI partitions the same file glob into three shards and retains diagnostics. Spec Kit workflow checks managed integration; semantic spec coverage is an additional documentation review, not implied by a green tooling check.

See [plan.md](plan.md) for source owners and [spec.md](spec.md) for acceptance
rules. These are existing browser/file contracts, not a new database schema.
