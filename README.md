# bolens.github.io

Michael Bolens' portfolio, built with semantic HTML, CSS, and inline SVG. It has no client-side JavaScript dependency.

## Preview

```sh
python3 -m http.server 4173
```

Then open <http://localhost:4173>.

## Verify

```sh
node scripts/lint.mjs
node --test --test-concurrency=2 --test-timeout=60000 tests/*.mjs
```

Tests require Node.js 24 and Chrome or Chromium. Each browser uses a separate
profile and an ephemeral loopback port. Browser fixtures fix the wall clock to
2026-09-03 12:00 UTC, use the en-US locale, and reject external fetches unless a
test supplies a response. Navigation waits for a new document. Animation tests
seek explicit phases, and scene behavior tests advance controlled frames and
timers. Source checks remain for asset structure and generated-file contracts.

The glob runs every top-level test file, including newly added tests. The timeout
bounds a stuck test and does not retry failures. To run a focused check, replace
`tests/*.mjs` with its file path.

Enable the tracked pre-commit hook once per clone:

```sh
git config core.hooksPath .githooks
```

The hook runs `node scripts/lint.mjs`, which checks JavaScript syntax, parses JSON,
verifies generated files, and validates the site contract. CI runs the same command
for pull requests and pushes to `main`, followed by the complete test suite.

Project listings, command-palette entries, shared page chrome, `sitemap.xml`, and `llms.txt` are generated from `data/projects.json` and `scripts/build-site.mjs`. Palette tokens, picker previews, browser theme colors, and 404 scene accents are generated from `data/themes.json`. Run `node scripts/build-site.mjs` after changing either data source or shared navigation.

## Appearance architecture

- `data/themes.json` owns palette definitions; `assets/theme-data.js` and `assets/theme-tokens.css` are generated and must not be edited directly.
- `assets/appearance-controller.js` owns atomic appearance transitions, preference validation, persistence, system-mode resolution, browser metadata, and subscriptions.
- `assets/appearance-picker.js` owns the appearance controls and their focus behavior.
- `assets/ui-overlay.js` aggregates picker and command-dialog state for animation consumers.
- `assets/command-palette.js` owns search, commands, and keyboard shortcuts and uses the public appearance and overlay interfaces.
