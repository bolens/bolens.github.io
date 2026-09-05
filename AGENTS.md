# Agent guidance

Read `.specify/memory/constitution.md`, `.specify/memory/project-guide.md`,
`README.md`, and `tests/README.md` before planning or implementing changes.

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
Retain completed feature directories under `specs/` as decision history; do not
backfill specifications for already finished work.
