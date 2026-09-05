# Observed decisions: Appearance, overlays, and commands

## Decision

Keep one appearance owner and one aggregate overlay owner. Controls consume their public state instead of creating parallel persistence.

## Rationale and evidence

The source owners and checks in [plan.md](plan.md) document what exists at
`8ef9aa5`, not the original author's unstated motivations.

## Alternatives and limits

Independent picker/search preference state would allow conflicting UI. A new dialog framework is not part of this baseline.

This is local repository evidence. Upstream services and policies have not been
re-audited by the application suite. Manual checks remain in [tasks.md](tasks.md).
