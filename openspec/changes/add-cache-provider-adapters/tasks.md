# Tasks

Implementation requires a separate explicit apply request. Deploying, publishing, and real purges need separate authorization for a non-production target.

## 1. Provider facts

- [ ] 1.1 Cloudflare is confirmed in `design.md` Context except the items listed as still unverified there. Confirm from official documentation, for Vercel (and the remaining Cloudflare items): CDN cache header, tag header, tag-purge API, required credentials, query/cookie vary support, and whether SSR responses are edge-cached. Record sources and unresolved items in `design.md`. Verify each Unverified fact in Context is either confirmed with a source or listed as an open risk.

- [ ] 1.2 On Nitro 2 (decided), confirm each provider's preset name, how `cloudflare:workers` imports resolve in the build, and how route rules and the `nitro:init` hook behave. Verify by a successful build for each provider preset on that Nitro major.

## 2. Adapter boundary (Netlify only, no behavior change)

- [x] 2.1 Extract the adapter interface and a Netlify adapter from `cacheHeaders.ts`, `responseCache.ts`, `cdnCache.ts`, the preview middleware, and `revalidate.post.ts`. Done as an isomorphic header adapter (`shared/cache/`) plus a server-only purge (`server/cache/purge.ts`), because shared code also runs in the client bundle and must not import provider SDKs. The build-time resolution (virtual module or alias) moves to 2.2 together with `NUXT_CACHE_PROVIDER`; until then `shared/cache/provider.ts` is the single selection point. Verify `bun test`, typecheck without Sanity env, and `verify-cache-build.mjs` pass unchanged and the built Netlify headers equal those of `main`.
- [ ] 2.2 Add `NUXT_CACHE_PROVIDER` selection setting the preset, with unknown-value and preset-conflict failures. Verify tests for default, each supported value, unknown value, and conflict.
- [ ] 2.3 Move page and sitemap route rules into the adapter. Verify the Netlify route rules are byte-identical to `main`.

## 3. Vercel adapter

- [ ] 3.1 Implement the Vercel adapter (headers, route rules, tag purge, required env) using only confirmed facts from 1.1. Verify with a stubbed purge that tags, headers, query/cookie vary, retryable 503, and no-store/preview behavior match the contract.

## 4. Cloudflare adapter

- [ ] 4.1 Spike on a non-production Worker: (a) confirm `cloudflare-cdn-cache-control: max-age=31536000, must-revalidate` with browser `Cache-Control: max-age=0, must-revalidate` yields an edge HIT and a revalidating browser; (b) confirm `ctx.cache.purge({ tags })` removes the entry globally; (c) determine whether Nitro `cloudflare_module` can host an uncached gateway entrypoint that handles the preview cookie and `cf.cacheKey` normalization; (d) record status, plan availability and limits. Verify with recorded `cf-cache-status` and header evidence, not assumption, and decide the adapter's declared capabilities.
- [ ] 4.2 Implement the Cloudflare adapter per 4.1 (preset `cloudflare_module`, `cache.enabled` wrangler config, gateway entrypoint for preview and key normalization, `_headers` overlap handling, secrets via `useRuntimeConfig(event)` inside handlers; in-Worker purge needs no zone credentials). Verify the stubbed contract tests and that unsupported capabilities are reported, not asserted.

## 5. Verification, CI, documentation

- [ ] 5.1 Parametrize `verify-cache-build.mjs` and CI by provider, asserting declared capabilities and printing unsupported ones. Verify a deliberate header regression in one adapter fails only that provider's job.
- [ ] 5.2 Update the README provider matrix and setup steps, and prepare proposed replacement text for the owner-managed `AGENTS.md` and `.context/ARCHITECTURE.md` cache and environment sections. Verify no document still presents Netlify as the only supported provider, and that owner-managed files are not edited without authorization.
- [ ] 5.3 Provide the gated real-CDN checklist per provider (publish, purge, `Cache-Status`/equivalent, missed-webhook recovery). Verify it is documented, not executed.
