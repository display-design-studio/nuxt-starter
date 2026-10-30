<div align="center">
  <a href="https://github.com/display-design-studio/nuxt-starter">
    <img src="https://avatars.githubusercontent.com/u/118281951?s=400&u=3ba5b42657ae2ac1a064b998b6110ea422317790&v=0" alt="Logo" width="80" height="80">
  </a>
  <h3 align="center">Nuxt Starter</h3>
  <p align="center">A Nuxt 4 full-stack starter wired to Sanity CMS, with layered CDN caching, i18n, and visual editing, deployed on Netlify.
</p>
</div>
<br>

## Features

- **Sanity CMS integration** via `@nuxtjs/sanity` — typed GROQ queries, visual editing (stega), preview mode
- **On-demand content caching** — browser revalidation, long-lived Netlify page/JSON caching, dependency-tag invalidation on publication, and live published Sanity reads on regeneration
- **i18n** via `@nuxtjs/i18n` (`prefix_except_default` strategy — default locale unprefixed)
- **SEO** via `@nuxtjs/seo` (sitemap, meta, schema.org)
- **Tailwind v4** via `@tailwindcss/vite`
- **Docker/Podman** setup for local development (`compose.yml`, `Dockerfile.dev`)

## Tech Stack

| Module | Role |
|---|---|
| `@nuxtjs/sanity` | Sanity client, `useSanityQuery`, typegen, visual editing |
| `@nuxtjs/i18n` | Locale routing, `useI18n` |
| `@nuxtjs/seo` | Meta, OG, sitemap. Site URL from `NUXT_PUBLIC_SITE_URL`, name from `nuxtSiteConfig` in `i18n/locales/*.json` |
| `@nuxt/scripts` | Third-party script loading |
| `@nuxt/a11y` | Accessibility hints (dev only: loaded when `NODE_ENV` is not `production`, with `@nuxt/hints` and `@nuxt/eslint`) |
| `@tailwindcss/vite` | Tailwind v4 via Vite plugin |

## Getting Started

