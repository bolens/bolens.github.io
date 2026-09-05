# Observed decisions: Verification, delivery, and repository tooling

## Decision

Retain the existing validated-main workflow_run deployment boundary and allowlisted artifact. Repository-only specs, tests, source data, and instructions are not public site content.

## Rationale and evidence

The source owners and checks in [plan.md](plan.md) document what exists at
`8ef9aa5`, not the original author's unstated motivations.

## Alternatives and limits

Deploying every repository file or accepting PR artifacts would weaken the current boundary. Reusable upstream workflow internals are not re-audited by local application tests.

This is local repository evidence. Upstream services and policies have not been
re-audited by the application suite. Manual checks remain in [tasks.md](tasks.md).
