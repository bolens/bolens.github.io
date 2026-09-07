# Agent guidance

[Documentation](docs/README.md) maps architecture, deployment, state, and document ownership.

Use [README.md](README.md) to locate site sources and [tests/README.md](tests/README.md) to select behavior
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
  [README.md](README.md) for broad changes. Follow [RELEASING.md](RELEASING.md) for PRs and Pages delivery.

## Planning and evidence

Use the [project guide](.specify/memory/project-guide.md) and
[constitution](.specify/memory/constitution.md) for substantial changes. The guide
owns Spec Kit scope, retained history, retrospective requirements, and acceptance
evidence. Prose maintenance uses the normal repository workflow.

## Context and handoffs

- Search before reading. Use bounded source excerpts for exploratory reads over
  350 lines, and inspect required guidance and actual source before editing.
- When delegation is permitted, assign a bounded question or output, paths, and
  check. Return source locations, changes, and verification gaps for final review.
- Keep durable corrections in the [project guide](.specify/memory/project-guide.md)
  or owning contract. Replace superseded advice and read it before reuse.
  Temporary progress belongs in task notes. Preserve existing authority rules.
