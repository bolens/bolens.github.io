# Implementation plan

The generator owns shared page chrome and will add one deferred reference to `assets/web-analytics.js` immediately before each closing body tag. The small loader checks the production hostname, HTTP(S) protocol, browser privacy preferences, and an existing beacon element before appending Cloudflare's official module script with the public site identifier.

No framework, package, cookie, persistent client state, or backend is added. The optional network request is independent of the site's existing controllers. No CSP is present or weakened. The existing allowlisted `assets/` publication path covers the new loader.

The constitution is satisfied by owner-authorized collection, one generator source for shared markup, opt-outs and failure resilience, isolated tests, and reviewed deployment through the existing CI gates.

Validation: deterministic loader tests cover production/preview/opt-out/duplicate cases. Existing generated-content and browser gates verify unaffected routes and fallbacks. Review the complete public artifact for credentials. Verify exact merged SHA deployment and the public beacon in the browser.
