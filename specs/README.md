# Specification coverage

Audited on 2026-09-05 against `8ef9aa5` and the local `feat/404-season-moon` changes.

## What requires a specification

[AGENTS.md](../AGENTS.md) and the [project guide](../.specify/memory/project-guide.md)
require Spec Kit for new capabilities, architecture, security-sensitive behavior,
migrations, and coordinated changes needing a written contract. Each feature keeps
`spec.md`, `plan.md`, and `tasks.md`. Narrow fixes, dependency updates, and prose
maintenance use the normal PR workflow.

At the user's explicit request, the policy now allows labeled retrospective
baselines. The packages below record existing ownership and evidence, not invented
design history. A future substantial change to any listed subsystem still needs
its own feature contract before implementation. An existing test is evidence, not
a substitute for that contract.

## Feature register

| Feature | Status | Contract and evidence |
| --- | --- | --- |
| Seasonal firefly eligibility and lunar phases | Implemented locally, not published | [Spec](001-season-moon/spec.md), [plan](001-season-moon/plan.md), [tasks](001-season-moon/tasks.md), [state contract](001-season-moon/contracts/scene-state.md), [traceability](001-season-moon/coverage.md), [quality checklist](001-season-moon/checklists/requirements.md) |
| Site content and generation | Retrospective baseline | [002-site-content](002-site-content/spec.md) |
| Appearance, overlays, and commands | Retrospective baseline | [003-appearance-commands](003-appearance-commands/spec.md) |
| Navigation and project discovery | Retrospective baseline | [004-navigation-discovery](004-navigation-discovery/spec.md) |
| Shared glyphs and page motion | Retrospective baseline | [005-glyph-motion](005-glyph-motion/spec.md) |
| 404 conditions, time, and lighting | Retrospective baseline through PR #12 | [006-scene-environment](006-scene-environment/spec.md) |
| 404 terrain, habitat, cryptids, and camp | Retrospective baseline through PR #12 | [007-scene-composition](007-scene-composition/spec.md) |
| 404 rendering, parallax, and atmosphere | Retrospective baseline through PR #12 | [008-scene-runtime](008-scene-runtime/spec.md) |
| Verification, delivery, and repository tooling | Retrospective baseline | [009-verification-delivery](009-verification-delivery/spec.md) |
| Daytime activities, tree peeks, and covered routes | Implemented and verified locally, not published | [Spec](010-daytime-activities/spec.md), [plan](010-daytime-activities/plan.md), [tasks](010-daytime-activities/tasks.md) |
| Bird, moth, rainbow, real location/weather provider, and precise astronomical behavior | Candidate ideas, not scoped or implemented in this pass | Create separate feature contracts if selected. This register does not authorize implementation or publication. |

The register covers this checkout, not uncommitted changes in other agents'
worktrees. Their owners retain responsibility for their own active feature docs.
Completed feature directories must remain in history after delivery.

## Site and shared browser systems

Paths below are relative to the repository root. Test names are relative to `tests/`.
[tests/README.md](../tests/README.md) describes the non-404 behavior in more detail.

