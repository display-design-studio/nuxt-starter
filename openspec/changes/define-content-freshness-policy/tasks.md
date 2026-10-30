# Tasks

This checklist supersedes the original 9-task plan after the confirmed on-demand/dependency scope revision. Only completed work that still satisfies its revised task remains checked. Changes to implementation code require a subsequent explicit apply request; publishing, deploying, and real purges also require separate authorization for a non-production target.

## 1. Preserve live origins and resolve sitemap compatibility

- [x] 1.1 Derive live published clients in the home/page handlers without mutating the base client; preserve query parameters, response shapes, anonymous access, and disabled stega. Verify the origin-selection cases in `bun test test/publicSanityReads.test.ts` return the live revision rather than the stale CDN fixture. Previously implemented and verified; retention/tag assertions are revised separately below.
- [x] 1.2 Cover invalid locale/slug, absent content, upstream failure, no CDN fallback, anonymous configuration, and global/mock cleanup. Verify the existing handler and parameter tests demonstrate 400/404/502 with no-store and unchanged shared-client configuration. Previously implemented and verified; this does not certify the new retention/dependency policy.
- [x] 1.3 Resolve the sitemap source's `RequestEvent`/legacy `H3Event` mismatch using the supported no-argument `useSanity()` initialization and a derived live client, without an event cast. Update its test and the origin documentation; verify live localized slugs, upstream 502, unchanged base configuration, and successful real Nuxt typecheck in addition to `bun test test/publicSanityReads.test.ts test/sitemap.test.ts`.

## 2. Long-lived content retention

- [x] 2.1 Replace daily content ISR with boolean ISR and align successful JSON headers to the 31536000-second durable, must-revalidate policy, retaining browser revalidation and no-store errors/preview. Remove the one-hour JSON stale window and update focused header/handler tests; verify the installed preset's effective retention mapping and that an otherwise fresh synthetic entry is not expired at 86400 seconds. Do not introduce another cache layer or cross-deploy cache persistence.
- [x] 2.2 Revise README diagrams/tables, endpoint comments, and `AGENTS.md` to explain on-demand content retention, the one-year preset bound, eviction/deploy/miss behavior, and the distinction between browser revalidation and CDN retention. Verify no application-content documentation still promises daily refresh or literal eternal storage; keep sitemap-specific daily statements scoped to sitemap.

## 3. Explicit and cumulative dependencies

- [x] 3.1 Add small shared document/collection tag builders and query-specific dependency selectors; wire the same selectors into home/page HTML and JSON registration without automatic `_type` detail tags or response-envelope changes. Add focused tests for namespace validation, rendered references, empty listings, and HTML/JSON parity; verify unrelated detail B does not acquire document A's or a blanket collection dependency.
- [x] 3.2 Make page registrations cumulative and request-local, sharing normalization/limit rules with API registration. Add tests for layout/page/footer order, deduplication, cross-request isolation, the 500-tag boundary, invalid tags, and sticky no-store for overflow/preview/errors; verify unsafe or incomplete dependency sets cannot become publicly cached through a later helper call.
- [x] 3.3 Add synthetic A/B/blog-home cache-index fixtures and document the extension recipe for rendered IDs, reference IDs, static collection dependencies, and predicate/sort field classification. Verify a content-only A purge removes A/home HTML and JSON but retains B, collection changes reach previously absent members/empty listings, and reference/unpublish/slug scenarios are covered. Do not add production article schemas or blog routes.

## 4. Selective published webhook invalidation and recovery

- [x] 4.1 Extend webhook parsing with validated optional signed `operation` and `collectionChanged` fields, preserving legacy `_id`/`_type` acceptance. Add parser/resolver tests for document-only updates, forced collection purge on create/delete, conservative missing-metadata behavior, invalid metadata, and draft/version skipping; verify no payload can supply arbitrary raw tags or request a whole-site purge.
- [x] 4.2 Replace raw ID/type purge selection with the shared dependency namespaces and preserve HMAC/age/no-store boundaries. Update handler tests for the revised tags, signed classification, legacy compatibility, invalid/expired/tampered input, duplicates, and simulated Netlify errors/rate limits. Verify only completed purges return success and failures remain retryable; all external requests must be stubbed.
- [x] 4.3 Document the matched Sanity trigger/filter/projection setup, before/after delta classification, conservative legacy mode, finite retry limits, failure detection, and an authorized provider-authenticated tag-scoped recovery procedure. Verify the recipe includes first publication/removal and all declared query membership/order fields, excludes drafts/versions, never relies on unsigned classification headers or stale signatures, and introduces no application purge endpoint or new secret.

## 5. Preserve the separate sitemap lifecycle

