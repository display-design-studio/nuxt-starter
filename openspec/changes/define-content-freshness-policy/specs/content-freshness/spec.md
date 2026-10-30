# Spec Delta

## Purpose

Keep published responses cached on demand and invalidate them according to document and collection dependencies. Define live-origin regeneration, provider retention limits, preview isolation, webhook recovery, and the sitemap's separate periodic refresh contract.

## ADDED Requirements

### Requirement: Published origin reads bypass the Sanity API CDN

When the home endpoint, page endpoint, or sitemap URL source performs an origin read, the system SHALL query Sanity's live API using the published perspective. Existing query parameters and response shapes SHALL remain unchanged.

#### Scenario: Home regeneration while the API CDN is stale
- **WHEN** the live API exposes a new home title, the Sanity API CDN still contains the previous title, and a home origin read occurs
- **THEN** the endpoint returns the live API title using the requested supported locale rather than reading the Sanity API CDN

#### Scenario: Page regeneration uses the requested published document
- **WHEN** a page origin read occurs for a valid locale and slug
- **THEN** the endpoint reads that published page from the live API using the same locale and slug and preserves its existing response shape

#### Scenario: Sitemap source regeneration uses live published routes
- **WHEN** the sitemap URL source is executed after published page slugs have changed in the live API
- **THEN** its entries are built from those live published slugs for the active locales, not from the Sanity API CDN

### Requirement: Public reads remain anonymous and free of preview encoding

Public content reads SHALL remain anonymous and SHALL disable stega encoding. Selecting the live origin SHALL NOT grant access to drafts or reuse visual-editing credentials, including when a caller supplies preview-related cookies.

#### Scenario: Published and draft revisions coexist
- **WHEN** a public content endpoint is requested for a document with different published and draft revisions
- **THEN** it returns only the published revision without stega encoding and does not attach a visual-editing token to its upstream read

### Requirement: Published content uses long-lived on-demand retention

Successful published page HTML and backing JSON SHALL use matching long-lived Netlify caching rather than a daily refresh interval. The target retention SHALL be 31536000 seconds, matching the installed preset's boolean ISR behavior, with no additional one-hour stale window. No separate application cache SHALL be introduced.

#### Scenario: Unchanged content is older than one day
- **WHEN** a successful public response is older than 86400 seconds, no dependency has been published, and the provider still retains a fresh entry
- **THEN** the application does not expire or regenerate it merely because a day has elapsed

#### Scenario: HTML and JSON have the same retention policy
- **WHEN** a published page and its backing JSON are generated successfully
- **THEN** their Netlify policy uses the one-year retention target rather than the former daily TTL and one-hour JSON stale window

### Requirement: Provider retention is not represented as eternal storage

The freshness contract SHALL disclose the one-year preset limit, eviction, normal deployment invalidation, authorized recovery, and purge propagation. It SHALL NOT promise physical cache retention forever or globally atomic publication.

#### Scenario: The provider no longer has a reusable entry
- **WHEN** an entry expires at the provider limit, is evicted, or is invalidated by a normal deploy
- **THEN** a subsequent miss can regenerate it from the live published API even without a new content publication

#### Scenario: A webhook acknowledges invalidation
- **WHEN** a valid webhook finishes its purge and returns a successful acknowledgement
- **THEN** that response is not documented as proof that every edge, existing browser state, and in-flight request already reflects the new revision

### Requirement: Browsers revalidate public content

Published page and JSON responses SHALL retain browser revalidation rather than long-lived browser freshness. Shared-cache invalidation SHALL NOT depend on remotely clearing a visitor's browser cache.

#### Scenario: A visitor requests a page after publication
- **WHEN** a visitor makes a new request after a dependency was published
- **THEN** browser cache policy requires revalidation rather than allowing an unvalidated year-old local response

### Requirement: Responses declare document dependencies precisely

Each cacheable HTML and JSON response SHALL declare the document IDs whose rendered values it uses, including referenced documents. Corresponding HTML and JSON SHALL share those dependencies. Detail responses SHALL NOT receive a broad document-type dependency merely because their main document has that type.

#### Scenario: An article is also displayed in the blog home
- **WHEN** cached article A depends on A, cached article B depends only on B, and cached blog-home responses display A
- **THEN** article A and the home declare A as a dependency in both HTML and JSON, while article B does not

