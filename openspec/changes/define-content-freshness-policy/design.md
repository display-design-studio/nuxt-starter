# Design

## Context

See `proposal.md` for motivation and `specs/content-freshness/spec.md` for the behavior contract.

The change is partially implemented. Home/page handlers now derive live published clients and disable stega per fetch; their validation, response shapes, and no-store errors remain intact. The sitemap source has the same attempted derivation, but passing its Nuxt `RequestEvent` into the installed Sanity helper causes TS2769 because that helper expects legacy `H3Event`. No type cast or compatibility fix has been applied yet.

The implementation still has daily page ISR, 24-hour durable JSON caching plus one-hour SWR, raw `_id`/`_type` tags, and a webhook that purges both. `useCacheTag` overwrites earlier registrations. During SSR, Nuxt dispatches relative API fetches in-process; client navigation can use the independently cached JSON response, so both response classes need the same dependencies.

Preview selection and credentials remain owned by the existing composables/module and preview-cache middleware. The sitemap module separately uses `cacheMaxAgeSeconds: 86400` and has no document-webhook dependency tags. Its XML/index routes must not accidentally inherit the new year-long page rule.

The installed Netlify Nitro preset maps `isr: true` to `max-age=31536000, must-revalidate, durable`, not infinite retention. Normal deployments invalidate their cache objects. The template contains only home/page placeholder queries, not an actual article/blog schema; the article example will be represented through synthetic dependency fixtures and the extension recipe, not new production content types.

## Goals / Non-Goals

**Goals:**
- Replace daily content refresh with webhook-driven long-lived retention while keeping browser revalidation and live-origin regeneration.
- Make document and query-collection dependencies explicit, additive, and identical for HTML/JSON.
- Preserve anonymous public reads, preview isolation, payload compatibility, and safe error handling.
- Keep the sitemap on its separate periodic policy and provide recovery instructions for missed webhooks.

**Non-Goals:**
- Literally eternal CDN storage, surviving deploys without invalidation, or atomic publication across every edge/open browser.
- A real blog implementation, a new CMS schema, automatic GROQ dependency inference, or a database-backed dependency graph.
- New packages, credentials, storage layers, queue infrastructure, a generic CMS framework, or an application manual-purge endpoint.
- Changing preview activation/credentials, document result envelopes, or Sanity SDK retry/timeout defaults.
- Immediate sitemap invalidation or equivalent caching guarantees for Node/Docker/static generation.

## Decisions

### 1. Derive a live published client locally in each server handler

Keep non-mutating `.client.withConfig({ useCdn: false, perspective: 'published' })` and per-fetch `stega: false`. Home/page can pass their compatible request event to `useSanity(event)`. For the sitemap source, use the original no-argument `useSanity()` initialization before deriving the live client: its installed handler has a different event type, and this avoids an unsafe cast or changes to shared configuration. The module-wide `useCdn: true` default and preview path remain unchanged.

Retain existing query parameters and result shapes. Use shared dependency selectors against selected document IDs; when extending a query to render reference values, include those reference IDs in its projection. Do not fetch full documents merely to discover dependencies or read preview credentials in a public handler.

**Alternatives considered:**
- Globally disable `useCdn`: smaller diff, but unnecessarily changes module-managed reads and broadens preview/regression scope.
- Introduce an additional named client: explicit but duplicates configuration and expands the module's public configuration surface.
- Casting the sitemap event to legacy H3: masks a real integration mismatch; retain the helper's supported no-argument form instead.
- Add a fixed delay before webhook purge: does not prove CDN propagation and adds webhook latency without a freshness guarantee.

### 2. Use long-lived on-demand retention for successful content only

Change content page ISR from `86400` to `true`. Match JSON cache policy to the installed preset with `public, durable, max-age=31536000, must-revalidate`; remove the old one-hour JSON SWR setting. Keep browser `Cache-Control: public, max-age=0, must-revalidate`, API ISR opt-out, and no-store for validation/missing/upstream failures and preview infrastructure. Avoid another Nitro/runtime cache.

Keep a single shared public-content retention value for the JSON header builder and tests. Verify the effective Netlify preset output as well as configuration: boolean ISR is a bounded one-year policy, not a guarantee that the provider retains an object forever. Keep ordinary deploy invalidation; do not introduce `Netlify-Cache-ID` persistence across code changes.