- [x] 5.1 Add finite 86400-second ISR overrides for the sitemap module's resolved root/index/named-locale XML routes so they do not inherit year-long content retention. Verify effective route rules for the current locale configuration and a synthetic multi-locale fixture, with the existing sitemap cache interval unchanged and no document/collection tags added to sitemap responses.
- [x] 5.2 Reconcile sitemap documentation with the new content policy and the compatible source initialization. Verify README/`AGENTS.md` still describe request-driven periodic refresh without a strict visibility/indexing deadline or document-webhook linkage, and the verification checklist distinguishes a live source read from cached XML regeneration.

## 6. Cross-path acceptance and regression checks

- [x] 6.1 In the established dependency environment, run `bun run test`, `bun run lint`, `bun run typecheck`, and `bun run build` with inspected scripts and synthetic configuration. Also verify the Netlify-target build/effective adapter output for content and sitemap retention without deployment or production credentials; record actual results and leave this task incomplete if any required check is blocked.
- [x] 6.2 Obtain independent review of the complete revised implementation for dependency completeness, selective versus legacy purge behavior, signature/draft boundaries, shared-state mutation, sticky no-store, sitemap overrides, and recovery semantics. Verify completion by resolving relevant findings and rerunning affected checks; static review is not proof of deployed CDN behavior.
- [x] 6.3 After separate authorization for a synthetic non-production project/dataset/deploy, execute the updated integration checklist: show A/home HTML and JSON invalidated while B retains its cache, draft-only edits cause no purge, new membership/order changes update listings, and unpublish/slug changes remove obsolete routes. Verify configured retention and enhanced classification, preview isolation, sitemap exceptions, and failure/recovery behavior; record safe evidence and leave this item unchecked if access/authorization is unavailable.

## Retained work and verification history

### Current verification (2026-10-30)

- Authorized live acceptance completed on a new isolated Netlify site and Sanity display-test. See `verification.md` for CDN, browser, Presentation-channel, webhook, failure and recovery evidence. Crawler/JSON error negotiation is fixed and covered by three additional compiled-handler scenarios (13 total). Independent review is recorded below.
- Temporary site, scoped webhook and five remaining synthetic documents removed at 11:06:19 UTC; raw-perspective verification found zero remaining documents in the test namespace.
- Independent read-only review at `d8cdaa7ff6aa79739e318a7c39e0ce4470ce18d4` found no blocking issues. The reviewer independently reran all 66 tests, lint and 13 compiled-handler checks, reviewed the live/cleanup evidence and confirmed the documented residual limitations. All 16 implementation/acceptance tasks are complete.

- Integrated current main, retaining AGENTS.md, current OpenSpec configuration and Codex skills; removed obsolete generated Claude/OpenCode workflow copies introduced by this branch (recoverable from its Git history).
- Lint and synthetic Nuxt typecheck pass. All 66 unit tests pass, including one-fetch assertions, dependency invalidation and validated preview no-store.
- Synthetic Node and Netlify production builds pass using main's Nuxt 4.6.3/Nitro 2.13.5 dependency environment. The Netlify adapter and generated sitemap route rules retain the expected one-year/86400-second policies. The skew-protection warning for boolean ISR remains; ordinary deploy invalidation is retained.
- `node scripts/verify-cache-build.mjs` passes 13 checks against the compiled Netlify handler: one fetch for each full HTML/JSON response, hydration payload, tags, retention, no-store on 400/404 including negotiated JSON errors, current draft preview and public isolation after preview. CI repeats this synthetic build verification.
- Fixed the actual Nitro API/page 404 browser-header override found by compiled-handler testing. Home now tags its first-document lookup collection.
- The authorized live run used Sanity CLI access to project `display-test` (`xrn5spf3`), public `production` dataset and a new disposable Netlify site. All test resources were removed after acceptance; no pre-existing content or deployment was changed.

### Historical baseline (superseded by current verification above)

- Dependency setup: frozen install with the hoisted linker succeeded without manifest or lockfile changes; the unmodified baseline then passed all 15 tests.
- Before this planning revision, `bun run test` passed 32 tests and `bun run lint` passed. Those results cover the partial original implementation, not the new long-lived retention/dependency requirements; no application checks were rerun during this planning-only revision.
- The existing webhook tests assert raw ID/type purges and the current successful-response tests assert the former TTL/tag policy. Those cases need revision under tasks 2.1 and 4.2, not silent acceptance as evidence of the new behavior.
- Existing README/`AGENTS.md` edits and the sitemap explanation are retained, but affected portions must be reconciled with the expanded policy under tasks 2.2, 3.3, 4.3, and 5.2. The original completed documentation tasks are not carried forward as completed revised requirements.
- The last real Nuxt typecheck with synthetic configuration failed with TS2769 at the sitemap event boundary. The proposed compatible correction is recorded in design decision 1 and task 1.3; it has not been applied in this revision.
- Build and independent implementation review have not run yet.
- Non-production deployment/publication/purge checks have not run and require explicit operational authorization.
