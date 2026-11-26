# Tasks

Implementation requires a separate explicit apply request. Deploying, publishing, and real purges need separate authorization for a non-production target.

## 1. Provider facts

- [ ] 1.1 Confirm from official documentation, for Vercel and Cloudflare: CDN cache header, tag header, tag-purge API, required credentials, query/cookie vary support, and whether SSR responses are edge-cached. Record sources and unresolved items in `design.md`. Verify each Unverified fact in Context is either confirmed with a source or listed as an open risk.

## 2. Adapter boundary (Netlify only, no behavior change)

- [ ] 2.1 Extract the adapter interface and a Netlify adapter from `cacheHeaders.ts`, `responseCache.ts`, `cdnCache.ts`, the preview middleware, and `revalidate.post.ts`; resolve the adapter through a build-time virtual module. Verify `bun test`, typecheck without Sanity env, and `verify-cache-build.mjs` pass unchanged and the built Netlify headers equal those of `main`.
- [ ] 2.2 Add `NUXT_CACHE_PROVIDER` selection setting the preset, with unknown-value and preset-conflict failures. Verify tests for default, each supported value, unknown value, and conflict.
- [ ] 2.3 Move page and sitemap route rules into the adapter. Verify the Netlify route rules are byte-identical to `main`.

## 3. Vercel adapter

- [ ] 3.1 Implement the Vercel adapter (headers, route rules, tag purge, required env) using only confirmed facts from 1.1. Verify with a stubbed purge that tags, headers, query/cookie vary, retryable 503, and no-store/preview behavior match the contract.

## 4. Cloudflare adapter

- [ ] 4.1 Spike: determine, on a non-production Worker, whether header-based caching plus tag purge retains Worker-rendered pages on demand; record the result and decide the adapter's declared capabilities. Verify with recorded request/response evidence, not assumption.
- [ ] 4.2 Implement the Cloudflare adapter per 4.1 (preset `cloudflare_module`, `_headers` overlap handling, secrets via `useRuntimeConfig(event)` inside handlers, purge credentials). Verify the stubbed contract tests and that unsupported capabilities are reported, not asserted.

## 5. Verification, CI, documentation

- [ ] 5.1 Parametrize `verify-cache-build.mjs` and CI by provider, asserting declared capabilities and printing unsupported ones. Verify a deliberate header regression in one adapter fails only that provider's job.
- [ ] 5.2 Update the README provider matrix and setup steps, and prepare proposed replacement text for the owner-managed `AGENTS.md` and `.context/ARCHITECTURE.md` cache and environment sections. Verify no document still presents Netlify as the only supported provider, and that owner-managed files are not edited without authorization.
- [ ] 5.3 Provide the gated real-CDN checklist per provider (publish, purge, `Cache-Status`/equivalent, missed-webhook recovery). Verify it is documented, not executed.