| Surface and owner | Existing contract evidence |
| --- | --- |
| `index.html`, `assets/home.css`: home content and illustrations | `browser-smoke.mjs`, `non404-motion.mjs`, `hobby-sequence.mjs`, `project-evidence-layout.mjs` |
| `about/index.html`, `assets/about.css`: biography and detail rows | `detail-row-layout.mjs`, `glyph-site-placement.mjs`, `browser-smoke.mjs` |
| `work/index.html`, `assets/work.css`, `assets/work-filters.js`: project filtering, sorting, URL/cache state | `work-filters.mjs`, `work-update-boundaries.mjs`, `work-data-validation.mjs` |
| `case-studies/aur-response-toolkit/index.html`, `case-studies/launch-layer/index.html`, `case-studies/millennium-helpers/index.html`, `case-studies/privacy-devices/index.html`, `case-studies/uddns/index.html`, `assets/case-study.css`, `assets/case-study.js`: case content and chapter navigation | `case-navigation.mjs`, `browser-navigation.mjs`, `command-behavior.mjs`, site validation |
| `assets/site.css`, `assets/pages.css`: shared layout, typography, focus, and responsive surfaces | `interaction-contract.mjs`, `detail-row-layout.mjs`, `glyph-layout-stability.mjs`, `project-evidence-layout.mjs` |
| `assets/appearance-controller.js`: appearance preference, persistence, system resolution, metadata, and notification ownership | `appearance-controller.mjs`, `theme-smoke.mjs` |
| `assets/appearance-picker.js`: appearance and 404-only scene controls, focus | `picker-and-shortcuts.mjs`, `interaction-contract.mjs`, `theme-smoke.mjs` |
| `assets/ui-overlay.js`: shared overlay state | `overlay-state.mjs`, `picker-and-shortcuts.mjs` |
| `assets/command-palette.js`: commands, search, shortcuts, native actions, focus | `command-behavior.mjs`, `command-data-contract.mjs`, `command-failures.mjs`, `picker-and-shortcuts.mjs` |
| `assets/page-transitions.js`: route/history direction and native transition fallbacks | `page-transition-contract.mjs`, `page-transitions.mjs` |
| `assets/loading-state.js`: bounded initial reveal | `loading-state-contract.mjs`, `browser-smoke.mjs` |
| `assets/hobby-motion.js`: home illustration lifecycle and motion gates | `hobby-motion-contract.mjs`, `hobby-sequence.mjs`, `non404-motion.mjs` |
| `assets/trail-glyphs.js`, `assets/trail-glyphs.svg`: shared interface glyphs and enhancement | `glyph-enhancement.mjs`, `glyph-colors.mjs`, `glyph-site-placement.mjs`, `glyph-hover-motion.mjs`, `role-glyph-motion.mjs`, `wrench-glyph-motion.mjs` |
| `assets/favicon.svg`, `assets/social-card.svg`, `assets/social-card.png`, `assets/social-card-v2.png`: public identity and social artwork | `check-site-contract.mjs`, `site-checker-validation.mjs` cover references and image constraints, not editorial accuracy |

## 404 scene systems

`404.html` owns the shared symbols, named regions, placements, static fallback, and
return link. `assets/404.css` owns material styling, layer visibility, and authored
motion. The controllers below consume the existing appearance and overlay owners.
Only the season/moon additions are part of the active feature contract.

| Owner or concern | Existing contract evidence |
| --- | --- |
| `assets/404-weather.js`: theme fallback, explicit condition, optional environment | `weather-fallback.mjs`, `condition-reactivity.mjs`, active season/moon spec |
| `assets/404-time.js`: explicit/appearance/clock precedence, celestial position, shadows, meal windows, lunar phase | `scene-time.mjs`, `surface-lighting.mjs`, active season/moon spec |
| `assets/404-motion.js`: coherent condition/time motion profiles | `scene-motion-profiles.mjs`, `windy-condition.mjs` |
| `assets/404-renderer.js`: animation targets, tier budgets, pause/resume | `scene-renderer-budget.mjs`, `night-visibility-browser.mjs`, `parallax-browser-stability.mjs` |
| `assets/404-scene.js`: canvas atmosphere, parallax scheduling, density, cooking exposure | `scene-atmosphere.mjs`, `parallax-stability.mjs`, `responsive-scene-density.mjs`, `marshmallow-cooking.mjs` |
| Symbol reuse, material variants, named regions, and detail layers | `landscape-asset-reuse.mjs`, `sky-asset-reuse.mjs`, `asset-region-contract.mjs`, `terrain-asset-variants.mjs`, `terrain-detail-layers.mjs` |
| Paint order, opacity, solid terrain, inline layers, and surface light | `glyph-paint-order.mjs`, `terrain-opacity-contract.mjs`, `inline-scene-layers.mjs`, `scene-placement-layers.mjs`, `surface-lighting.mjs` |
| Tree/brush/river habitat placement, trail and river continuity | `scene-habitat-placement.mjs`, `route-continuity.mjs`, `scene-placement-layers.mjs` |
| Scattered floor leaves and mushroom groups | `leaf-litter-motion.mjs`, `mushroom-layout-variation.mjs` |
| Cryptid body plans, reusable daytime poses, tent occupants | `cryptid-anatomy.mjs`, `daytime-cryptid-poses.mjs`, `misty-ground-and-campers.mjs` |
| Fire ring, logs, coals, smoke, food, and time/condition heat | `firepit-layout.mjs`, `fire-motion-contract.mjs`, `camp-food-detail.mjs`, `marshmallow-cooking.mjs`, `condition-reactivity.mjs` |
| Rain, snow, wind, mist, cloud cover, and condition surfaces | `weather-overlay-contract.mjs`, `weather-flow.mjs`, `windy-condition.mjs`, `misty-ground-and-campers.mjs` |
| Night events, stars, fireflies, and phase geometry | `night-sky-reactivity.mjs`, `night-visibility-browser.mjs`, `scene-atmosphere.mjs`, `season-moon-browser.mjs` |
| Flash prevention, coherent parallax planes, responsive density, and motion bounds | `scene-flash-safety.mjs`, `parallax-plane-contract.mjs`, `parallax-browser-stability.mjs`, `parallax-stability.mjs`, `responsive-scene-density.mjs` |

