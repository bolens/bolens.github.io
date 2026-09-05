# Observed decisions: Site content and generation

## Decision

Keep JSON inputs and the existing generator as the source of truth. This is an observed architecture, not a newly chosen migration.

## Rationale and evidence

The source owners and checks in [plan.md](plan.md) document what exists at
`8ef9aa5`, not the original author's unstated motivations.

## Alternatives and limits

Hand-editing generated output would create drift. Replacing the generator is outside this documentation audit.

This is local repository evidence. Upstream services and policies have not been
re-audited by the application suite. Manual checks remain in [tasks.md](tasks.md).
