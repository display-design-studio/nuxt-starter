# Tasks

Implementation requires a separate explicit apply request. Deploying, publishing, and real purges need separate authorization for a non-production target.

## 1. Provider facts

- [ ] 1.1 Confirm from official documentation, for Vercel: CDN cache header, tag header, tag-purge API, required credentials, query/cookie vary support, and whether SSR responses are edge-cached. Record sources and unresolved items in `design.md`. Verify each Vercel fact is either confirmed with a source or listed as an open risk. Cloudflare research stays in `design.md` Context for issue #48.

- [ ] 1.2 On Nitro 2 (decided), confirm each provider's preset name, and how route rules and the `nitro:init` hook behave. Verify by a successful build for each provider preset on that Nitro major.

## 2. Adapter boundary (Netlify only, no behavior change)

- [x] 2.1 Extract the adapter interface and a Netlify adapter from `cacheHeaders.ts`, `responseCache.ts`, `cdnCache.ts`, the preview middleware, and `revalidate.post.ts`. Done as an isomorphic header adapter (`shared/cache/`) plus a server-only purge (`server/cache/purge.ts`), because shared code also runs in the client bundle and must not import provider SDKs. The build-time resolution (virtual module or alias) moves to 2.2 together with `NUXT_CACHE_PROVIDER`; until then `shared/cache/provider.ts` is the single selection point. Verify `bun test`, typecheck without Sanity env, and `verify-cache-build.mjs` pass unchanged and the built Netlify headers equal those of `main`.
- [x] 2.2 Add `NUXT_CACHE_PROVIDER` selection setting the preset, with unknown-value and preset-conflict failures. Done with a build-time constant (`__CACHE_PROVIDER__` through Vite `define` and Nitro `replace`, default `netlify`) instead of an alias, which bun tests cannot resolve. The preset is set only for an explicit provider, so the Docker `node-server` build and Netlify's own detection are unchanged. Only implemented providers are accepted; Vercel is added with task 3; Cloudflare with issue #48. Verify tests for default, each supported value, unknown value, and conflict.
- [ ] 2.3 Deferred to issue #48: moving the page retention and sitemap periodic route rules into the adapter only matters for a provider without Nitro `isr` (Cloudflare). Netlify and Vercel keep the rules in `nuxt.config.ts`.

## 3. Vercel adapter

- [ ] 3.1 Implement the Vercel adapter (headers, route rules, tag purge, required env) using only confirmed facts from 1.1. Verify with a stubbed purge that tags, headers, query/cookie vary, retryable 503, and no-store/preview behavior match the contract.

## 4. Cloudflare adapter

Moved to issue #48 (deferred by the owner on 2026-11-26).

## 5. Verification, CI, documentation

- [ ] 5.1 Parametrize `verify-cache-build.mjs` and CI by provider, asserting declared capabilities and printing unsupported ones. Verify a deliberate header regression in one adapter fails only that provider's job.
- [ ] 5.2 Update the README provider matrix and setup steps, and prepare proposed replacement text for the owner-managed `AGENTS.md` and `.context/ARCHITECTURE.md` cache and environment sections. Verify no document still presents Netlify as the only supported provider, and that owner-managed files are not edited without authorization.
- [ ] 5.3 Provide the gated real-CDN checklist per provider (publish, purge, `Cache-Status`/equivalent, missed-webhook recovery). Verify it is documented, not executed.
