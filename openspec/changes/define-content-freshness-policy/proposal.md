# Proposal

## Why

Published pages should stay cached until publication changes a document they depend on, rather than regenerating every day. Updating article A must invalidate its detail page and a blog home displaying A, while retaining article B's independent cached page; regeneration must also bypass potentially stale Sanity API CDN data.

## What Changes

- Keep anonymous, published, stega-free live API reads for home, page, and sitemap origin execution, without mutating the module-wide client or the preview path.
- Replace daily public-content refresh with on-demand caching: page ISR enabled without a daily interval, matching durable JSON retention, and browser revalidation. The installed Netlify preset maps boolean ISR to one year, so this is long-lived webhook-driven caching, not literally eternal storage; expiry, eviction, deployment, and authorized recovery remain possible regeneration causes.
- Replace blanket document-type invalidation with namespaced document dependencies shared by HTML and JSON. Make page tag registration cumulative, deduplicated, and isolated per request.
- Let query-specific selectors declare rendered document dependencies and collection dependencies. Updating A invalidates all cached responses declaring A, not unrelated detail pages of the same type.
- Cover new publications, removals, slug changes, and changes to collection filtering/ordering. Extend the signed webhook payload with optional operation and collection-change metadata; keep existing `{ _id, _type }` deliveries compatible through conservative collection-only invalidation when metadata is unavailable.
- Ignore draft/version-only changes. Preserve signature validation, no-store errors, and preview isolation; report purge failures as retryable failures rather than successful acknowledgements.
- Keep the sitemap's separate 24-hour, request-driven policy, explicitly excluding its XML/index routes from the new long-lived page rule and from document-webhook invalidation.
- Document webhook failure detection and authorized recovery because the daily TTL backstop is removed. Add synthetic article/home dependency tests and a gated Netlify verification checklist without adding an actual blog feature.

## Capabilities

### New Capabilities

- `content-freshness`: On-demand published-content retention, document/collection dependency invalidation, live-origin regeneration, preview isolation, operational recovery, and the sitemap's separate periodic contract. This remains a new capability because it has not been synced to the main specs.

### Modified Capabilities

None.

## Impact

- Runtime targets: `nuxt.config.ts`, existing public handlers, `server/utils/cdnCache.ts`, `app/composables/useCacheTag.ts`, home/page tag registration, webhook parsing/handling, and small shared dependency selectors.
- Documentation targets: README cache diagrams, extension recipe, webhook projection/filter configuration, failure-recovery checklist, endpoint comments, and `AGENTS.md` cache guidance.
- Tests: retain valid live-origin/error tests; revise old TTL and raw ID/type purge assertions; add dependency, collection, accumulator, adapter-retention, and retry-failure tests.
- External integration: signed webhook fields are extended compatibly; precise collection invalidation requires a projection aligned with each query's filter/sort dependencies. No document schema change or real blog schema/page is introduced.
- Operational trade-off: fewer routine origin reads, but missed invalidations can retain stale data much longer. Provider retention is bounded and regeneration is not globally atomic.
- No new dependencies, credentials, persistent cache store, generic CMS framework, manual purge endpoint, or additional deployment-provider support.
- This revision updates planning artifacts only. The existing partial implementation remains unchanged and must be reconciled by a subsequent explicit apply request.
