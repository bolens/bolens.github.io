# Implementation plan

Keep the existing GitHub Pages origin and exact validated main-revision gates. Add a post-deployment purge step with a static zone URL and hostname-only payload. Use curl with an authorization header supplied over stdin, a temporary response file, bounded retries/timeouts, and jq success validation. No external action or script dependency is added.

Create separate zone-scoped Cache Purge tokens for each site's github-pages environment. Cloudflare cannot scope this permission to a hostname; the committed payload enforces the narrower deployment target. Preserve all existing environment branch restrictions. Expire credentials November 4, 2027 Denver time.

Configure hostname-specific cache eligibility and respect origin edge/browser TTL. Bypass cookie/authorization requests and error responses. Save DNS/rule baseline privately. Enable proxy only on the intended website DNS records and preserve mail records. Verify edge TLS, origin bytes, cache hits, purge invalidation, redirects and error routes. Roll back by disabling the new rule and restoring only the recorded proxy flags if verification fails.

Constitution: no public-content changes or generated edits, isolated tests, credential exclusion and reviewed exact-SHA deployment are preserved. Only workflow and delivery documentation are owned by this task. Cloudflare configuration and credentials remain outside Git.
