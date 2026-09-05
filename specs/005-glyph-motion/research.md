# Observed decisions: Shared glyphs and page motion

## Decision

Keep native page navigation and shared motion gates. Tests seek authored animation phases rather than sampling arbitrary wall-clock instants.

## Rationale and evidence

The source owners and checks in [plan.md](plan.md) document what exists at
`8ef9aa5`, not the original author's unstated motivations.

## Alternatives and limits

Animating layout dimensions or adopting a client router is outside this baseline and would need a separate measured contract.

This is local repository evidence. Upstream services and policies have not been
re-audited by the application suite. Manual checks remain in [tasks.md](tasks.md).
