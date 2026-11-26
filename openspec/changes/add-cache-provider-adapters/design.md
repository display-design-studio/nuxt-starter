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

Unverified provider facts (must be confirmed against provider documentation before the corresponding task starts; they are not assumed here): Vercel's CDN header, tag header, tag-purge API and credentials; Cloudflare's tag header, tag-purge API (zone id and token), and whether Worker-rendered responses are stored by the edge cache or need the Cache API / zone cache rules.

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

### 3. Cloudflare page retention is an open design question

Without ISR, on-demand page retention on Cloudflare must come from response headers honored by Cloudflare's cache, possibly plus the Cache API inside a Nitro plugin. Which one works with tag purge on Worker-rendered responses is unverified. Task 4.1 is a verification spike whose outcome decides whether the Cloudflare adapter can claim `onDemandPageRetention`; if it cannot, the adapter ships with that capability false and the docs say so.

### 4. Selection is build-time and strict

`NUXT_CACHE_PROVIDER` defaults to `netlify`. It sets `nitro.preset` unless `NITRO_PRESET` is set, in which case a contradiction throws. Unknown values throw. Auto-detection was considered and rejected by the owner.

### 5. Purge failures keep the existing semantics

`purgeByTags` throws on any failure; the handler maps it to the same retryable 503 and never exposes provider errors or credentials.

## Risks / Trade-offs

- Cloudflare caching of dynamic responses may not meet the one-year on-demand model: mitigated by capabilities and the spike.
- Three providers triple the verification surface: mitigated by one parametrized harness and by keeping real-CDN checks as a gated checklist.
- Header names and purge APIs may change: confined to one adapter file per provider.

## Open Decisions (owner)

None blocking the proposal. Per-provider purge credential names are proposed in tasks and confirmed when the adapter is implemented.
