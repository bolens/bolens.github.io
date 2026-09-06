# Validate seasonal customization

Requires Node.js 24 and Chromium. From the repository root:

```sh
node scripts/lint.mjs
node --test --test-concurrency=2 --test-timeout=60000 tests/weather-fallback.mjs tests/season-customization.mjs tests/season-motion.mjs
node --test --test-concurrency=2 --test-timeout=60000 tests/*.mjs
```

For manual inspection, run `python3 -m http.server 4173` and open
`http://localhost:4173/404.html`. Open appearance controls (Alt+P), use arrow keys
through season and lunar groups, and compare clear daytime spring/summer/autumn/
winter. Rain should retain seasonal identity; winter should not acquire snow
until snowy weather is selected. Moon changes are visible at night.

Repeat at desktop and phone widths and with reduced motion. Tab to the final
control and close; verify focused controls can be scrolled into view and focus
returns correctly. Check another page has no scene controls. Browser captures
belong in a unique temporary directory; record inspected states in verification.md.
