# Public portfolio caching

Requested November 4, 2026, before implementation. Base: `47793e7c4a946ff97b66ba8c9f7ea0279ebfab67`.

## Acceptance criteria

- AC1 Cloudflare proxies and caches only the public portfolio hostname. Dynamic homelab hostnames and their rules remain unchanged.
- AC2 Cache eligibility respects origin cache-control and browser TTL. Cookies, authorization and error responses are not forced into shared cache. No query-string normalization or custom cache key is introduced.
- AC3 A successful, validated main deployment purges only `michael.bolens.dev`, including old and query-string variants. Failed, skipped, superseded or PR deployments cannot purge.
- AC4 The purge credential has only Cache Purge permission for the containing zone, is stored as a GitHub Pages environment secret, never enters source/artifacts/logs, and has a documented renewal date.
- AC5 Missing credentials, HTTP errors and unsuccessful API responses fail the deployment workflow visibly. Retries and runtime are bounded.
- AC6 HTTPS content, navigation, custom 404 and security.txt remain correct. Observe a cache HIT and verify purging invalidates it. Record successful CI and exact deployment revision separately from local checks.

Privacy Path has its own repository and an equivalent hostname-scoped deployment contract. No paid product is required.
