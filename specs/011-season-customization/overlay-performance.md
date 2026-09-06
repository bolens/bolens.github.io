# Palette overlay performance follow-up

Date: 2026-09-05. Local, uncommitted follow-up to the season controls; no new
dependencies, timers, animation slots, or preference storage.

## Findings and changes

The overlay's ancestor selector invalidated the whole SVG instance tree when
opening or closing. The runtime now pauses only allocated live targets; a
fallback-only inherited property retains the legacy pause without a renderer.
Animation allocation writes only set differences, and playback avoids redundant
play/pause calls. Motion notifications and canvas redraws skip unchanged inputs.
Fire activation, dynamic darkness, weather, and seasonal firefly eligibility still
invalidate the canvas when their rendered result changes.

The initial browser regression failed with 181 unnecessary allocation writes.
The added redraw assertion then failed with two unnecessary canvas paints.
Both pass after the repairs. Smoke assertions inspect actual infinite animation
effects after the owner's scheduled frame, not a play-state property on an
element whose animation has been removed by its budget.

## Local measurements

Chromium 152.0.7977.75, Node 24.20.0, Linux, 1440×900, scale 1, CPU throttle 1,
owned loopback server, no network throttling, fixed fixture clock and en-US locale.
Three navigations per version; glacier palette, explicit clear daytime, finite
animations settled before each action. CDP tracing and Performance metrics cover
the handler plus three frames. Run-zero palette selection also has a CPU profile.

The baseline proxy restores only the original overlay CSS and HEAD versions of
404-renderer, 404-motion, and 404-scene, keeping the current seasonal controls.
Final measurements ran without overlapping this task's test suite. Values are
handler milliseconds, median [minimum–maximum], not interaction-to-paint scores:

| Action | Before | After |
| --- | --- | --- |
| Open | 104.3 [96.2–122.6] | 17.5 [11.5–29.2] |
| Select autumn | 135.0 [109.6–138.9] | 0.6 [0.5–0.6] |
| Select forest palette | 1.8 [1.6–1.9] | 0.9 [0.8–0.9] |
| Close | 95.9 [92.5–143.9] | 9.9 [8.5–12.3] |

Unchanged allocations fell from 181 writes for season and 362 for palette to zero.
An earlier trace narrowed the opening style update from 16,688 elements to 557.
Full scene recoloring remains expensive: final palette style recalculation spans
102.7–224.1 ms after the fix versus 105.6–237.7 ms before. This is not a claim
that all palette painting is fast, nor a field INP/Core Web Vitals measurement.

Local diagnostic artifacts (ephemeral, not shipped):

- `/tmp/picker-perf-probe.mjs` reproduces the proxy and measurements.
- `/tmp/picker-isolated-before.jsonl`, `/tmp/picker-isolated-after.jsonl`.
- `/tmp/picker-baseline-trace.json`, `/tmp/picker-optimized-trace.json`.
- `/tmp/picker-palette-baseline.cpuprofile`, `/tmp/picker-palette-optimized.cpuprofile`.

## Verification and limits

- `node scripts/lint.mjs` and `git diff --check`: passed.
- `node --test tests/scene-atmosphere.mjs tests/scene-motion-profiles.mjs tests/parallax-stability.mjs tests/overlay-state.mjs`:
  44 passed, zero failures. Log: `/tmp/picker-contracts-final.log`.
- `node --test --test-concurrency=1 --test-timeout=60000 tests/picker-performance.mjs tests/browser-smoke.mjs tests/picker-and-shortcuts.mjs`:
  14 passed, zero failures. Log: `/tmp/picker-isolated-final.log`.
- Inspected `/tmp/404-scene-controls-desktop.png` and
  `/tmp/404-scene-controls-mobile.png` from the final browser run. Controls,
  scrolling, and scene composition are unchanged. Keyboard, responsive routes,
  no-script behavior, reduced motion, forced colors, and console/network checks pass.

The final full-suite attempt was stopped after several navigation/parallax
timeouts during heavy unrelated host workload (load average reached 81.79).
It is not a green full-suite result. Earlier intermediate runs also contained
the intentional red redraw test and the subsequently repaired playback assertion.
No timeouts were increased, tests skipped, or unrelated jobs stopped. A clean
full-suite run remains required before delivery. Safari, Firefox, real devices,
and field performance were not measured. Prior seasonal work remains intact.
