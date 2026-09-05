# Tasks: 404 terrain, habitat, cryptids, and camp

**Input**: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/behavior.md](contracts/behavior.md).

These are retrospective documentation and verification tasks. Checked boxes do
not claim historical implementation work or unperformed manual review.

## Phase 1: Setup

- [x] T001 Record inspected revision, retrospective status, and scope in `spec.md`.

## Phase 2: Foundation

- [x] T002 Record ownership, state, and observed decisions in `plan.md`, `data-model.md`, `research.md`, and `contracts/behavior.md`.

## Phase 3: US1

**Independent acceptance**: Given the full campsite, when the view narrows or weather changes, then solid objects retain their silhouettes and river, trail, plants, shelter, and subjects remain in their intended layer/habitat.

- [x] T003 [US1] Map US1 requirements to named evidence in `plan.md` without claiming unperformed checks.

## Phase 4: US2

**Independent acceptance**: Given nighttime seated cryptids, when daytime is selected, then reusable Bigfoot, dogman, and perched mothman poses hide near trees and the alien appears in the flying craft without leftover seated-body lighting.

- [x] T004 [US2] Map US2 requirements to named evidence in `plan.md` and failure cases in `spec.md`.

## Phase 5: Verification

- [x] T005 Run the automated checks in `quickstart.md` through the full repository gate and record the outcome in `../audit.md`.
- [ ] T006 Perform manual checks in `quickstart.md` when the relevant visual or delivery change is next proposed; retain separate revision-specific evidence.
- [x] T007 Check path/ID links and spec quality in `checklists/requirements.md` and `../audit.md`.

## Dependencies and strategy

T001 -> T002 -> T003/T004 -> T005/T007. T006 requires the relevant manual or
delivery environment and is not completed by T005. US1 and US2 evidence can be
read independently after T002, but their shared `plan.md` has one writer.
No parallel writer is assigned. No historical implementation tasks are fabricated.
