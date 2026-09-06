# Agent guidance

Use `README.md` to locate site sources and `tests/README.md` to select behavior
and browser checks. For substantial changes, read the constitution and project
guide under `.specify/memory/`. Prose-only edits need the affected content and
its source, without unrelated browser or architecture documentation.

- Keep public content accurate and private information out of published files.
- Edit generated project and theme surfaces through their data sources and
  `scripts/build-site.mjs`. Inspect intended generated diffs.
- Preserve shared controller ownership, keyboard use, reduced motion,
  responsive layouts, and useful fallbacks when browser APIs fail.
- Use isolated browser fixtures and owned loopback servers. Never reuse a
  personal browser profile or depend on live third-party responses in tests.
- Run `node scripts/lint.mjs`, then the relevant test and the full command in
  `README.md` for broad changes. Follow `RELEASING.md` for PRs and Pages delivery.

## Spec-driven changes

Use Spec Kit for new capabilities, architecture, security-sensitive behavior,
migrations, and coordinated changes needing a written contract. Keep narrow
fixes, dependency updates, and prose maintenance in the normal PR workflow.
Retain completed feature directories under `specs/` as decision history.
Backfill finished work only when explicitly requested. Label those documents as
retrospective baselines, record the inspected revision and evidence, and separate
observed behavior from proposed improvements. Never imply they preceded the code
or mark unverified acceptance checks complete. See `specs/README.md` for coverage.

## Context and handoffs

- Locate source with targeted searches before reading. For exploratory reads of
  files over 350 lines, select relevant ranges. Read required guidance and actual
  source before edits or correctness claims; summaries do not replace them.
- When delegation is permitted, give each worker one question or concrete output,
  allowed paths, and a check. Return findings with source locations, changed paths,
  and verification gaps. Keep final review with the coordinating agent.
- Record durable user corrections in the [project guide](.specify/memory/project-guide.md)
  or owning contract with scope, reason, and evidence. Replace superseded advice;
  read relevant corrections before reusing assumptions. Keep temporary progress
  in task notes and preserve existing authority rules.
