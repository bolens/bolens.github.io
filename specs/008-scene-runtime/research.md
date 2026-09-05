# Observed decisions: 404 rendering, parallax, and atmosphere

## Decision

The committed renderer uses native SVG/CSS animation plus bounded canvas effects. No Three.js, GSAP, or client framework migration is part of this baseline.

## Rationale and evidence

The source owners and checks in [plan.md](plan.md) document what exists at
`8ef9aa5`, not the original author's unstated motivations.

## Alternatives and limits

An engine migration remains a separate performance decision requiring measured before/after evidence. More animation targets are not justified by their visual appeal alone.

This is local repository evidence. Upstream services and policies have not been
re-audited by the application suite. Manual checks remain in [tasks.md](tasks.md).
