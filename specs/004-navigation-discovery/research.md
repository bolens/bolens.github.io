# Observed decisions: Navigation and project discovery

## Decision

Retain native anchors and progressively enhance existing project links. Repository update metadata is optional, not a prerequisite for rendering the project list.

## Rationale and evidence

The source owners and checks in [plan.md](plan.md) document what exists at
`8ef9aa5`, not the original author's unstated motivations.

## Alternatives and limits

A mandatory client fetch or router would weaken offline/failure behavior and is not part of the current design.

This is local repository evidence. Upstream services and policies have not been
re-audited by the application suite. Manual checks remain in [tasks.md](tasks.md).
