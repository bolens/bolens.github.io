# Tasks: Daytime campsite activities
## Setup
- [x] T001 Record requirements and ownership in spec.md and plan.md.
## Tree hideouts
- [x] T002 [US1] Correct 404.html peeking proportions and pine/Mothman overlap.
## Outdoor campers
- [x] T003 [US2] Add reusable activity glyphs and named ground anchors in 404.html.
- [x] T004 [US2] Add nonduplicating time/shelter visibility in assets/404.css.
## Alien route
- [x] T005 [US3] Add covered route endpoints and reduced-motion peek in assets/404.css and 404.html.
## Verification
- [x] T009 Lower and screen upstream river/trail entrances; verify seasonal root clearances.
- [x] T010 Refine Silken Windhound anatomy and verify depth-relative scale and grip contacts.
- [x] T006 Add and run tests/daytime-camp-activities.mjs for pose, scale, cover, and state contracts.
- [x] T007 Inspect desktop/phone static and fixed-phase browser captures.
- [x] T008 Run lint and the full README gate; record results here.

T001 precedes all code. T002/T003 precede T004. T005 uses existing sky ownership.
T006/T007 verify all stories; T008 follows focused verification. No concurrent writer.

## Evidence
Desktop 1440x900 and phone 390x844 captures were inspected for character scale,
grounding, upstream cover, and fixed saucer phases. Native geometry checks cover
both river sources and woody roots in clear, rainy, thunderstorm, snowy, and drought
states. Pose checks verify dry feet/paws, float placement, rod grip, depth ratios,
shelter precedence, and script-disabled system light/dark fallbacks.
Saucer checks seek fixed phases and verify both saved and system reduced motion.
Existing shared symbols remain the source of portraits and the alien pilot.

Final acceptance on 2026-09-05: `node scripts/lint.mjs` passed. The complete README
command passed 435 tests with zero failures, skips, or cancellations in 225403 ms.
The final saved/system reduced-motion route check also passed independently.
`git diff --check` passed. Eight feature documents and their local links validated.
This is local implementation evidence, not a publication or CI delivery claim.
