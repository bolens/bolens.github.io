# bolens.github.io Spec Kit project guide

A static portfolio with generated project/navigation data and browser-tested interactive
presentation.

Read this guide with `AGENTS.md` and `.specify/memory/constitution.md` before
specifying, planning, or implementing a substantial change. It is project-owned
guidance, not an upstream-managed template.

## Source and ownership map

- `data/projects.json`
- `data/themes.json`
- `scripts/build-site.mjs`
- `assets/`
- `tests/README.md`

## Specification and plan decisions

Identify the page or interaction, source data, generated outputs, and shared controller
ownership. Preserve canonical routes, accessible navigation, theme preference, reduced
motion, and browser-native fallbacks. Do not hand-edit generated project or theme
surfaces.

## Acceptance evidence

Cover keyboard and pointer behavior, narrow layouts, theme changes, reduced motion,
missing storage, failed fetches, navigation, and 404 behavior where affected. Browser
fixtures use isolated profiles, fixed time, and controlled external responses.

## Validation and operational limits

```sh
node scripts/lint.mjs
node --test --test-concurrency=2 --test-timeout=60000 tests/*.mjs
```

Run node scripts/build-site.mjs after changing generator inputs. Tests require Node.js
24 and Chrome or Chromium. Merging main deploys Pages. Publication review must
include every file in the allowlisted public artifact staged by
`.github/workflows/deploy-pages.yml`. Repository instructions and specs are not
part of that artifact.

## Working through Spec Kit

Use Spec Kit for new capabilities, architectural or security-sensitive changes,
migrations, and coordinated changes that need a written contract. Keep narrow fixes,
dependency updates, and prose maintenance in the normal PR workflow.

For a new feature, record observable acceptance criteria in `spec.md`, source ownership
and constitution checks in `plan.md`, and evidence-bearing work in `tasks.md` under the
feature directory created by Spec Kit. Resolve material unknowns before implementation.
Mark tasks complete only after their stated verification, and distinguish completed,
skipped, blocked, and manual checks. Retain completed feature documents as decision
history. Backfill finished code only when explicitly requested. Such documents
must say they are retrospective baselines, identify the inspected revision, map
acceptance criteria to existing evidence, and distinguish observed behavior from
proposed improvements. Do not invent pre-implementation decisions or completed
test runs. The coverage register is `specs/README.md`.

Keep `.specify/templates/`, `.specify/scripts/`, and generated Codex skills under their
integration manifests. Use this guide and the constitution for local customization.
Regenerate managed files through Spec Kit and verify that project-owned memory survives
updates. Follow `RELEASING.md` for push, merge, release or delivery, and recovery.
