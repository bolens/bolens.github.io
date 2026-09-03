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

Project listings, command-palette entries, shared page chrome, `sitemap.xml`, and `llms.txt` are generated from `data/projects.json` and `scripts/build-site.mjs`. Run `node scripts/build-site.mjs` after changing project data or shared navigation.