Source-structure checks do not establish pixel-perfect rendering or performance
on every device. Browser captures and controlled scheduling tests provide different
evidence. Do not describe these inventories as exhaustive proof of runtime correctness.

## Data, generation, validation, and delivery

| Surface and owner | Existing contract evidence or policy |
| --- | --- |
| `data/projects.json`, `scripts/build-site.mjs` -> `assets/project-data.js`, generated page regions, `sitemap.xml`, `llms.txt` | `build-site-contract.mjs`, `build-and-lint-validation.mjs`, `command-data-contract.mjs`. Edit source inputs, not generated outputs. |
| `data/themes.json`, `scripts/build-site.mjs` -> `assets/theme-data.js`, `assets/theme-tokens.css`, generated theme controls | `build-site-contract.mjs`, `theme-smoke.mjs`, `weather-fallback.mjs` |
| `robots.txt`, `.nojekyll`, root/page metadata | `tests/check-site.mjs`, `check-site-contract.mjs`, `site-checker-validation.mjs`, Pages staging policy |
| `scripts/lint.mjs`, `.githooks/pre-commit`, `tests/check-site.mjs` | `build-and-lint-validation.mjs`, `check-site-contract.mjs`, `site-checker-validation.mjs`, README verification commands |
| `tests/lib/browser-environment.mjs`, `tests/lib/browser-test.mjs`, `tests/lib/cdp-browser.mjs`, `tests/lib/site-server.mjs` | `browser-helper-contract.mjs`, `browser-isolation.mjs`, `browser-navigation.mjs`, `server-lifecycle.mjs` |
| `tests/lib/scene-harness.mjs`, `tests/lib/site-fixture.mjs`, `tests/lib/ui-fixture.mjs` | Scene VM suites, disposable build/lint suites, `ui-fixture-contract.mjs`. See isolation rules in `tests/README.md`. |
| `.github/workflows/lint.yml` | README and tests/README: lint always, non-Markdown PR changes and all main/manual runs execute three test shards, required aggregate fails closed. Workflow configuration is not proven by the application test count. |
| `.github/workflows/deploy-pages.yml` | `RELEASING.md`: validated exact main revision, allowlisted public artifact, superseded-revision checks, live verification and corrective PR recovery |
| `.github/workflows/auto-assign.yml` | Existing repository administration workflow, not a new site capability in this pass |
| `.github/workflows/spec-kit.yml`, `.specify/integration.json`, `.specify/integrations/`, `.specify/init-options.json`, `.specify/workflows/`, `.specify/scripts/`, `.specify/templates/`, `.agents/skills/speckit-*/` | Managed Spec Kit integration and manifests. Its workflow validates integration, not the semantic completeness of every feature. Do not hand-edit managed files. |
| `AGENTS.md`, `.specify/memory/constitution.md`, `.specify/memory/project-guide.md`, `README.md`, `tests/README.md`, `RELEASING.md`, `specs/` | Project-owned policy, acceptance evidence, and retained feature history. `.specify/feature.json` is an ignored local feature selector, not shared decision history. |

## Audit outcome and limits

See [audit.md](audit.md) for this pass's path/ID checks, test results, and remaining
manual or follow-up work.

- The active feature has all three required core artifacts. Added state-contract
  details and requirement/evidence traceability close its documentation gaps.
- Eight retrospective packages cover existing committed capabilities at the
  user's request. AGENTS.md and the project guide now permit explicit backfills
  with provenance and honest verification status. Constitution principles did
  not change.
- Every current public page, asset, data source, script, and workflow is classified
  above. Test infrastructure and managed tooling have explicit ownership groups.
- Historical verification receipts remain historical. This documentation pass
  does not rerun deployment or claim that another agent's work is verified.
- New capability work must update the feature register and retain its own spec,
  plan, tasks, evidence, and delivery status. Do not mark manual or pending checks
  complete based on a source-code inspection.

## Selecting a package

The ignored `.specify/feature.json` currently selects `specs/001-season-moon`.
Retrospective packages are documentation baselines, not eight active implementation
branches. Do not switch another agent's branch to inspect them. Read a package
directly, or explicitly select its directory for a scoped Spec Kit review. Restore
the original local selector afterward if the command changes it.

No extension/preset hooks were configured during this audit. Managed templates,
scripts, workflow references, and integration manifests were not edited.