```text
Public page miss --> SSR --> internal handler --> live published Sanity API
Client JSON miss --> JSON handler -------------> live published Sanity API
Sanity publication --> dependency tag purge ---> independent HTML + JSON caches
Preview -------> existing module preview path -> draft-aware reads, no-store
Sitemap refresh --> URL source ---------------> live published Sanity API
```

Only a miss, relevant purge, provider expiry/eviction, normal deploy, or authorized recovery requires a new origin read. The application has no daily content refresh. Browser revalidation is deliberately not removed: a remotely invalidated CDN cannot clear a visitor's independently fresh browser cache or an already open Nuxt payload.

**Alternative considered:** retain a short TTL as a daily recovery mechanism. It contradicts the revised requirement; failures must instead be visible and operationally recoverable. Permanent browser caching or an additional persistent content cache would weaken invalidation correctness and is not introduced.

### 3. Separate document tags from collection tags

Use two deterministic namespaces: `doc:<published-document-id>` and `collection:<document-type>`. A detail response carries its main document ID and IDs of rendered references, not its `_type` as a blanket dependency. Its `_type` can remain in the returned data without becoming an invalidation tag.

Put small pure dependency selectors alongside shared query utilities. A selector describes document dependencies and any collection types the query depends on, and is reused by the endpoint and page. A listing includes each rendered item's ID and a static collection dependency even when it is empty. Referenced types that control a collection predicate/order must be declared as collection dependencies too. Do not infer this contract by recursively traversing arbitrary CMS data.

For the article fixture:

| Cached response pair | Tags |
| --- | --- |
| Article A HTML/JSON | `doc:A` |
| Article B HTML/JSON | `doc:B` |
| Blog home HTML/JSON | `doc:home`, `doc:A`, `doc:B`, `collection:article` |

A classified content-only publication of A purges `doc:A`: A and the home regenerate, B does not. First publication/removal or a membership/order change additionally purges the relevant collection dependency; this reaches a cached listing that could not yet contain the new article's ID. Collection invalidation can conservatively cover several listings of that declared type, but never unrelated detail pages.

**Alternatives considered:** purging `_type` on every detail response reproduces the current over-invalidation; ID-only tags miss new listing members; storing a reverse dependency graph adds persistence and synchronization that the CDN's tag index already provides.

### 4. Make dependency registration additive and safe

Update page tag registration to union existing response tags with each new registration and deduplicate them, using only the current request/header state. No process-global accumulator is allowed. Use the same normalization and namespace rules on the API side. Layout/page/footer registration order must not change the final union.

Enforce Netlify's 500-tag count and per-tag size limits without truncating dependencies. If the complete set is unsafe or too large, disable browser/CDN caching for the response and retain that no-store decision for the rest of the request. Preview/error no-store decisions must also win over later public-cache helpers. Never cache a partially tagged result.

**Alternative considered:** documenting a single-call-only convention is insufficient for independently composed layouts and components; silently dropping excess tags leaves unreachable stale entries.

### 5. Classify collection changes in the signed webhook body

Keep `_id`/`_type` and extend the payload with optional `operation` (`create`, `update`, or `delete`) and boolean `collectionChanged`. Verify raw-body HMAC and the existing signature age before trusting metadata. Strictly validate supplied fields, lengths, document IDs, and types; do not accept arbitrary raw cache tags or a whole-site purge instruction.

Derive invalidation deterministically:
- Published document: always target its `doc:` tag.
- `operation: update` with `collectionChanged: false`: document-only invalidation.
- Create/delete, true classification, or absent classification: also target `collection:<_type>`. Create/delete cannot opt out with a false flag.
- Draft/version namespaces: acknowledge without purging published dependencies after authentication. Configure the provider to exclude these events as the primary filter.

Use Sanity's documented `delta::operation()`, before/after values, and delta selectors in the webhook projection to classify changes to all fields used by declared collection predicates/order. Build the documented recipe from the project's actual queries. For a future blog, the relevant field set must match its chosen categories/order/slug rules; the template must not invent an article schema. Synthetic tests supply explicit content-only and membership-changing classifications.

