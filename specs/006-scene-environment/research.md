# Observed decisions: 404 conditions, time, and lighting

## Decision

Keep appearance, weather, time, and motion as separate state owners with explicit subscriptions. Weather material changes consume these owners rather than independently guessing time.

## Rationale and evidence

The source owners and checks in [plan.md](plan.md) document what exists at
`8ef9aa5`, not the original author's unstated motivations.

## Alternatives and limits

A live location service or ephemeris is not present in the committed baseline. Adding either needs a privacy and fallback contract.

This is local repository evidence. Upstream services and policies have not been
re-audited by the application suite. Manual checks remain in [tasks.md](tasks.md).
