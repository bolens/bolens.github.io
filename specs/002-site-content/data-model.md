# State and ownership: Site content and generation

## Entity 1

Project record: name, summary, status, technology, repository, optional site and case-study slug; one record feeds multiple public surfaces.

## Entity 2

Palette record: identifier, label, weather fallback, day/night tokens, and scene accents; generated consumers do not own these values.

## Entity 3

Generated region: output path and marked boundaries owned by the generator; surrounding authored content remains outside that ownership.

## Transitions and boundaries

Local routes remain native links. Project data consumed by commands must preserve optional-field handling and escaping. Generator check mode is non-mutating; write mode owns only documented output regions. Reader metadata and artwork remain public assets, never a route to publishing repository-only files.

See [plan.md](plan.md) for source owners and [spec.md](spec.md) for acceptance
rules. These are existing browser/file contracts, not a new database schema.
