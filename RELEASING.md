# Site delivery playbook

[Documentation](docs/README.md)

This repository continuously deploys the portfolio to
<https://bolens.github.io/> from `main`. It has no package version or release
tags. `.github/workflows/deploy-pages.yml` owns GitHub Pages publication.

## Prepare and validate

Branch from current `origin/main` in a clean worktree. Review public claims,
links, accessibility, and privacy. Edit generated content through
`data/projects.json`, `data/themes.json`, or `scripts/build-site.mjs`, then run
`node scripts/build-site.mjs` when those sources change.

Run the complete gate used by Woodpecker `portfolio` and GitHub Lint:

```sh
node scripts/lint.mjs
node --test --test-concurrency=2 --test-timeout=60000 tests/*.mjs
```

Tests require Node.js 24 and Chrome or Chromium. Follow `tests/README.md` for
isolated browser checks. Preview intentional visual changes at desktop and
narrow widths. Inspect the staged diff for private data and generated noise.

## Push and merge

Follow the [fleet push and merge steps](https://github.com/bolens/.github/blob/main/RELEASING.md#push-and-merge).
Commit focused changes and confirm `origin` points to `bolens/bolens.github.io`.
Push only the feature branch:

```sh
git push --set-upstream origin HEAD
```

Open a PR against `main`. Review the full diff, require all applicable GitHub and Woodpecker checks
on the current head, resolve conversations, and squash-merge. Never push
directly to `main`, force-push, skip failing hooks, or bypass protection.
Verify checks on the merged SHA and delete the merged branch.

## Deploy and verify

Merging to `main` runs `Lint`, including generated-content validation and the
full test suite. Only a successful main-branch push or manual `Lint` run triggers
`Deploy GitHub Pages`. PR runs cannot publish. Deployment checks out the exact
validated revision, skips superseded revisions, and rechecks main after any
`github-pages` environment approval. Validation runs once per main revision.

The Pages artifact contains only root HTML, `.nojekyll`, crawler metadata,
`.well-known/security.txt`, `assets/`, `about/`, `work/`, and `case-studies/`.
Hidden-file upload is enabled only for this staged allowlist. Tests, source data, scripts,
and repository instructions are excluded. Add any new public top-level path to
the staging list in `.github/workflows/deploy-pages.yml`.

For a manual redeploy, run `Lint` on `main` from Actions (or
`gh workflow run lint.yml --ref main`). This follows the same complete gate;
there is no validation bypass. A merge must be authorized with automatic
deployment in mind.

Wait for both `Lint` and `Deploy GitHub Pages` on the merged SHA. Verify the
deployment URL, home page, an affected route, navigation, and 404 handling in
a signed-out session. Confirm intended content is live and retain the commit
SHA and workflow links as delivery evidence.

## Recover

For a transient service failure, retry the workflow for the verified source.
For a source defect, submit a corrective or revert PR, rerun checks, and verify
the replacement deployment. Do not force-push history or edit deployed files
outside the workflow. If private data was published, remove it and address
retained artifacts or credentials as applicable.

Fleet policy: <https://github.com/bolens/.github/blob/main/RELEASING.md>.

## Source lint

The Source lint workflow checks maintained javascript, css files selected by
[`.github/source-lint.json`](.github/source-lint.json) on every pull request
and push to `main`. Existing native checks remain part of the merge gate.
Use the [shared local reproduction instructions](https://github.com/bolens/.github/blob/7603518f305fb76f7bb1b9979f2692521f633b82/docs/source-lint.md)
with the same tooling revision pinned in
[the workflow](.github/workflows/source-lint.yml). Review exclusions when adding
source files; generated and imported files retain their native validation.
Require the new check to pass on the current PR head before merging.

## Cloudflare caching

Cloudflare proxies the public website and caches eligible responses while respecting the origin's cache-control and browser lifetime. Hostname-scoped rules exclude cookie/authorization requests and avoid storing error responses. Dynamic homelab applications are outside these rules.

After a successful Pages deployment, the same deployment job purges only `michael.bolens.dev`. Hostname purging also clears query variants and deleted routes. PR validation, skipped/failed deployments and superseded portfolio revisions cannot purge. The purge uses no custom cache key and never requests a zone-wide purge.

The `github-pages` environment supplies `CLOUDFLARE_CACHE_PURGE_TOKEN` as a secret and `CLOUDFLARE_ZONE_ID` as a variable. Each site's token has only Cache Purge permission for its own zone. Cloudflare scopes this permission by zone rather than hostname, so the workflow's fixed hostname payload is the narrower operational boundary. Credentials expire November 4, 2027, Denver time. Renew with the same scope before expiry and replace the environment secret. Keep credentials out of Git and public artifacts.

A missing credential, invalid zone ID, HTTP failure or unsuccessful API response fails the workflow after deployment. The site may already be deployed when purging fails. Inspect the failure, repair the credential/configuration and retry the failed deployment job through Actions. Requests have bounded timeouts/retries. Purging Cloudflare does not clear visitors' browser caches or the GitHub Pages origin CDN, which currently advertises a 10-minute lifetime.

For rollback, disable the site's new cache rules and restore its recorded DNS proxy flags. Preserve the GitHub Pages custom domain, HTTPS origin certificate and mail records. DNS/rule baselines and live verification receipts are stored privately outside this repository.
