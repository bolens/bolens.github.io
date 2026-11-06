The suite uses Node's test runner and Chrome/Chromium through CDP. Run all tests
with the command in the repository README. The tests below cover site behavior
outside the 404 scene.

The [specification register](../specs/README.md) maps all existing test files to
subsystems, including the 404 scene. Retrospective packages separate requirements,
automated evidence, and manual checks. The [backfill audit](../specs/audit.md)
records documentation validation and any remaining verification gaps.

The active [daytime activities contract](../specs/010-daytime-activities/spec.md)
adds `daytime-camp-activities.mjs` for occupancy, depth-relative scale, dry-bank and
rod contacts, and script-disabled fallbacks. `daytime-saucer-route.mjs` checks fixed
flight phases and both reduced-motion preferences. `scene-habitat-placement.mjs`
also checks opaque upstream cover across seasonal water levels.
The activity check also verifies the loaded rod's downward tip, connected line
endpoints, and all three bobber ripple contours remaining in the river at each
tested water level. Ripples share the float's water-level translation.
The same glyph is stowed against the tent whenever campers shelter. The activity
matrix checks mutually exclusive rod placements, a relaxed stored shape with no
cast line or ripples, foreground paint order, viewport containment, and the
script-disabled fallback. Night captures cover desktop and phone visibility.
`fishing-glyph-rendering.mjs` measures native SVG-instance pixels to verify the
relaxed stored rod, hidden cast line and ripples, and wet/drought translations of
the painted float, ripple contours, and connected line.

The [seasonal customization contract](../specs/011-season-customization/spec.md)
adds `season-customization.mjs` for native season/moon controls, independent resets,
external state synchronization, all 55 season/weather combinations, and actual
SVG-instance pixel checks. `season-motion.mjs` checks unchanged animation budgets,
two fixed wind phases, both reduced-motion preferences, and narrow/short panels.
`weather-fallback.mjs` checks the frozen season catalog and DOM state at notification.
Each seasonal viewport trial owns a fresh browser and awaits verified process
cleanup before the next trial; its 55-state matrix, transitions, captures and
shared error aggregation remain intact. Actual ordinary terrain instances keep
all eleven color functions while runtime shadow tokens stay empty, including all
weather/light cases; the CSS-only fallback retains its shadows and color chain.
`browser-processes-contract.mjs` covers process identity, zombie exclusion,
detached descendants, PID reuse and unanchored-session rejection.

`picker-performance.mjs` counts animation-allocation writes and atmosphere redraws
for unchanged control inputs at desktop and phone widths. It also verifies real
weather/time repainting, overlay pause/resume, reduced motion, and the CSS-only
pause fallback. These are deterministic work-count assertions, not timing budgets.
`scene-motion-profiles.mjs` checks duplicate-notification suppression and unsubscribe.

`parallax-cursor.mjs` drives real mouse input over the illustration and foreground
card at desktop and phone widths, captures both settled positions, and checks
overlay and reduced-motion gates. `parallax-stability.mjs` uses controlled frames
to cover prompt tracking, softer return, one geometry read per input burst,
stationary-cursor remapping on scroll, viewport exit, and cancellation.

`river-containment.mjs` checks native painted hit regions against both the fixed
bank boundary and moving water surface at two widths and six weather states.
It verifies that foam/currents follow the water while bank roots remain fixed,
and captures normal, storm, and drought levels for visual inspection.

`trail-clearance.mjs` checks fitted root/ground footprints against the authored
trail bed across desktop/phone layouts, day/night, four weather states, and three parallax
positions. Trees, shrubs, stumps, large stones, and rooted plants must leave the
path clear. Loose branches, leaf litter, and the trail's embedded stones remain
allowed. Canopies may overhang the trail without placing roots in its bed.
The same check samples the complete seating-bench bounds against the trail and
checks that stump bounds do not overlap either bench. The tent bypass retains
the existing campsite seating and the trail's clipped material/detail layers.
Bench bounds must also clear the tent and fire ring. The serving tray stays outside
the rim, and both halves of the ring remain fixed during parallax changes.
`firepit-layout.mjs` checks that the front rim paints before the serving tray.

`ground-material-detail.mjs` compares actual reused trail, needle-mat, and gravel
pixels at simple/rich detail levels and with wet, snow, and drought accents.
It captures the full scene at desktop/phone widths across four weather states.
Material-order and named-region contracts live in `terrain-detail-layers.mjs`.
The rendered-detail matrix also covers the fire-ring stone's facets, chipped
ledges, wet surfaces, and snow deposits.

`mountain-variation.mjs` checks three summit families in every mountain row,
opaque bounded rock bodies, unique region targets, and unchanged placement counts.
Rendered instance comparisons cover detail tiers, rain, snow, and drought.
Native pixel comparisons also verify fixed direct illumination for each summit
family. Material values and geometry must return exactly to clear-state values.
Desktop/phone day/night captures also check responsive row counts,
reduced motion, overflow, and browser exceptions.

`ground-material-detail.mjs` also covers the reusable Bigfoot track, including five
toe impressions, the entire track fitting within the trail before clipping,
detail tiers, and wet/snow/drought pixel changes.

