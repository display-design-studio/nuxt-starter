# Proposal

## Why

The caching contract (document/collection dependency tags, long-lived on-demand retention, preview isolation, signed-webhook purge) is provider-neutral in intent but implemented against Netlify only: response headers (`Netlify-CDN-Cache-Control`, `Netlify-Cache-Tag`, `Netlify-Vary`), the purge call (`@netlify/functions`), the ISR route rules, and the CI harness all assume Netlify. A project derived from this starter that deploys elsewhere would have to rewrite the caching layer. The owner wants to choose the hosting provider per project while keeping one caching logic.

## What Changes

- Introduce a cache-provider adapter boundary. The provider-neutral core keeps: dependency tag builders and normalization, sticky no-store, request-local tag accumulation, webhook parsing/classification, preview-session detection, and query-parameter policy. Adapters own: Nitro preset and route rules, public/no-store response headers, tag and vary header names, cookie/query vary, and tag purge.
- Select the provider at build time with `NUXT_CACHE_PROVIDER` (`netlify` default, `vercel`). The selection sets the Nitro preset and loads the matching adapter; an unknown value, or a preset that contradicts the provider, fails the build.
- Ship adapters for Netlify (behavior-preserving) and Vercel. Cloudflare Workers is deferred to issue #48; the boundary is designed so it can be added later.
- Let each adapter declare which contract guarantees it can meet (tag purge, durable shared retention, query-key restriction, on-demand page retention). A guarantee the provider cannot meet is reported by the build/verification step, never silently weakened.
- Parametrize the synthetic compiled-build harness and CI by provider; document per-provider setup, credentials, and a gated real-CDN checklist.

## Capabilities

### New Capabilities

- `cache-provider-adapters`: provider selection, the neutral/adapter boundary, per-provider header/purge/route-rule behavior, capability declaration, and per-provider verification.

### Modified Capabilities

- `content-freshness`: its Netlify-specific wording is generalized to "the selected provider" once that capability is synced to the main specs. Netlify behavior itself does not change.

## Impact

- Runtime: `shared/utils/cacheHeaders.ts`, `server/utils/cdnCache.ts`, `shared/utils/responseCache.ts` (tag header name), `server/api/cache/revalidate.post.ts` (purge), `server/middleware/sanity-preview-cache.ts` (vary header), `nuxt.config.ts` (preset, route rules, sitemap rules), `scripts/verify-cache-build.mjs`, `.github/workflows/ci.yml`.
- Dependencies: provider purge SDKs/clients load only for the selected provider.
- Documentation: README provider matrix, `AGENTS.md` and `.context/ARCHITECTURE.md` cache/env sections (owner-managed: proposed replacement text only).
- Credentials: each provider needs its own purge credentials in addition to `NUXT_SANITY_WEBHOOK_SECRET`; these are server-only.

## Exclusions

- Cloudflare (deferred, tracked in #48) and other providers beyond Netlify and Vercel, and generic Node/Docker/static targets (the adapter interface is the extension point).
- A persistent application cache store, a manual purge endpoint, or any change to the Sanity data flow, query shapes, tag vocabulary, or webhook payload.
- Real deployments or real purges; these need separate authorization for a non-production target.
- Guaranteeing identical CDN semantics across providers: the contract is identical, the guarantees an adapter can honor are declared.
