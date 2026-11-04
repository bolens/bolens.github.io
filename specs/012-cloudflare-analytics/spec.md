# Cloudflare Web Analytics

Requested November 4, 2026. Baseline: `2fd16b441aeb9f8ad96bc1676cb5c2bf0f814101`.

The owner wants aggregate traffic and performance analytics on michael.bolens.dev. Use the registered Cloudflare Web Analytics site without changing DNS, hosting, routes, or application state.

## Acceptance criteria

- AC1: Every public portfolio HTML page, including the error page, includes one shared analytics loader maintained through the generator.
- AC2: The loader loads the official Cloudflare module beacon once on michael.bolens.dev and bolens.github.io. It sends nothing from localhost, preview hosts, or non-HTTP(S) documents.
- AC3: Global Privacy Control and Do Not Track opt-outs prevent beacon loading. Analytics uses no application identifiers, cookies, local storage, form values, or custom events supplied by this site.
- AC4: Blocking the optional external script leaves navigation, appearance, loading state, and error-page behavior functional.
- AC5: No Cloudflare API credential enters source or the Pages artifact. The beacon identifier is public configuration.
- AC6: Automated checks use controlled responses; production verification proves that the deployed loader and vendor beacon load. Dashboard ingestion may lag deployment and must be reported honestly.

No account/tunnel/Access changes or general redesign are part of this feature.
