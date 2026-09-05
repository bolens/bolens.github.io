The suite uses Node's test runner and Chrome/Chromium through CDP. Run all tests
with the command in the repository README. The tests below cover site behavior
outside the 404 scene.

| Code | Behavioral coverage |
| --- | --- |
| `assets/appearance-controller.js` | `appearance-controller.mjs` checks restored and invalid preferences, preview precedence, persistence failure, metadata, atomic notifications, system changes, toggles, reset, and cross-tab events. `theme-smoke.mjs` verifies integration with actual theme data and CSS. |
| `assets/appearance-picker.js` | `picker-and-shortcuts.mjs` checks keyboard radio selection, inside/outside interaction, repeated opening, close controls, focus restoration, and overlay exclusivity. `interaction-contract.mjs` and `theme-smoke.mjs` cover synchronization and accessibility metadata. |
| `assets/ui-overlay.js` | `overlay-state.mjs` checks independent sources, duplicate operations, aggregate notifications, and DOM state at notification time. Browser suites verify actual dialogs. |
| `assets/command-palette.js` | `command-behavior.mjs`, `command-data-contract.mjs`, `command-failures.mjs`, `picker-and-shortcuts.mjs`, and `interaction-contract.mjs` cover search, scopes, selection, history, data escaping, optional commands, contextual actions, local navigation, browser actions, focus, modifier/editing guards, clipboard denial, and share cancellation. |
| `assets/case-study.js` | `case-navigation.mjs` controls geometry and frames to check reading-line boundaries, coalesced scrolling, resize, deep links, rapid hashes, cancelled alignment, resize/hash interleavings, native SVG link attributes, and empty/single-section documents. Browser command tests verify integration. |
| `assets/work-filters.js` | `work-filters.mjs`, `work-update-boundaries.mjs`, and `work-data-validation.mjs` cover combined filters, sort orders and ties, URL restoration/reset, cache expiry, malformed cache/API data, stale refresh, storage/API failure, accessibility of dates, and no-JavaScript content. |
| `assets/trail-glyphs.js` | `glyph-enhancement.mjs` verifies label/category mapping, chapter precedence, decorative semantics, preservation of existing content, and direction markers. Existing placement, hover, and layout suites verify actual pages and animation phases. |
| `assets/hobby-motion.js` | `hobby-motion-contract.mjs` checks independent visibility for home illustrations, batched observer entries, overlay and motion gates, and redundant notifications without restarting SVG timelines. `non404-motion.mjs` verifies actual CSS and SVG pause integration. |
| `assets/loading-state.js` | `loading-state-contract.mjs` checks loading/complete startup, two-frame reveal, fallback without load, late load, and idempotence with controlled timers and frames. |
| `scripts/build-site.mjs` and generated data | `build-site-contract.mjs` and `build-and-lint-validation.mjs` check validation, generated data/wiring, check-mode preservation, idempotence, reader preservation, and cleanup after an injected filesystem failure. |
| `scripts/lint.mjs` | `build-and-lint-validation.mjs` checks successful lint and rejection of syntax errors, malformed JSON, and stale output, plus dependency/Git exclusions. |
| `tests/check-site.mjs` | `check-site-contract.mjs` and `site-checker-validation.mjs` check HTML structure, metadata, fragments, local assets, declarative JSON, CSS references, comments, and social-image dimensions. |

`non404-motion.mjs` also checks complete graphics under both reduced-motion settings, native chapter activation, stable hover text dimensions, hero overflow, and restrained introduction phases. System reduced-motion checks include pages with JavaScript disabled.

Determinism rules:

- Test observable state and independently specified expected values. Do not copy
  an implementation's algorithm into its assertion or assert source formatting.
- Use VM fixtures for time, geometry, events, and frame scheduling. Browser tests
  use isolated profiles and loopback ports, a fixed clock and locale, and explicit
  API responses. External fetches fail unless a fixture supplies them.
- Wait for actual completion state. A changed hash alone does not mean chapter
  scrolling has finished. Animation checks seek explicit phases. Short glyph
  fixtures freeze the animation clock before hover creates effects, so effects
  cannot expire before sampling. Command tests that depend on chapter alignment
  use reduced motion.
- Browser targets emulate focus so CSS focus state agrees with keyboard focus
  even when their debugger tab is inactive.
- Native browser actions such as print and history navigation can be captured at
  their platform boundary. Keep application search, selection, and dispatch real.
- Build and lint tests mutate disposable copies. Their shared fixture creates a
  neutral error page and excludes the evolving 404 assets.
- Do not retry failing tests or use wall-clock sleeps to hide missing synchronization.
  Timeouts bound hangs and report failures.

Browser layout and input integration still depend on Chromium and machine
resources. VM tests cover scheduling and state transitions without those
variables. Determinism checks should include a different host locale/timezone and
higher test concurrency, rather than repeated retries until a run passes.