Metadata belongs in the signed body, not only unsigned request headers. Existing `{ _id, _type }` integrations remain safe through conservative collection-only invalidation; this compatibility mode is explicitly less selective for listings. Validate the enhanced projection before claiming precise content-only behavior in a deployment. An edit to a displayed field also used in a filter/sort is a collection change, not a content-only edit.

**Alternatives considered:** requiring a new payload breaks current webhook configuration; trusting an unsigned operation header weakens classification integrity; treating absent metadata as document-only can permanently miss new members. Conservative compatibility plus a documented precise projection avoids those failures.

### 6. Surface purge failures and document recovery

Audit the existing Netlify SDK result/error handling and ensure failed or rate-limited purges produce a retryable non-2xx response, not 202. Keep duplicate handling idempotent through repeatable tag purges; do not add durable deduplication or a queue. Do not acknowledge before the required purge finishes.

Document Sanity's finite retry policy and attempts/message logs, safe correlation information, and a provider-authenticated tag-scoped recovery procedure for an authorized operator. Recovery must use a valid current signature or the provider's authenticated purge controls, not replay a stale signature, expose a secret in a URL, disable authentication, or add a new application endpoint. No normal daily expiry is relied upon to heal missed delivery.

**Alternative considered:** a new queue/reconciliation service or manual purge endpoint would add infrastructure beyond this starter's confirmed scope. The bounded provider retries plus an explicit operator runbook do not imply guaranteed delivery; prolonged missed invalidations remain a documented trade-off.

### 7. Keep sitemap refresh periodic and isolate its route rules

Retain `sitemap.cacheMaxAgeSeconds: 86400` and the absence of document tags on the sitemap source/output. Override the long-lived page rule for the module's resolved XML/index/named-locale routes with a finite 86400-second ISR policy. Derive the covered paths from the module's configured sitemap names/path prefix, including generated locale variants, rather than assuming `/sitemap.xml` is the only endpoint. Verify the effective route table with the default locale and a synthetic multi-locale configuration. Do not change application locale activation.

Explain that the URL source reads live published routes whenever executed, but does not execute on every sitemap request. A fresh sitemap cache can retain its current routes after a publish, removal, or slug change. Refresh is request-driven and can involve module SWR and downstream caching. The configured 24-hour interval is not a strict end-to-end freshness bound, and search-engine indexing is outside application control.

**Alternative considered:** immediate sitemap invalidation. That would require coordinating module/runtime and CDN caches; purging a Netlify tag alone would not establish the desired guarantee. It is explicitly deferred rather than partially implemented.

### 8. Make the revised contract visible in existing documentation

Update README diagrams/tables, the new-document-type recipe, endpoint comments, and `AGENTS.md` to show long-lived content retention, document/collection namespaces, cumulative registration, shared HTML/JSON selectors, signed projection setup, legacy fallback, and recovery. Distinguish the unchanged module default from live public origins. Keep the sitemap's separate policy and the safe non-production verification checklist.

Remove claims that ordinary document caches self-heal every 24 hours or that every update purges all detail pages of a type. Explicitly document provider expiry/eviction/deploys, already cached or in-flight responses, the lack of atomic global visibility, and the importance of detecting missed webhooks.

### 9. Verify dependency behavior and adapter compatibility

Retain valid live-origin, anonymous-read, error, signature, and global/mock-restoration tests. Replace the old daily TTL/raw ID-type assertions. Unit tests must cover tag namespaces, cumulative request isolation, duplicate/overflow handling, paired HTML/JSON selectors, classified and legacy webhook events, defensive draft skipping, and purge failures. All network-facing calls remain stubbed.

Use a small in-memory test-only cache index keyed by emitted dependency tags to demonstrate A/home invalidation with B retained, first publication into an empty listing, filtering/order changes, reference edits, and unpublish/slug changes. This is a test fixture, not a new production cache. Inspect the installed Netlify preset's effective headers and the generated route rules; tests stubbing the sitemap handler as an H3 handler are not sufficient evidence of real Nuxt event compatibility. Typecheck must pass without an event cast.

Require separately authorized non-production evidence for actual CDN HTML/JSON invalidation, retained unrelated detail hits, draft isolation, enhanced webhook classification, and retry/recovery behavior. No real blog feature, publication, deploy, or purge is authorized by this planning revision. Do not wait a year in CI: verify policy output and use synthetic cache fixtures for retention scenarios. Record operational checks as unverified when no authorized environment is available.

