# Design

## Context

Repository facts (current `main`):
- Provider-specific code is small and concentrated: `cacheHeaders.ts` (`Netlify-CDN-Cache-Control`, `queryVaryHeader`), `responseCache.ts` (`Netlify-Cache-Tag`), `cdnCache.ts`, `revalidate.post.ts` (`purgeCache`), the preview middleware (`Netlify-Vary`), `nuxt.config.ts` route rules (`isr: true`, sitemap `isr: 86400`), `verify-cache-build.mjs`, and CI (`NITRO_PRESET=netlify`).
- Everything else (dependency selectors, tag normalization, webhook parsing/classification, no-store stickiness, preview detection) is already provider-neutral and covered by tests.

Provider facts from the Cloudflare Nuxt migration guide (page modified 2026-11-11):
- Use preset `cloudflare_module` with `nitro.cloudflare.deployConfig` and `nodeCompat`, `compatibilityDate` 2025-07-17 or later, and `wrangler` as a dev dependency.
- `isr` route rules work only on Vercel; on Workers they must become `prerender`, `swr`, or cache-control headers. Cloudflare applies every matching `_headers` rule, so overlapping rules stack their `Cache-Control` values.
- Env vars are read through `useRuntimeConfig(event)` inside handlers (not module scope); secrets use `wrangler secret put` and a gitignored `.dev.vars` locally.
- The guide does NOT cover `CDN-Cache-Control`, `Cache-Tag`, or purge APIs.