| Code | Behavioral coverage |
| --- | --- |
| `assets/appearance-controller.js` | `appearance-controller.mjs` checks restored and invalid preferences, preview precedence, persistence failure, metadata, atomic notifications, system changes, toggles, reset, and cross-tab events. `theme-smoke.mjs` verifies integration with actual theme data and CSS. |
| `assets/appearance-picker.js` | `picker-and-shortcuts.mjs` checks keyboard radio selection, inside/outside interaction, repeated opening, close controls, focus restoration, and overlay exclusivity. `interaction-contract.mjs` and `theme-smoke.mjs` cover synchronization and accessibility metadata. |
| `assets/ui-overlay.js` | `overlay-state.mjs` checks independent sources, duplicate operations, aggregate notifications, and DOM state at notification time. Browser suites verify actual dialogs. |
| `assets/command-palette.js` | `command-behavior.mjs`, `command-data-contract.mjs`, `command-failures.mjs`, `picker-and-shortcuts.mjs`, and `interaction-contract.mjs` cover search, scopes, selection, history, data escaping, optional commands, contextual actions, local navigation, browser actions, focus, modifier/editing guards, clipboard denial, and share cancellation. |
| `assets/case-study.js` | `case-navigation.mjs` controls geometry and frames to check reading-line boundaries, coalesced scrolling, resize, deep links, rapid hashes, cancelled alignment, resize/hash interleavings, native SVG link attributes, and empty/single-section documents. Browser command tests verify integration. |
| `assets/work-filters.js` | `work-filters.mjs`, `work-update-boundaries.mjs`, and `work-data-validation.mjs` cover combined filters, sort orders and ties, URL restoration/reset, cache expiry, malformed cache/API data, stale refresh, storage/API failure, accessibility of dates, and no-JavaScript content. |
| `assets/trail-glyphs.js` | `glyph-enhancement.mjs` verifies label/category mapping, chapter precedence, decorative semantics, preservation of existing content, and direction markers. `glyph-colors.mjs` checks both artwork color groups and every non-404 placement across palettes, day/night modes, hover, focus, and filled surfaces. Existing placement, hover, and layout suites verify actual pages and animation phases. |
| `assets/page-transitions.js` | `page-transition-contract.mjs` checks route and history direction, reduced-motion gates, fragments, and native fallbacks. `page-transitions.mjs` pauses explicit browser snapshots to check the three-layer snapshot budget, absence of width/height animation, timing, single entrances, and responsive motion. Native links, Back, fragments, and reduced motion are checked separately because browsers may decline cross-document snapshots. |
| `assets/hobby-motion.js` | `hobby-motion-contract.mjs` checks independent visibility for home illustrations, batched observer entries, overlay and motion gates, and redundant notifications without restarting SVG timelines. `non404-motion.mjs` verifies actual CSS and SVG pause integration. `hobby-sequence.mjs` checks the CSS effect budget, day/night choreography, responsive proportions, tap and basket alignment, loop reset, and reduced motion with and without JavaScript. |
| `assets/loading-state.js` | `loading-state-contract.mjs` checks loading/complete startup, two-frame reveal, fallback without load, late load, and idempotence with controlled timers and frames. |
| `scripts/build-site.mjs` and generated data | `build-site-contract.mjs` and `build-and-lint-validation.mjs` check validation, generated data/wiring, check-mode preservation, idempotence, reader preservation, and cleanup after an injected filesystem failure. |
| `scripts/lint.mjs` | `build-and-lint-validation.mjs` checks successful lint and rejection of syntax errors, malformed JSON, and stale output, plus dependency/Git exclusions. |
| `tests/check-site.mjs` | `check-site-contract.mjs` and `site-checker-validation.mjs` check HTML structure, metadata, fragments, local assets, declarative JSON, CSS references, comments, and social-image dimensions. |

`non404-motion.mjs` also checks complete graphics under both reduced-motion settings, native chapter activation, stable hover text dimensions, hero overflow, and restrained introduction phases. System reduced-motion checks include pages with JavaScript disabled.

`detail-row-layout.mjs` checks every Field Notes, Toolbox, and Work row at five viewport widths and five fixed hover phases for accent clearance, contained arrows, stable text, and responsive label/description alignment.

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

CI keeps the required check named `lint`, records Node/Chrome versions, and saves
JUnit results as a 14-day artifact even when tests fail. New commits cancel older
runs for the same PR; main and manual validation runs retain their results. A
15-minute job limit bounds setup and process hangs in addition to the per-test
60-second deadline. The suite still runs without retries.

`project-evidence-layout.mjs` checks selected-work text clearance from dividers
and cell boundaries at six widths, including fixed hover and focus phases.

[Woodpecker](../.woodpecker/portfolio.yml) runs every `tests/*.mjs` file with
one browser worker in its two-CPU isolated Linux job. The full glob includes new
test files automatically. Tests retain their 60-second deadlines and assertions;
there are no automatic test retries or live third-party fixtures. Chromium and
Node versions are logged.

GitHub’s stable `lint` gate runs the status-handoff boundary tests and requires
the exact source’s trusted native status. It accepts success only for this
repository’s correct event context and pipeline; failures fail immediately and
pending/missing statuses have a bounded deadline. Pages waits for that complete
successful main workflow and rechecks that the validated revision is current.

For a local subset, Node still supports `--test-shard=1/3` (replace `1` with `2`
or `3`). This is a diagnostic option; the native CI gate always runs the full glob.

Owned test browsers use Chromium's [explicit testing switch](https://chromium.googlesource.com/chromium/src/+/refs/tags/156.0.8078.79/chrome/common/chrome_switches.h)
to disable Crashpad initialization, preventing detached crash-helper processes
from outliving their fixture. These browser tests do not collect or qualify
Crashpad dump symbolization. Browser stderr, CDP exceptions, assertions and
process exit checks still fail normally; native resource diagnostics remain
available.