## Risks / Trade-offs

- [Missed webhook can leave content stale much longer] -> Expose retryable purge errors, document finite retries/logs and authorized scoped recovery; do not imply a daily recovery bound.
- [Incomplete query dependencies cause stale related pages] -> Require shared selectors and explicit reference/collection projections; test negative membership and empty-list cases rather than inferring from rendered IDs alone.
- [Incorrect collection classification misses membership changes] -> Align signed delta selectors with query predicates/sorts; missing metadata defaults to conservative collection invalidation and precise behavior is gated on configuration verification.
- [Long retention is mistaken for eternal storage] -> Verify the one-year preset output and document expiry, eviction, normal deploy invalidation, and lack of cross-deploy persistence.
- [Catch-all page ISR captures sitemap routes] -> Add finite overrides for the resolved sitemap route set and verify default/multi-locale output.
- [More live API work on a miss] -> Retain durable CDN caching, measure miss latency and failures, and avoid redundant caches.
- [Shared-client mutation could affect later requests or preview] -> Use `withConfig` only; assert the base client stays unchanged and confirm preview behavior on an isolated deployment.
- [A token could accidentally enter public reads] -> Do not read visual-editing credentials; verify the derived public configuration stays anonymous and published.
- [Purge latency and pre-existing in-flight generations remain] -> Scope the promise to live-origin selection for new reads, not global atomic publication; document these residual races.
- [Sitemap URLs can lag published pages] -> Preserve the explicitly accepted periodic contract and distinguish per-layer intervals from an end-to-end deadline.
- [Mock-based tests cannot establish Netlify adapter behavior] -> Require deployment evidence before treating CDN invalidation/preview acceptance as verified.
- [Legacy sitemap event mismatch is hidden by test stubs] -> Retain the helper's supported no-argument initialization and run real Nuxt typecheck/build in addition to Bun handler tests.

## Migration Plan

1. Reconcile the existing partial implementation with the revised tasks. Keep valid origin/error work, resolve the sitemap typing issue, and replace obsolete TTL/tag expectations before enabling the new policy.
2. Implement/test shared dependency semantics and the backwards-compatible webhook parser/resolver, then update the documented signed projection and query extension recipe. Make tests fail if collection metadata is missing in a case claiming precise collection selection.
3. Verify the effective content/sitemap route policies, no-store dominance, one-year preset headers, and all local checks with synthetic configuration and no production credentials.
4. In a separately authorized non-production environment, deploy through the normal process, configure/verify the enhanced projection, and run the A/B/home, new-member, unpublish, draft, and failure/recovery checklist. Legacy deliveries remain safe but must not be presented as the precise classification mode.
5. Roll out the matched application/projection configuration via normal deployment; ordinary deploy invalidation removes prior raw-tagged cache objects. Do not preserve old entries across code changes. Monitor webhook attempts and origin/cache behavior.
6. Roll back by redeploying the previous application/projection configuration through the normal process; no data rollback is required. A rollback reintroduces that version's retention/granularity trade-offs, so verify scoped invalidation and clear affected provider tags through authorized controls if necessary.

## References

- Versioned module server helper: https://github.com/nuxt-modules/sanity/blob/v2.5.0/src/runtime/server/utils/index.ts
- Sanity API versus API CDN guidance: https://www.sanity.io/docs/content-lake/api-cdn
- Nuxt internal server fetching: https://nuxt.com/docs/4.x/api/utils/dollarfetch
- Sitemap cache behavior: https://nuxtseo.com/docs/sitemap/advanced/performance
- Netlify cache variation, purge, and propagation: https://docs.netlify.com/build/caching/caching-overview/
- Sanity webhook triggers, signed payloads, delivery limits, and retry policy: https://www.sanity.io/docs/content-lake/groq-powered-webhooks
- Sanity delta projections: https://www.sanity.io/docs/developer-guides/projections-in-groq-powered-webhooks
- Installed adapter evidence: `node_modules/nitropack/dist/presets/netlify/runtime/netlify.mjs`, `getCacheHeaders` maps boolean ISR to one-year durable retention.