Cloudflare Workers Caching facts (Cloudflare docs under `/workers/cache/`, read 2026-11-26; the Worker's own `fetch()` responses are cached in front of the Worker):
- Enabled with `cache.enabled = true` in wrangler config (Wrangler 4.69.0+); `cross_version_cache` (4.107.0+) shares entries across Worker versions, otherwise each deployment starts cold. The cache belongs to the Worker, not the domain, and works on `workers.dev`, routes and custom domains. Zone Cache Rules and zone-level purges do not affect it.
- Header precedence: `cloudflare-cdn-cache-control` (consumed and stripped), then `cdn-cache-control`, then `Cache-Control`. The docs state that edge and browser lifetimes can differ by using `cloudflare-cdn-cache-control` for the edge and `Cache-Control` for browsers. `s-maxage`, `must-revalidate` and `proxy-revalidate` forbid serving stale and disable `stale-if-error`. A worked example of `max-age=0, must-revalidate` for browsers with a one-year edge lifetime is not in the docs (our reading of the precedence rules, unverified).
- Tags: `Cache-Tag` response header (stripped before the client), printable ASCII, at most 1024 characters per tag and 1000 tags per response, case-insensitive; invalid tags are silently dropped at storage time. Purge with `ctx.cache.purge({ tags })` or `cache.purge` from `cloudflare:workers`; propagation is global with the same guarantees as zone purge. No API token or zone id is needed for this path. Purge limits are the Free-tier limits regardless of plan; `success: false` with `errors` is returned when limited. Purge is per entrypoint.
- Cache key: path and query string (all parameters, order matters) and the Worker version, not host, cookies or most request headers. The docs describe no "ignore query" setting; the documented pattern is a gateway entrypoint that calls the cached entrypoint with `cf.cacheKey` (same account only).
- Cookies: not part of the key. A response with `Set-Cookie` is bypassed. `Vary` is honored for any header, but `Vary: Cookie` is not discussed (it would create one variant per exact cookie string; inference).
- Only GET/HEAD are cached; cron, queues and Durable Objects always run. Every request is billed at the Workers request rate; a hit costs no CPU. There is no pre-warming API.
- Preset and config: `cloudflare_module` with `deployConfig` and `nodeCompat`, `compatibilityDate` 2025-07-17 or later (Nuxt on Workers guide). `isr` route rules do not apply on Workers. Secrets use `wrangler secret put` and `.dev.vars` locally and are read through `useRuntimeConfig(event)` inside handlers.
- The Cloudflare Pages Nuxt + Sanity tutorial is not relevant: it targets Nuxt 2, has no caching or preview, and refreshes by redeploying through a deploy hook. The 2024 Nitro ISR proof of concept on KV is time-based only with no on-demand invalidation.

Still unverified: Workers Caching status (beta/GA) and plan availability; numeric body-size limit (Free-plan limit at launch, stated as temporary), maximum TTL, and purge rate numbers; `Surrogate-Control` handling; Vercel's CDN header, tag header, purge API and credentials.

## Goals / Non-Goals

**Goals:**
- One caching contract and one tag vocabulary on every provider.
- Provider chosen per project by one build-time variable, with Netlify unchanged and the default.
- Fail loudly when a provider cannot honor a guarantee.

**Non-Goals:** see `proposal.md` Exclusions.

## Decisions

### 1. Adapter interface owns exactly the provider-specific surface

```ts
interface CacheProviderAdapter {
  id: 'netlify' | 'vercel' | 'cloudflare'
  nitroPreset: string
  capabilities: { tagPurge: boolean, durableSharedRetention: boolean, queryKeyRestriction: boolean, onDemandPageRetention: boolean }
  pageRouteRules(): Record<string, unknown>           // replaces the hard-coded isr rules
  publicHeaders(input: { queryParams?: readonly string[] }): Record<string, string>
  tagHeaderName: string
  noStoreHeaders: Record<string, string>
  previewVaryHeader(cookie: string): Record<string, string>
  purgeByTags(tags: readonly string[]): Promise<void> // throws on any failure
  requiredEnv: readonly string[]
}
```

The neutral core calls the adapter for names and values and never mentions a provider. Because `shared/` code runs in both app and server, the adapter is resolved at build time and exposed through a virtual module, so the unused providers' SDKs are not bundled.

**Alternatives considered:** per-provider `if` branches in each file (rejected: spreads provider knowledge); a runtime provider switch (rejected: the Nitro preset is build-time anyway and would bundle every SDK).

### 2. Capabilities instead of a lowest-common-denominator contract

Netlify and Vercel have ISR; Cloudflare Workers does not. Rather than weaken the contract everywhere, each adapter declares capabilities and the verification harness asserts the contract for the declared ones and prints an explicit "not guaranteed" line for the rest. A required capability missing for the selected provider (for example `tagPurge`) fails the build, because the webhook could never invalidate correctly.

### 3. Cloudflare uses Workers Caching, behind a gateway entrypoint

Workers Caching maps closely to the contract: `Cache-Tag` for dependencies, `cloudflare-cdn-cache-control` for the long edge lifetime while `Cache-Control: public, max-age=0, must-revalidate` stays browser-facing, and `ctx.cache.purge({ tags })` for invalidation from the webhook running in the same Worker (no zone credentials). Two gaps need a different structure than Netlify:
- Cookies are not in the cache key, so a preview-cookie visitor would receive the cached published page without the Worker running. A gateway entrypoint (uncached) must inspect the preview cookie and route preview traffic to an uncached path, public traffic to the cached entrypoint.
- Query parameters are part of the key. The same gateway normalizes the key with `cf.cacheKey` (dropping parameters the page does not read).

Whether Nitro's `cloudflare_module` output can expose the second entrypoint (custom entry, Nitro hook, or wrapper) is unverified; task 4.1 decides it. If it cannot, the Cloudflare adapter ships with `queryKeyRestriction` and preview-safe caching declared unsupported and the build refuses to enable public caching without preview isolation.

### 4. Selection is build-time and strict

`NUXT_CACHE_PROVIDER` defaults to `netlify`. It sets `nitro.preset` unless `NITRO_PRESET` is set, in which case a contradiction throws. Unknown values throw. Auto-detection was considered and rejected by the owner.

### 5. Purge failures keep the existing semantics

`purgeByTags` throws on any failure; the handler maps it to the same retryable 503 and never exposes provider errors or credentials.

## Risks / Trade-offs

- Cloudflare's Workers Caching is recent (status and plan availability not stated, Free-plan size limit at launch) and requires the gateway structure: mitigated by capabilities, the spike, and keeping Cloudflare behind the same contract tests.
- A Worker-error `stale-if-error` default serves stale indefinitely unless `must-revalidate` is present; the contract already sends it.
- Three providers triple the verification surface: mitigated by one parametrized harness and by keeping real-CDN checks as a gated checklist.
- Header names and purge APIs may change: confined to one adapter file per provider.

## Open Decisions (owner)

None blocking the proposal. Per-provider purge credential names are proposed in tasks and confirmed when the adapter is implemented.
