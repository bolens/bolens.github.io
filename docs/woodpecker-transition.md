# Native portfolio validation handoff

Move the existing lint and full browser-test workload to Woodpecker while keeping
GitHub Pages publication and its protected credentials separate. The native job
runs every `tests/*.mjs` file with one worker and a 60-second per-test deadline;
it does not retry failures or omit browser suites. The native runner allocates
two CPUs and 6 GiB RAM without swap per workflow, so browser work is serialized
within that allocation. It also runs the native-status handoff boundary tests.
It uses isolated profiles,
loopback servers, and existing fixture-controlled external responses.

## CI organization

Use the [shared purpose phases](https://github.com/bolens/.github/blob/main/docs/woodpecker-transition.md#ci-organization)
with the existing Node and Python entrypoints. The local full-suite command in
RELEASING uses two workers; native CI uses one worker under its fixed allocation,
with the same complete file selection and 60-second per-test deadline.

| Phase | Check group / canonical local command | Native workflow / step | Retained hosted owner / boundary |
| --- | --- | --- | --- |
| `validate` | Source and generated-content checks: `node scripts/lint.mjs` | `portfolio` / `validate` | PR, main push and native manual validation |
| `validate` | Shared source/workflow policy: `bash scripts/ci/check-policy.sh` | `repository` / `source-and-workflow-policy` | Exact shared SourceLint 7603518, checksum-verified actionlint 1.7.12 and offline zizmor 1.29.0. Duplicate hosted equivalents are disabled after verified native cutover |
| `validate` | Managed Spec Kit integrity: `bash scripts/ci/check-spec-kit.sh` (included in repository policy) | Existing policy step | Immutable C161 validator. Automatic PR/main validation is native. Hosted manual validation and scheduled/manual updater stay active |
| `test` | Full browser suite: `node --test --test-concurrency=2 --test-timeout=60000 tests/*.mjs` | `portfolio` / `validate`, with native concurrency set to `1` | Node 24 and Chrome/Chromium; isolated profiles, owned servers and controlled fixtures |
| `test` | Native-status boundaries: `python3 -m unittest discover -s scripts -p 'test_woodpecker_handoff.py' -v` | `portfolio` / `validate` | Hosted `Lint` joins the exact trusted source result |
| `site` | Generated-site freshness: `node scripts/build-site.mjs --check` | Included in the lint invocation | Regenerate only through the source generator when its inputs change |
| `publish` | Existing main redeploy entrypoint: `gh workflow run lint.yml --ref main` | Publication remains hosted | Successful trusted main `Lint` triggers Deploy GitHub Pages; environment approval, revision checks, artifact allowlist and cache purge retain their existing guards |

The `portfolio` alias, required check names and `Lint` to Pages dependency remain
stable. Follow [RELEASING](../RELEASING.md) for publication review and verification.

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

The candidate retains the complete existing Node suite, the strict handoff
boundary tests and the unchanged Pages publication workflow. Require a
complete exact-head native run under the corrected budget and an isolated build,
post-create smoke and gate check of the refreshed editor image before delivery.
The operator must confirm the persistent agent limits before publishing this
candidate; a source-only change does not apply those limits.

The repository group uses the complete configured JavaScript/CSS sets from
`.github/source-lint.json` with the shared selector and locked tooling at
`7603518f305fb76f7bb1b9979f2692521f633b82`. This adds ESLint/Stylelint and workflow
policy alongside the existing syntax, generated-content and browser checks.
Local reproduction requires Git, Node 24, Python 3 with venv support, curl and
ShellCheck. Downloaded tools use a disposable temporary directory; apt setup
belongs only to the CI container. Zizmor retains offline audits at medium
severity and confidence.

Keep hosted Source lint active until exact-head PR and genuine-main native
proof supports retirement. Preserve the `portfolio` alias and existing `Lint`
status handoff; the new repository lane does not replace the browser suite,
Pages artifact staging, environment approval, revision guards or cache purge.
