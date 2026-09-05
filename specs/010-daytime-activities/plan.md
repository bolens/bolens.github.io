# Plan: Daytime campsite activities
**Date**: 2026-09-05 | **Spec**: [spec.md](spec.md)

## Technical context
Use existing static SVG symbols and CSS state selection. No dependency or JS controller is added.
404.html owns geometry/placement; assets/404.css owns daytime/shelter visibility and saucer motion.
The existing renderer retains its saucer animation slot.

## Constitution check
Reuse source-owned artwork, preserve keyboard/return-link semantics and reduced motion,
use isolated fixed-phase browsers, and do not publish without an authorized delivery request.

## Ownership and verification
- FR-001/002: 404.html hideout transforms and paint order; browser geometry and captures.
- FR-003/004: shared activity symbols and dry-ground placements; browser prop/ground assertions.
- FR-005: assets/404.css time/shelter gates; all five times and representative weather.
- FR-006: retained ridge cover, shared scout-ufo, CSS route; fixed phase captures.
- FR-007/008: existing material/detail conventions and renderer; budget, region, layout, and full tests.
- FR-009: ground-level route geometry and a low opaque screen; route continuity and all seasonal habitat checks.
- FR-010: shared windhound portrait with folded ears and coat layers, adult stance, and foreground kneeling pose; deterministic dog/adult, depth, grip, and bank-contact checks.
- Tests: tests/daytime-camp-activities.mjs and existing daytime-cryptid-poses, habitat, region, opacity, renderer-budget suites.

## Sequence
Record contract, add failing behavior checks, adjust geometry and shared glyphs,
verify static poses, then route phases and the complete gate. One writer owns shared HTML/CSS.