#### Scenario: A rendered reference changes
- **WHEN** a published referenced document changes values displayed by multiple cached responses
- **THEN** those responses can be invalidated by its document dependency without purging unrelated details of its type

### Requirement: Dependency registration is cumulative and request-local

Multiple dependency registrations within one response SHALL be merged and deduplicated independently of render order and other requests. If complete dependencies exceed the provider's 500-tag limit or cannot be represented safely, that response SHALL remain non-cacheable instead of silently omitting dependencies.

#### Scenario: Layout, page, and footer register dependencies
- **WHEN** those components register different document IDs and some duplicates in any order
- **THEN** the final response contains their union once, without retaining tags from another request

#### Scenario: The tag limit is exceeded
- **WHEN** a response requires more than 500 unique dependency tags
- **THEN** public caching is disabled for that response rather than caching it with an incomplete dependency set

### Requirement: Published document edits invalidate their dependent responses

A valid published update SHALL invalidate the changed document's dependency. A content-only update with verified unchanged collection membership/order SHALL leave unrelated document details and unrelated collections cached. New regeneration reads SHALL use the live published API.

#### Scenario: Only article A and its dependent home are invalidated
- **WHEN** article A is republished with changed display content, signed metadata identifies no membership/order change, and only A's detail and the blog home declare A
- **THEN** A's HTML/JSON and the home's HTML/JSON are invalidated, while article B and collections not depending on A remain cached

#### Scenario: A purged response is requested again
- **WHEN** the live API exposes the new revision and an origin read begins after the dependency purge
- **THEN** the new response is built from that live revision and becomes eligible for the long-lived policy again

### Requirement: Collection dependencies cover membership and ordering changes

Automatic listings SHALL declare collection dependencies in addition to IDs they render. Published creation, removal, or changes to fields controlling declared membership/order SHALL invalidate relevant collection dependencies, including when the changed document was absent from the cached listing. Collection tags SHALL NOT be attached to unrelated detail responses.

#### Scenario: A newly published article was not present in the cached home
- **WHEN** the first published revision of an article enters a collection used by the blog home
- **THEN** that collection dependency invalidates the home even though its previous response could not contain the new article ID, while existing unrelated article details stay cached

#### Scenario: An edit changes filtering or ordering
- **WHEN** a published edit changes a field used by a declared collection predicate or sort order
- **THEN** the affected collection responses are invalidated even if that article was not previously displayed

#### Scenario: A published page is removed or changes slug
- **WHEN** an unpublish/delete or slug change affects a cached detail and a declared listing
- **THEN** the old detail dependency and affected listing dependencies are invalidated, and an origin request for an absent old route returns non-cacheable 404

### Requirement: Webhook metadata is authenticated and backwards compatible

The webhook SHALL preserve raw-body signature and freshness validation and accept existing `_id`/`_type` payloads. Optional signed `operation` and `collectionChanged` fields SHALL support selective collection invalidation. Missing classification SHALL conservatively invalidate that type's declared collections, never all of its detail pages.

#### Scenario: A legacy payload is delivered
- **WHEN** a valid signed payload contains only `_id` and `_type`
- **THEN** the changed document and that type's declared collections are invalidated without a whole-site purge or invalidation of unrelated detail pages

#### Scenario: Signed metadata identifies a content-only update
- **WHEN** a valid payload declares `operation: "update"` and `collectionChanged: false`
- **THEN** invalidation targets the document dependency without adding the collection dependency

#### Scenario: Published creation or deletion is misclassified as content-only
- **WHEN** a valid payload declares a create/delete operation with `collectionChanged: false`
- **THEN** collection invalidation still occurs because publication/removal can change membership

#### Scenario: A payload or its signature is invalid
- **WHEN** signature validation fails, the signature is expired, or provided classification fields have invalid types/values
- **THEN** the webhook rejects the request without purging any cache tags

### Requirement: Draft and version edits do not invalidate published caches

The webhook configuration SHALL exclude draft/version events, and the handler SHALL defensively skip their document namespaces after authentication. Saving unpublished edits SHALL NOT purge published page, JSON, or collection entries.

#### Scenario: An editor saves only a draft
- **WHEN** an article is edited without publishing
- **THEN** its published detail and listing cache entries remain reusable

