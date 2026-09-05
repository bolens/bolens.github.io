# Portfolio Constitution

## Core principles

### I. Accurate public content

Project descriptions, authorship, links, and case studies must remain
supportable. Private contact details, credentials, and internal infrastructure
must not enter source, generated output, or published artifacts.

### II. Generated content has one source

Project and theme data belong in `data/projects.json` and `data/themes.json`.
Shared navigation and generated assets come from `scripts/build-site.mjs`.
Generated files must not drift from their sources or be edited independently.

### III. Accessible, resilient browser behavior

Navigation, dialogs, filters, theme selection, and motion must support keyboard
use, responsive layouts, reduced motion, and failure of optional browser APIs.
Shared controllers own state and lifecycle behavior. Preserve stable routes and
useful fallback content when enhancement fails.

### IV. Isolated verification

Browser tests use isolated profiles, controlled time and responses, and owned
loopback servers. They must not reuse personal browser state or depend on live
third-party services. Source contracts and browser behavior both need evidence
when affected.

### V. Reviewed continuous deployment

Changes reach `main` through reviewed PRs with passing checks. The Pages workflow
validates and deploys the repository artifact. Verify the resulting deployment
and recover through corrective or revert PRs rather than rewriting history.

## Governance

`AGENTS.md`, `.specify/memory/project-guide.md`, `tests/README.md`, and
`RELEASING.md` describe implementation and delivery. Record the impact of a
principle change, update this constitution's version, and keep affected guidance
and validation synchronized.

**Version**: 1.0.0 | **Ratified**: 2026-09-05 | **Last Amended**: 2026-09-05
