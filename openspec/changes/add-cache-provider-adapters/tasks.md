# Tasks

Implementation requires a separate explicit apply request. Deploying, publishing, and real purges need separate authorization for a non-production target.

## 1. Provider facts

- [x] 1.1 Done for Vercel; recorded in `design.md` Context for issue #50. Confirmed from official documentation, for Vercel: CDN cache header, tag header, tag-purge API, required credentials, query/cookie vary support, and whether SSR responses are edge-cached. Record sources and unresolved items in `design.md`. Verify each Vercel fact is either confirmed with a source or listed as an open risk. Cloudflare research stays in `design.md` Context for issue #48.

- [x] 1.2 Done for Netlify on Nitro 2 (decided): the netlify preset builds and its compiled output is verified. Other presets move to issues #50 and #48.

## 2. Adapter boundary (Netlify only, no behavior change)

- [x] 2.1 Extract the adapter interface and a Netlify adapter from `cacheHeaders.ts`, `responseCache.ts`, `cdnCache.ts`, the preview middleware, and `revalidate.post.ts`. Done as an isomorphic header adapter (`shared/cache/`) plus a server-only purge (`server/cache/purge.ts`), because shared code also runs in the client bundle and must not import provider SDKs. The build-time resolution (virtual module or alias) moves to 2.2 together with `NUXT_CACHE_PROVIDER`; until then `shared/cache/provider.ts` is the single selection point. Verify `bun test`, typecheck without Sanity env, and `verify-cache-build.mjs` pass unchanged and the built Netlify headers equal those of `main`.
- [x] 2.2 Add `NUXT_CACHE_PROVIDER` selection setting the preset, with unknown-value and preset-conflict failures. Done with a build-time constant (`__CACHE_PROVIDER__` through Vite `define` and Nitro `replace`, default `netlify`) instead of an alias, which bun tests cannot resolve. The preset is set only for an explicit provider, so the Docker `node-server` build and Netlify's own detection are unchanged. Only implemented providers are accepted; Vercel and Cloudflare are added with issues #50 and #48. Verify tests for default, each supported value, unknown value, and conflict.
- [ ] 2.3 Deferred to issue #48: moving the page retention and sitemap periodic route rules into the adapter only matters for a provider without Nitro `isr` (Cloudflare). Netlify and Vercel keep the rules in `nuxt.config.ts`.

## 3. Vercel adapter

Moved to issue #50 (deferred by the owner on 2026-11-26), including the per-adapter tag limits.

## 4. Cloudflare adapter

Moved to issue #48 (deferred by the owner on 2026-11-26).

## 5. Verification, CI, documentation

- [ ] 5.1 Deferred until a second provider exists (#50, #48). Parametrize `verify-cache-build.mjs` and CI by provider, asserting declared capabilities and printing unsupported ones. Verify a deliberate header regression in one adapter fails only that provider's job.
- [x] 5.2 README documents `NUXT_CACHE_PROVIDER` and the adapter boundary. Proposed replacement text for the owner-managed `AGENTS.md` and `.context/ARCHITECTURE.md` is in the pull request description; those files are not edited without authorization.
- [ ] 5.3 Deferred until a second provider exists (#50, #48). Provide the gated real-CDN checklist per provider (publish, purge, `Cache-Status`/equivalent, missed-webhook recovery). Verify it is documented, not executed.
