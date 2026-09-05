# Verify daytime activities
Use Node 24 and isolated Chromium from the repository root.
Run node scripts/lint.mjs, then:
```sh
node --test --test-concurrency=2 --test-timeout=60000 tests/daytime-camp-activities.mjs tests/daytime-saucer-route.mjs tests/daytime-cryptid-poses.mjs tests/scene-habitat-placement.mjs tests/route-continuity.mjs tests/asset-region-contract.mjs
```
Inspect daytime desktop/phone captures and fixed saucer phases, then run the full
README test command. No personal browser or live third-party responses.
