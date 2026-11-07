# Native portfolio validation handoff

Move the existing lint and full browser-test workload to Woodpecker while keeping
GitHub Pages publication and its protected credentials separate. The native job
runs every `tests/*.mjs` file with one worker and a 60-second per-test deadline;
it does not retry failures or omit browser suites. The native runner allocates
two CPUs and 6 GiB RAM without swap per workflow, so browser work is serialized
within that allocation. It also runs the native-status handoff boundary tests.
It uses isolated profiles,
loopback servers, and existing fixture-controlled external responses.

The GitHub `lint` gate verifies the latest native status for the exact PR head
or main push. It binds repository, revision, event context, publisher, pipeline
URL, and the latest combined/history status ID; it never reuses an older success
after a newer pending result. Missing/pending statuses wait within a bounded
deadline and failure/error statuses fail immediately. A manual GitHub run must
select main and uses that revision’s genuine push result.
Publication must still refuse failed, fork, PR, and superseded revisions, recheck
main after environment approval, and preserve the existing public artifact
allowlist and hostname-only Cloudflare purge.

The native validation job receives no deployment credential and has no host
mounts, privileged mode, or Docker socket. Debian package resolution supplies
Chromium and its version is logged. README owns image update cadence; RELEASING
owns PR and deployment policy. Restore validation through a reviewed source PR
if the handoff fails; there is no product tag or runtime data migration.

Local full-suite and actual container-run results are separate evidence. A new
workflow file alone does not prove native coverage or justify retiring a gate.

## Resource reproduction and acceptance

Use explicit runtime limits when reproducing the native allocation:

```sh
docker run --cpus=2 --memory=6g --memory-swap=6g ...
```

The equal memory and memory-plus-swap limits disable swap. Docker's default swap
allowance applies when only `--memory` is set, so record both options in proof.
The earlier 4 GiB native allocation reached its exact memory cap during both
renderer stalls; the passing focused comparison used about 338 MiB of swap.
Those results described different resource budgets. They do not establish a
foreground, animation or functional application defect.

The combined candidate retains all 472 existing Node assertions, the strict
handoff boundary tests and the unchanged Pages publication workflow. Require a
complete exact-head native run under the corrected budget and an isolated build,
post-create smoke and gate check of the refreshed editor image before delivery.
The operator must confirm the persistent agent limits before publishing this
candidate; a source-only change does not apply those limits.