#### Scenario: A draft-only delivery reaches the webhook
- **WHEN** an authenticated delivery identifies a draft or version document
- **THEN** the handler performs no published-cache purge

### Requirement: Failed invalidation remains recoverable

Purge failures SHALL produce retryable non-success responses, not successful acknowledgements. Duplicate delivery SHALL be safe. Maintainer documentation SHALL explain failure detection and authorized tag-scoped recovery without relying on daily expiry or introducing an unauthenticated purge endpoint.

#### Scenario: The purge service fails or rate-limits the operation
- **WHEN** a valid document event cannot complete its required purge
- **THEN** the webhook returns a retryable failure and does not claim the affected responses were invalidated

#### Scenario: A valid event is delivered more than once
- **WHEN** the same valid invalidation is delivered repeatedly
- **THEN** repeated scoped purges are safe and do not broaden to a whole-site purge

#### Scenario: Automatic delivery retries are exhausted
- **WHEN** an operator investigates stale content after failed webhook attempts
- **THEN** the runbook identifies the relevant dependency tags and provider-authenticated recovery procedure, and states that there is no daily self-healing guarantee

### Requirement: Failed public regeneration is not promoted to a cached success

The home and page endpoints SHALL preserve non-cacheable 400 responses for invalid parameters, 404 responses for absent documents, and 502 responses for failed upstream reads. Live API failures SHALL NOT trigger a fallback to the Sanity API CDN. Sitemap source upstream failures SHALL retain their existing 502 behavior.

#### Scenario: Invalid parameters do not reach the origin
- **WHEN** a home or page request contains an unsupported locale or a page request contains an invalid slug
- **THEN** the endpoint returns 400 with browser and Netlify no-store directives without reading Sanity

#### Scenario: The live API is unavailable
- **WHEN** an upstream live read fails after the existing client's retry behavior is exhausted
- **THEN** the home or page endpoint returns 502 with browser and Netlify no-store directives rather than querying the Sanity API CDN for a fallback

#### Scenario: The sitemap origin read fails
- **WHEN** the sitemap URL source cannot obtain its published route data from the live API
- **THEN** the source returns 502 instead of reporting an empty successful route list

### Requirement: Preview remains a separate uncached content path

Validated preview sessions SHALL retain their existing draft-aware query path and non-cacheable page/proxy responses. Public live-origin selection SHALL NOT change the shared module client, preview activation, or preview credentials.

#### Scenario: A preview session reads a draft
- **WHEN** a validated preview session loads a home or page with unpublished edits
- **THEN** it continues using the existing preview query path, can display those edits, and does not store its page or proxy response in browser or shared CDN caches

#### Scenario: Public regeneration does not affect a later preview
- **WHEN** a public live-origin read is followed by a validated preview request in the same server process
- **THEN** the preview retains its original client configuration and draft behavior

### Requirement: Sitemap freshness remains periodic rather than webhook-driven

The sitemap SHALL retain its configured 86400-second interval and request-driven refresh, without document-webhook invalidation. Sitemap XML/index routes SHALL be excluded from long-lived page retention. Documentation SHALL distinguish the configured interval from a strict visibility or indexing deadline.

#### Scenario: Publication does not force an immediate sitemap refresh
- **WHEN** a page is published, removed, or assigned a new slug while a sitemap cache entry remains reusable
- **THEN** the document webhook does not force regeneration of that sitemap entry and the prior URL set can remain visible until its normal refresh

#### Scenario: The sitemap is refreshed through its normal cache lifecycle
- **WHEN** the normal sitemap cache lifecycle executes the URL source again after published routes have changed
- **THEN** the refreshed route set is obtained from the live API and the configured cache interval remains 86400 seconds

#### Scenario: The default page cache policy becomes long-lived
- **WHEN** public content adopts one-year on-demand retention
- **THEN** generated sitemap XML/index routes retain their separate periodic policy instead of inheriting the new one-year rule

#### Scenario: The refresh contract is explained to maintainers
- **WHEN** a maintainer consults the starter's cache documentation
- **THEN** it identifies request-driven refresh, stale-while-revalidate and downstream caching as possible visibility delays, and does not promise sitemap freshness or search-engine indexing within exactly 24 hours of publication
