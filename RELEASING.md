# Site delivery playbook

This repository continuously deploys the portfolio to
<https://bolens.github.io/> from `main`. It has no package version or release
tags. `.github/workflows/deploy-pages.yml` owns GitHub Pages publication.

## Prepare and validate

Branch from current `origin/main` in a clean worktree. Review public claims,
links, accessibility, and privacy. Edit generated content through
`data/projects.json`, `data/themes.json`, or `scripts/build-site.mjs`, then run
`node scripts/build-site.mjs` when those sources change.

Run the same gate as the `lint` job in `.github/workflows/lint.yml`:

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

Open a PR against `main`. Review the full diff, require all applicable checks
on the current head, resolve conversations, and squash-merge. Never push
directly to `main`, force-push, skip failing hooks, or bypass protection.
Verify checks on the merged SHA and delete the merged branch.

## Deploy and verify

Merging to `main` triggers `Deploy GitHub Pages`. It validates generated
content, runs browser smoke tests, uploads the repository as a Pages artifact,
and deploys through the `github-pages` environment. Review repository contents
as public publication input. A merge must be authorized with this automatic
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
