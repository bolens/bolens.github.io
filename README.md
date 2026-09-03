# bolens.github.io

Michael Bolens' portfolio, built with semantic HTML, CSS, and inline SVG. It has no client-side JavaScript dependency.

## Preview

```sh
python3 -m http.server 4173
```

Then open <http://localhost:4173>.

## Verify

```sh
node scripts/build-site.mjs --check
node tests/check-site.mjs
node tests/theme-smoke.mjs
node tests/browser-smoke.mjs
```

Project listings, command-palette entries, shared page chrome, `sitemap.xml`, and `llms.txt` are generated from `data/projects.json` and `scripts/build-site.mjs`. Palette tokens, picker previews, browser theme colors, and 404 scene accents are generated from `data/themes.json`. Run `node scripts/build-site.mjs` after changing either data source or shared navigation.

## Appearance architecture

- `data/themes.json` owns palette definitions; `assets/theme-data.js` and `assets/theme-tokens.css` are generated and must not be edited directly.
- `assets/appearance-controller.js` owns atomic appearance transitions, preference validation, persistence, system-mode resolution, browser metadata, and subscriptions.
- `assets/appearance-picker.js` owns the appearance controls and their focus behavior.
- `assets/ui-overlay.js` aggregates picker and command-dialog state for animation consumers.
- `assets/command-palette.js` owns search, commands, and keyboard shortcuts and uses the public appearance and overlay interfaces.
