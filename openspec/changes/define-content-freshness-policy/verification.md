# Cache contract verification — 2026-10-30

## Environment and isolation

- Sanity: `display-test`, project `xrn5spf3`, dataset `production`.
- Temporary Netlify site: `nuxt-cache-review-20261030-475560`, ID `9b37dacd-0bd9-4cbf-b591-d077658b9a90`.
- Synthetic namespace: `cache-review-20261030-475560`; no pre-existing content was modified.
- The isolated checkout added fixture article/listing routes using the branch's cache helpers,
  preview composable pattern and unchanged signed revalidation handler. Fixture routes are not
  part of the starter. The scoped Sanity webhook included only this run's document mutations.
- Initial macOS upload exposed a missing Linux mdream binding. The temporary artifact was supplied
  the matching `@mdream/rust-linux-x64-gnu@2.0.2` binary; normal deployment should build on Linux.

## Live publication and cache evidence

The complete primary run passed from 10:59:09 to 11:00:15 UTC. Both HTML and backing JSON were
checked at every content transition. Origin trace UUIDs distinguish regeneration from reuse;
`Cache-Status`, `Age`, response status and content markers were recorded alongside them.

| Scenario | Observed result |
|---|---|
| Warm A/B/blog/empty listing | Repeated requests are Netlify cache hits with stable origin UUIDs and `ttl=31536000` |
| Publish content-only A update | A and dependent blog regenerate with `CACHE_A_V2`; unrelated B and the empty listing retain their existing origin UUIDs |
| Save and edit A draft | Published A/blog remain cache hits; validated preview returns the current draft with `no-store` and CDN bypass |
| First publication into empty list | Previously empty HTML/JSON include C after collection invalidation; B remains cached |
| Move C between groups and change rank | Both affected listings update, including the one that previously did not contain C; B remains cached |
| Rename A slug | Old HTML/JSON URLs become 404/no-store; renamed URLs return the current document and become cache hits |
| Unpublish A | Renamed URLs become 404/no-store and the blog removes A; B remains cached |
| Invalid webhook signature | 401/no-store; B's cache is unaffected |
| Signed draft/version delivery | 200 acknowledgement without a published purge |
| Legacy `_id`/`_type` payload | 202 and actual regeneration of the namespaced document dependency |
| Sitemap index and locale XML | 200; dedicated policy remains `max-age=86400,s-maxage=86400,stale-while-revalidate=3600` |

For example, B retained HTML origin `1b095a7b-a703-42e7-ba57-8f89fe7c3877` and JSON origin
`1b29a311-2c6f-40a6-b402-6a5129b948de` across A publication, new membership, slug changes and
unpublish. Sanity's attempts log recorded 202 for all five measured published mutations.

## Browser, preview and failure checks

- Chromium loaded the real public page with no additional `/api/cache-probe/*` or Sanity request
  during hydration and no JavaScript errors; repeated after the final deployment.
- A browser iframe connected through the official Presentation comlink/compatibility protocol.
  Two real Sanity draft revisions delivered over `loader/query-change` updated the already-mounted
  Nuxt page without reload or runtime errors. This exercises the real loader integration using
  a synthetic parent, not the complete Studio editor UI.
- A bounded batch of five valid purges returned 202; the provider did not rate-limit that batch.
  No live 429 is claimed. Unit tests cover network/429-to-503 mapping.
- A temporary fixture-only route invoked the unchanged webhook handler with an intentionally
  invalid provider purge token, restoring it in `finally`. The actual provider rejection became
  503/no-store; the normal signed endpoint immediately returned 202/no-store. This fault injection
  is absent from the starter source and runs only on the disposable site.

## Corrections and local regression checks

- Resolved integration with main while preserving current AGENTS/OpenSpec tools.
- Added the home query's `collection:home` dependency for its first-document lookup.
- Fixed final no-store for API and negotiated JSON/crawler errors, as well as HTML error rendering.
  The live run exposed the crawler/fetch variant that the initial local build check had missed.
- 66 unit tests pass. Synthetic typecheck, lint, Node and Netlify builds pass.
- The compiled-handler check now covers 13 scenarios, including one-query SSR/JSON, hydration
  payload, retention/tags, both draft revisions, public isolation and negotiated error responses.
- CI repeats frozen installation, lint/typecheck/tests/build and the synthetic Netlify handler test.

The test establishes the specified dependency behavior and deployment contract. Provider eviction,
purge propagation, concurrent origin execution and already-open public payloads retain the
documented limitations; a 202 is not a guarantee of atomic visibility across all clients.

## Finalization

Independent review and temporary-resource cleanup are tracked in `tasks.md`.
