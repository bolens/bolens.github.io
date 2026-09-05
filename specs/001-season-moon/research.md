# Season and moon decisions

## Decision

Use optional caller-supplied environment and an approximate mean lunar cycle.
Keep existing weather and time controllers as owners.

## Rationale

Unknown location must not become an invented season or habitat. The temperature
gate is an illustrative art rule. Lunar phases provide variation without another
continuous animation owner or external service. Sources and numerical assumptions
are retained in [plan.md](plan.md).

## Alternatives and limits

A live weather provider, geolocation inference, species-specific emergence model,
and precise ephemeris are deferred. Each would need a separate privacy, fallback,
accuracy, and verification contract. This decision does not claim those systems
were implemented.