```bash
bun install
cp .env.example .env   # fill in Sanity project ID, token, studio URL, secrets
bun run dev             # http://localhost:3000
```

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `NUXT_SANITY_PROJECT_ID` | Yes | Sanity project ID |
| `NUXT_SANITY_TOKEN` | Yes | Private server token used only for visual editing and draft reads; public endpoint reads remain anonymous |
| `NUXT_SANITY_VISUAL_EDITING_STUDIO_URL` | Yes | Sanity Studio URL for visual editing overlay |
| `NUXT_SANITY_WEBHOOK_SECRET` | Yes (production) | Shared secret for `POST /api/cache/revalidate` (Sanity webhook) |
| `NUXT_PUBLIC_SITE_URL` | Yes (production, outside Netlify) | Canonical site URL used by sitemap and SEO tags (Netlify's `URL` is detected automatically) |

### Scripts

| Script | Purpose |
|---|---|
| `bun run dev` | Start the dev server |
| `bun run build` | Production build |
| `bun run generate` | Static site generation (SSG alternative) |
| `bun run preview` | Preview production build |
| `bun run lint` / `lint:fix` | ESLint check / auto-fix |
| `bun run test` | Unit tests |
| `bun run typecheck` | Nuxt/Vue type checking |

For containerized development, see [Local Container Development](#local-container-development).

## Adding the Sanity Studio

This starter does not bundle the Sanity Studio. The workflow is to clone the
[sanity-starter](https://github.com/display-design-studio/sanity-starter) template directly
into this repo, under `studio/`, so the Studio ships as part of the same codebase:

```bash
git clone https://github.com/display-design-studio/sanity-starter.git studio
rm -rf studio/.git
```

Then, inside `studio/`:

```bash
cd studio
bun install
cp .env.example .env   # configure the Studio's own project ID / dataset
bun run dev             # start the Studio
bun run typegen         # generate studio/types/sanity.types.ts
```

This repo already expects that path: `nuxt.config.ts` aliases `#sanity-types` to
`./studio/types/sanity.types.ts`, so once the Studio is in place and typegen has run,
GROQ query results are typed end-to-end. Until then the alias falls back to the minimal
checked-in types under `shared/types/`. Import query results from `#sanity-types`.

## Project Structure & Data Flow

```
app/
  composables/        useSanity<Type>.ts, useCacheTag.ts, useNoStore.ts
  pages/              index.vue, [slug].vue (placeholders)
  assets/css/         main.css (Tailwind entry)

server/
  api/sanity/         Netlify-cached endpoints: home.get.ts, page.get.ts
  api/cache/          revalidate.post.ts (Sanity webhook)
  middleware/         sanity-preview-cache.ts (validated preview cookie + no-store)
  utils/              cdnCache.ts, sanityParams.ts, sanityWebhook.ts, requestPaths.ts

shared/
  utils/              GROQ queries (homeQuery.ts, pageQuery.ts, sitemap.ts),
                      locales.ts (active locales), cacheHeaders.ts

studio/               Sanity Studio (added per above, not part of this template)
```

```
Public HTML: Netlify page cache --> SSR --> internal API handler --> Sanity live API
Client data: Netlify JSON cache --> API handler -----------------> Sanity live API
Preview:     useSanityQuery --> module preview path --> draft-aware reads
```

Queries in `shared/utils/<type>Query.ts` are shared by the server handler and the preview-aware
`app/composables/useSanity<Type>.ts`. Pages call the composable and tag successful rendered
responses with the same explicit dependency selector as their JSON endpoint. During SSR, relative internal API requests run
in-process; they do not make another HTTP hop through Netlify's JSON cache.

## Sanity Integration

### Configuration (`nuxt.config.ts`)

```ts
sanity: {
  projectId: process.env.NUXT_SANITY_PROJECT_ID,
  dataset: 'production',
  apiVersion: '2026-03-10',
  perspective: 'published',
  useCdn: true,
  visualEditing: {
    token: process.env.NUXT_SANITY_TOKEN,
    studioUrl: process.env.NUXT_SANITY_VISUAL_EDITING_STUDIO_URL,
    stega: true,   // embeds stega metadata for overlay rendering
  },
}
```

`useCdn: true` remains the module default. The home/page server handlers explicitly derive
a live client with `useSanity(event).client.withConfig({ useCdn: false, perspective: 'published' })`.
They keep reads anonymous and pass `stega: false` to each fetch. Derivation does not mutate the
shared module client or change preview credentials and behavior.
The sitemap source uses `useSanity().client.withConfig(...)` without an event argument, since its
Nuxt request event is not compatible with the installed Sanity helper's legacy H3 event type.

### Preview vs cached endpoint

- **Preview mode** (validated preview session): the composable calls `useSanityQuery` directly — draft-aware data, no shared cache.
- **Production**: the composable calls `useFetch('/api/sanity/<type>')` — a Netlify-cached JSON endpoint on client navigation, or an in-process handler during SSR. Newly generated results come from the live published API, with stega disabled.

### Visual editing

- Stega encodes source maps into string values at render time.
- The Studio URL is set via `NUXT_SANITY_VISUAL_EDITING_STUDIO_URL`.
- The preview session is identified by the `sanity-preview-id` cookie, set by `/preview/enable` after the Studio's secret is validated.
- The visual editing overlay (React, ~780 kB) is a lazy chunk, loaded only in preview sessions. A `build:manifest` hook in `nuxt.config.ts` removes its prefetch for normal visitors.

### GROQ query convention

- File: `shared/utils/<type>Query.ts`
- Export name: `<type>Query` (camelCase, matches filename)
- GROQ params: `$lang` for locale, `$slug` for slug
- Auto-imported by Nuxt — available in both server and app without explicit imports
- Localized fields are objects keyed by locale (`title.en`): project them with `[$lang]`. Documents have no `language` field, and slugs are `localeSlug` objects (`slug[$lang].current`).

## Caching

### Published-content cache model

| Layer | Duration | Mechanism |
|---|---|---|
| Browser | Revalidate every request | `Cache-Control: max-age=0, must-revalidate` |
| Netlify page HTML | On-demand; preset limit: 1 year | Boolean ISR, dependency-tagged |
| Netlify JSON endpoints | 1 year, no extra stale window | Durable CDN header, dependency-tagged |
| Sanity live API | No Sanity API CDN layer | Explicit `useCdn: false` for public server reads |

The module-wide client still defaults to `useCdn: true`; this is not the origin policy of the
application-owned public handlers. No additional Nitro/application cache is added in front of Sanity.
Unchanged content is not regenerated merely because a day has elapsed. The installed preset maps
`isr: true` to 31536000 seconds, not eternal storage: expiry, eviction, normal deployments, or an
authorized recovery purge can cause a new live-origin read. Cache entries are not preserved across
code deployments. Browser revalidation remains necessary because a CDN purge cannot remotely clear
an independently fresh browser cache or update an already open Nuxt payload.

### `routeRules` (`nuxt.config.ts`)

Pages use ISR and browser revalidation; API routes set their own Netlify headers:

```ts
routeRules: {
  '/**': {
    isr: true,
    headers: { 'cache-control': 'public, max-age=0, must-revalidate' },
  },
  '/api/**': { isr: false },
  '/preview/**': { isr: false, headers: { 'cache-control': 'no-store' } },
  '/_sanity/**': { isr: false, headers: { 'cache-control': 'no-store' } },
}
```

The `nitro:init` hook derives finite 86400-second overrides from the sitemap module's resolved
root/index/named-locale paths and configured prefix. They are not covered by the year-long content
rule. API, preview, and Sanity proxy routes keep their existing ISR opt-outs/no-store behavior.

### Preview bypass (`server/middleware/sanity-preview-cache.ts`)

Runs on every request before route handlers:

1. Sets `Netlify-Vary: cookie=sanity-preview-id` on page responses (not on API routes or static assets).
2. Validates the cookie against the private preview ID before setting `no-store`.
3. Always disables caching for `/preview/**` and `/_sanity/**`.

### Cache tagging

`useCacheTag()` cumulatively registers `Netlify-Cache-Tag` dependencies server-side. Tags are merged
and deduplicated within each request, so layout, page, and footer registrations do not overwrite
one another. HTML and JSON use the same query-specific selector (`getHomeCacheTags` or
`getPageCacheTags`). The shared builders use two namespaces:

- `doc:<id>` for a rendered document or reference.
- `collection:<type>` for a query whose membership/order depends on that collection.

Detail responses do **not** automatically receive their `_type` as a tag. Publishing article A
must not evict an independent article B merely because both have the same type.

```ts
// Single-document page (server-side only)
useCacheTag(getHomeCacheTags(home.value))
```

Declare dependencies in a small shared selector next to the query. Include projected IDs for every
reference whose values are rendered; they are not inferred by recursively walking CMS data.
Automatic listings also need a static collection dependency, even when empty: a newly published
article's ID cannot already exist in a cached home. For example, in a project that adds a blog:

```ts
export function getBlogCacheTags(data: { hub: { _id: string }, items: { _id: string }[] }) {
  return getDocumentCacheTags([data.hub, ...data.items], ['article'])
}

// JSON endpoint, after validation and a successful read:
setPublicCdnCache(event, getBlogCacheTags(result))
// Page, after its missing/error guards:
useCacheTag(getBlogCacheTags(data.value))
```

For a content-only edit, purging `doc:A` removes A's HTML/JSON and every home that rendered A,
not B's detail or a listing that did not render A. First publication, removal, and membership/order
changes also invalidate `collection:article`. Declare every type used by the query's filters/sorts,
including referenced types, and align the webhook's change classification with those fields.
Collection invalidation can conservatively affect multiple listings, but not unrelated detail pages.

There is no blog schema/route in this template; the example is an extension contract tested with
synthetic fixtures. Never truncate dependencies: invalid tags or more than 500 unique tags disable
caching for that response. Final error/preview/overflow no-store decisions cannot be overridden
by later registrations. Endpoints use provisional no-store only while validating/fetching.

### Cache invalidation

| Endpoint | Trigger | Auth | Behaviour |
|---|---|---|---|
| `POST /api/cache/revalidate` | Published Sanity changes | Timestamped raw-body HMAC | Purges `doc:<id>` and, when required, `collection:<type>` across HTML and JSON |

Targeted invalidation is fully covered by the Sanity webhook above — there is no manual/deploy-triggered purge endpoint.

### Sanity webhook configuration

Configure POST to `/api/cache/revalidate`, the shared webhook secret, and create/update/delete
triggers. Disable draft and version events: saving a draft must not invalidate published content.
The handler also defensively skips those document namespaces after authenticating the request.

| Sanity setting | Required value |
|---|---|
| URL | `https://<your-site-domain>/api/cache/revalidate` |
| HTTP method | `POST` |
| Dataset | Same as the application (`production` by default) |
| Events | Create, update, delete (including unpublish) |
| Draft/version events | Disabled |
| Secret | Same private value as deployment variable `NUXT_SANITY_WEBHOOK_SECRET` |
| Filter | Empty, or all document types used by pages, listings and rendered references |
| Projection | Signed JSON fields from the GROQ projection below |

Sanity generates `sanity-webhook-signature` automatically from the configured secret. No token or
secret belongs in the URL or payload. `_id` and `_type` are required; `operation` and
`collectionChanged` are optional but enable selective collection invalidation.

Use this projection for the template's current page-slug predicate; it preserves the document
identity on delete/unpublish and conservatively classifies other document types:

<!-- webhook-projection:start -->
```groq
{
  "_id": coalesce(after()._id, before()._id),
  "_type": coalesce(after()._type, before()._type),
  "operation": delta::operation(),
  "collectionChanged": select(
    delta::operation() == "update" && coalesce(after()._type, before()._type) == "page"
      => delta::changedAny(slug),
    true
  )
}
```
<!-- webhook-projection:end -->

When adding a listing, update its signed classification to include **all** fields used by its
predicates and ordering, including fields on referenced types. For a project-specific article query
that filters by category and sorts by publication date, its selector would need those actual fields
as well as any slug/filter flags. A title is a collection change too if a query filters or sorts by
title. Do not copy a content-only classification without checking every declared query dependency.
The projection above is exercised by synthetic Delta-GROQ tests; this template does not add an article schema.

The home query uses `[0]`, so its selector also registers `collection:home` to handle a newly
published home replacing the selected result. Derived projects must enforce unique localized
page slugs in their CMS; ambiguous slug matches cannot provide reliable detail-page selection.

### Query budget

Each successful origin execution of the home/page endpoint performs one GROQ fetch. Include all
rendered references and listing items in that same query and project their IDs for dependencies.
The SSR result is transferred in Nuxt's payload for hydration. A Netlify cache hit performs no
Sanity query; a cache miss, expiry or purge permits a new origin execution. Client navigation can
independently miss the JSON cache, and concurrent misses or SDK retries can cause additional reads.
Live preview intentionally reads draft updates without public caching.

`scripts/verify-cache-build.mjs` exercises the compiled Netlify handler with a synthetic Sanity
client: it checks one query for an entire SSR response, hydration payload, HTML/JSON tags and
retention, and final no-store headers on API/page errors. CI builds with project ID `synthetic`
before running it. This verifies the adapter locally; actual CDN hits and webhook propagation
still require the non-production checks below.

- Signed `operation: "update"` plus `collectionChanged: false`: purge the document only.
- Create/delete or a collection change: purge the document and its type's declared collections.
  Create/delete cannot opt out with a false flag.
- Legacy `{ _id, _type }`, or incomplete metadata: conservatively purge document plus collection.
  This stays compatible but can invalidate more listings than a classified content-only edit;
  it never attaches a blanket type dependency to unrelated detail responses.

Metadata is validated from the signed JSON body, not trusted from unsigned operation headers.
Arbitrary payload tag lists are ignored. Configure and verify the enhanced projection before claiming
the precise A/home-only behavior for a deployment.

### Failed delivery and authorized recovery

The handler acknowledges 202 only after its required purge succeeds. Netlify network errors and
non-2xx purge responses (including rate limits) become 503 so delivery can be retried; repeated
scoped purges are safe. Sanity currently retries retryable failures twice at 30-second intervals,
with a 30-second request timeout. These finite retries are not a guaranteed delivery mechanism.

If content is stale, inspect Sanity's webhook attempts/message logs, the HTTP status, and the affected
document/collection dependency tags. Compare the live published value with fresh HTML and JSON
requests and safe cache headers. With no daily expiry, exhausted retries require operator attention.

An authorized operator can use Netlify's authenticated tag-purge controls/API with the **explicit**
`doc:<id>` and, if needed, `collection:<type>` tags and the intended site/deploy scope. Do not omit
the tag list: that can request a whole-site purge. Alternatively use provider-supported redelivery
with a valid current signature; an old captured signature is not a recovery mechanism. Keep tokens
in approved secret handling, never URLs/logs, and never disable HMAC or age validation to replay an event.
No new application recovery endpoint, credential, queue, or persistent dependency store is introduced.

References: [Sanity webhook delivery and retry policy](https://www.sanity.io/docs/content-lake/groq-powered-webhooks)
and [Netlify authenticated tag invalidation](https://docs.netlify.com/build/caching/caching-overview/#purge-by-cache-tag).

### Freshness contract

After a purge, a new origin read uses Sanity's live published API rather than a potentially older
Sanity API CDN result. This avoids repopulating Netlify with content held in that upstream CDN.
If a document is absent, the JSON endpoint returns a non-cacheable 404; upstream failures return
a non-cacheable 502 without falling back to the Sanity API CDN. Invalid parameters remain 400/no-store.

A webhook's 202 acknowledgement means the purge call completed, not that every edge, open browser,
or in-flight response already has the new content. Delivery and purge propagation take time;
requests already in progress can still expose older results. There is no daily refresh to recover
from a missed webhook: failure monitoring and authorized tag-scoped recovery are important. The
provider's one-year retention limit is not a publication-to-visibility guarantee. No artificial
webhook delay or extra cache layer is used.

### Sitemap freshness

`server/api/__sitemap__/urls.ts` also reads the live published API, but only when the sitemap's URL
source executes. The sitemap module retains its existing `cacheMaxAgeSeconds: 86400` setting and
request-driven refresh. Its generated data/XML is not tagged for document-webhook invalidation;
publishing, removing, or renaming a page does not force an immediate sitemap refresh.
Resolved XML/index/locale route rules also retain a finite 86400-second ISR setting, rather than
inheriting the application's year-long content retention. The source initializes its derived live
client without passing the incompatible Nuxt request event into the legacy Sanity helper.

A reusable sitemap cache entry can therefore contain the previous URL set even after page HTML/JSON
has been invalidated. Module stale-while-revalidate and downstream caching can add visibility delay.
The configured 24-hour interval is not a strict publication-to-sitemap freshness bound, and it does
not determine when a search engine will index a URL. Reading the source directly does not force the
cached XML to regenerate. No additional sitemap tags, purge mechanism, or cache layer is introduced.

### Non-production verification checklist

Use an explicitly authorized test project/dataset and Netlify deploy with synthetic content only.
Publishing, unpublishing, and triggering real purges require that authorization; unit tests do not
perform those operations.

1. Confirm the test deployment's signed Sanity webhook includes published create/update/delete events.
2. Prepare synthetic A/B detail responses and a listing using the documented shared dependency
   contract on the isolated test target; the template itself does not include blog routes/schema.
   Warm their HTML/JSON URLs and record safe `Cache-Status`/`Age` headers where available.
3. Publish a content-only change to A using verified signed classification. After propagation,
   confirm A and the listing regenerate with the new marker while B remains a cache hit. Verify
   first publication and membership/order edits also invalidate the listing when the changed ID
   was previously absent. Compare client navigation in a fresh browser session as well. Do not
   treat a 202 response alone as proof of freshness.
4. Unpublish the test page and verify subsequent origin responses return 404, rather than retaining
   the old document from Sanity's API CDN.
5. Create an unpublished edit and confirm it is visible only in a validated preview session.
   Preview page/proxy responses must remain no-store; public requests must not contain draft data
   or stega encoding, and draft-only edits must not purge public caches. Confirm preview still works
   after public requests in the same deployment. Exercise failure/recovery only on the authorized
   isolated target; verify retryable failure rather than false success.
6. Verify the sitemap URL source reads current published slugs when executed, while reusable sitemap
   XML can retain its prior URL set until normal refresh. Confirm the configured interval is 86400
   seconds and the document webhook has no sitemap-specific invalidation. Do not force production
   cache purges or wait 24 hours in CI to simulate this contract.
7. Record observed markers, HTTP statuses, cache headers, and any unverified checks. Cache-tag headers
   can be stripped downstream, so verify their effect through regeneration, not header visibility alone.
   Never record tokens, cookies, signatures, authorization headers, or private content.

## Adding a Sanity Document Type

Follow all four steps. The `scaffold-sanity-type` agent command generates the files.

**Step 1 — GROQ query** `shared/utils/<type>Query.ts`

```ts
export const <type>Query = groq`*[_type == "<type>"][0]{
  _id,
  _type,
  "title": title[$lang]
  // ... fields
}`

export function get<Type>CacheTags(document: { _id: string }) {
  return getDocumentCacheTags([document])
}
```

**Step 2 — Server endpoint** `server/api/sanity/<type>.get.ts`

```ts
import type { <Type>QueryResult } from '#sanity-types'
import { createError } from 'h3'

export default defineEventHandler(async (event) => {
  setNoStore(event, { provisional: true })
  const locale = getSanityLocale(event)
  const sanity = useSanity(event).client.withConfig({
    useCdn: false,
    perspective: 'published',
  })

  try {
    const result = await sanity.fetch<<Type>QueryResult>(
      <type>Query,
      { lang: locale },
      { stega: false },
    )

    if (!result) {
      throw createError({ statusCode: 404, statusMessage: 'Not Found' })
    }

    setPublicCdnCache(event, get<Type>CacheTags(result))
    return result
  }
  catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    throw createError({ statusCode: 502, statusMessage: 'Failed to fetch from Sanity' })
  }
})
```

Include document/reference `_id` values needed by the shared selector. `_type` can remain in the
response, but is not automatically a blanket detail-page dependency. Collections must be declared
explicitly. Use the same selector on the JSON endpoint and rendered page.

**Step 3 — Composable** `app/composables/useSanity<Type>.ts`

```ts
import type { <Type>QueryResult } from '#sanity-types'

export function useSanity<Type>(params: { lang: string }) {
  const visualEditingState = useSanityVisualEditingState()
  const isPreview = computed(() => Boolean(visualEditingState?.enabled))

  if (isPreview.value) {
    return useSanityQuery<<Type>QueryResult>(<type>Query, params)
  }
  return useFetch<<Type>QueryResult>('/api/sanity/<type>', { query: params })
}
```

`useSanityHome` and `useSanityPage` follow this shape; `useSanityPage` adds the `slug` param.

**Step 4 — Page**

```vue
<script setup lang="ts">
const { locale } = useI18n()
const { data, error } = await useSanity<Type>({ lang: locale.value })

if (error.value || !data.value) {
  useNoStore()
  throw createError({ statusCode: error.value ? 502 : 404 })
}

useCacheTag(get<Type>CacheTags(data.value))
</script>
```

For listing pages, reuse the shared listing selector described above. Keep the null guards before
accessing the listing container or items, including when the result is an empty array.

```ts
if (data.value?.hub && data.value.items) {
  useCacheTag(getBlogCacheTags(data.value))
}
```

### Placeholder pages

`app/pages/index.vue` and `app/pages/[slug].vue` render the raw document in `<pre>`.
These are intentional placeholders — replace them with project-specific markup.
The data-fetching and caching wiring is already in place; only the template needs work.

## i18n

- Default locale: `en`. Active: `en` (`it` is disabled, its file is kept).
- Active locales are defined once in `shared/utils/locales.ts`. `nuxt.config.ts` (i18n), the Sanity param validation and the sitemap all read it.
- Locale files: `i18n/locales/en.json`, `i18n/locales/it.json`. UI strings live under `nav.*` and `error.*`.
- Active locale via `useI18n().locale`.
- `lang` is passed as a query param to all API endpoints and to GROQ queries as `$lang`.
- To add a locale: uncomment or add its entry in `shared/utils/locales.ts` and create the corresponding JSON file.
- Use `NuxtLinkLocale` instead of `NuxtLink` for internal links.

## Deployment

Netlify-first. ISR cache is purged via `POST /api/cache/revalidate`, triggered by a
Sanity webhook, using `purgeCache()` from `@netlify/functions`. That is a Netlify-specific API:
on a different platform, replace the endpoint with the equivalent CDN purge mechanism.

No other Netlify-specific configuration is required beyond setting the environment variables
in the Netlify dashboard.

Build deployment artifacts on Linux (Netlify CI or a Linux build environment). A macOS build can
contain only the macOS `mdream` native binding and fail at function startup on Linux, even when
local checks pass. Manual uploads must include native dependencies for the target runtime;
Netlify CLI remote builds require the site to be connected to a Git repository.

## Local Container Development

The development application can run in a Docker or Podman container while Caddy
runs on the host. The container isolates project dependencies and exposes Nuxt
only on `127.0.0.1`; Caddy provides a stable local domain and HTTPS in front of it.

### Prerequisites

- Docker Compose or Podman Compose
- [Caddy](https://caddyserver.com/docs/install) installed on the host

### Start the Application

Start the Nuxt development container. `APP_PORT` is the host port Caddy proxies
to and defaults to `3000`:

```bash
APP_PORT=3000 docker compose up --build app
```

Use `podman compose` instead of `docker compose` when using Podman. The optional
`sanity` service requires the Studio to have been added under `studio/` as described
above.

### Start Caddy

In another terminal, start Caddy from the project root. A `.localhost` hostname
resolves to the local machine without an `/etc/hosts` entry:

```bash
DEV_HOST=nuxt-starter.localhost APP_PORT=3000 caddy run --config Caddyfile
```

Open [https://nuxt-starter.localhost:8443](https://nuxt-starter.localhost:8443).
The `Caddyfile` deliberately uses ports `8080` and `8443`, so the HTTPS port must
remain in the URL.

Caddy creates a certificate through its internal local CA (`tls internal`). Trust
that CA once on the host to avoid browser certificate warnings:

```bash
caddy trust
```

This command may request administrator privileges. Use a different local name by
changing `DEV_HOST`; use the same `APP_PORT` value for Compose and Caddy if you
override the default.

## Template Maintenance

This repo is used as a template. The following files exist only to maintain
*this* repository and are safe to delete once you've cloned it for your own project:

- `.github/renovate.json` — Renovate bot config scoped to this template repo
- `.github/workflows/ci.yml` — GitHub Actions CI (lint, typecheck, test, build); keep it or adapt it to your pipeline
- `AGENTS.md` — instructions for coding agents (`CLAUDE.md` only imports it); delete or adapt if you don't use agents

## License

[MIT](./LICENSE)
