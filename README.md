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
- **Three cache layers** — browser revalidation + Netlify durable CDN (24h) + Sanity API CDN, invalidated via per-document cache tags
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
shared/utils/<type>Query.ts      GROQ query (exported const)
  └─> server/api/sanity/<type>.get.ts   validated handler + Netlify cache headers/tags
        └─> app/composables/useSanity<Type>.ts   preview switch → useSanityQuery | useFetch
              └─> app/pages/*.vue   await composable + useCacheTag(data._id)
```

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

### Preview vs cached endpoint

- **Preview mode** (`sanity-preview-id` cookie set): the composable calls `useSanityQuery` directly — live data, no cache.
- **Production**: the composable calls `useFetch('/api/sanity/<type>')` — hits the Netlify-cached endpoint, stega disabled.

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

### Three-layer model

| Layer | Duration | Mechanism |
|---|---|---|
| Browser | Revalidate every request | `Cache-Control: max-age=0, must-revalidate` |
| Netlify CDN | 24 h + 1 h stale window | Durable CDN header + page ISR |
| Sanity API CDN | Sanity-managed | `useCdn: true` for anonymous published reads |

### `routeRules` (`nuxt.config.ts`)

Pages use ISR and browser revalidation; API routes set their own Netlify headers:

```ts
routeRules: {
  '/**': {
    isr: 86400,
    headers: { 'cache-control': 'public, max-age=0, must-revalidate' },
  },
  '/api/**': { isr: false },
  '/preview/**': { isr: false, headers: { 'cache-control': 'no-store' } },
  '/_sanity/**': { isr: false, headers: { 'cache-control': 'no-store' } },
}
```

### Preview bypass (`server/middleware/sanity-preview-cache.ts`)

Runs on every request before route handlers:

1. Sets `Netlify-Vary: cookie=sanity-preview-id` on page responses (not on API routes or static assets).
2. Validates the cookie against the private preview ID before setting `no-store`.
3. Always disables caching for `/preview/**` and `/_sanity/**`.

### Cache tagging

`app/composables/useCacheTag.ts` sets the `Netlify-Cache-Tag` response header (server-side only).
API and page responses are tagged with the Sanity document `_id` and `_type`.

```ts
// Single-document page (server-side only)
useCacheTag([home.value._id, home.value._type])
```

Listing pages must also tag every document type that can be added to the listing. Tags only for
the documents currently rendered cannot invalidate a cached listing when a new document is
published, because its `_id` was not present when the response was cached.

```ts
// Listing page: `hub` describes the page and `items` contains `page` documents.
// Keep the null guards in place before accessing these values.
useCacheTag([
  data.value.hub._id,
  data.value.hub._type,
  'page',
  ...data.value.items.map(page => page._id),
])
```

When a new `page` document is published, the webhook purges its `_type` tag (`page`), which
also invalidates this listing. Include each listed type for collections with multiple document
types. Pass all tags in one `useCacheTag` call: it sets the response header and later calls
overwrite earlier tags.

### Cache invalidation

| Endpoint | Trigger | Auth | Behaviour |
|---|---|---|---|
| `POST /api/cache/revalidate` | Sanity webhook | Timestamped HMAC signature | Purges API and page responses by `_id` and `_type` |

Targeted invalidation is fully covered by the Sanity webhook above — there is no manual/deploy-triggered purge endpoint.

### Configure the Sanity webhook

In the Sanity project management dashboard, create a webhook for the same dataset used by this
application (`production` by default):

| Setting | Value |
|---|---|
| URL | `https://<your-site-domain>/api/cache/revalidate` |
| HTTP method | `POST` |
| Trigger events | Create, update, and delete |
| Draft events | Disabled |
| Version events | Disabled |
| Secret | The same private value as `NUXT_SANITY_WEBHOOK_SECRET` on the deployment |
| Projection | The GROQ projection below |

```groq
{
  "_id": coalesce(after()._id, before()._id),
  "_type": coalesce(after()._type, before()._type)
}
```

Both fields are required strings: `_id` identifies the affected document and `_type` invalidates
collections that can include that document. The before/after fallback preserves identity on
delete/unpublish. Do not send the entire document, tokens, or arbitrary cache tags. Leave the filter
empty to cover every published type; if narrowing it, include all types used by pages, listings,
and rendered references, and verify delete events are still included.

Sanity adds the `sanity-webhook-signature` header automatically when a secret is configured.
The handler verifies the signature over the raw JSON body and accepts signatures within five
minutes. Keep the secret out of the URL, public runtime configuration, and client code.

This minimal payload also remains accepted by the `refactor/cache` implementation. Its optional
signed `operation` and `collectionChanged` fields enable more selective invalidation; configure
those only alongside that implementation and its query-specific dependency rules. On the current
`main` implementation, invalidation uses `_id` and `_type`.

Verify setup on a non-production deployment using a published test document: create, update,
and unpublish it, inspect the webhook attempts log, and confirm that its JSON endpoint and page
refresh. Invalid signatures return 401 and malformed payloads return 400. Monitor failed deliveries:
Sanity retries retryable failures only twice at 30-second intervals. See the official
[Sanity webhook documentation](https://www.sanity.io/docs/content-lake/webhooks).

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
```

**Step 2 — Server endpoint** `server/api/sanity/<type>.get.ts`

```ts
import type { <Type>QueryResult } from '#sanity-types'
import { createError } from 'h3'

export default defineEventHandler(async (event) => {
  setNoStore(event)
  const locale = getSanityLocale(event)

  try {
    const result = await useSanity().fetch<<Type>QueryResult>(
      <type>Query,
      { lang: locale },
      { stega: false },
    )

    if (!result) {
      throw createError({ statusCode: 404, statusMessage: 'Not Found' })
    }

    setPublicCdnCache(event, [result._id, result._type])
    return result
  }
  catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    throw createError({ statusCode: 502, statusMessage: 'Failed to fetch from Sanity' })
  }
})
```

Include `_id` and `_type` in every public query. They are the Netlify cache tags used by the webhook to invalidate API and rendered-page responses together.

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

useCacheTag([data.value._id, data.value._type])
</script>
```

For listing pages, add the static type tag for each collection of documents so newly published
documents invalidate the cached listing. Keep the null guards before accessing the listing
container, category, or items.

```ts
if (data.value?.hub && data.value.items) {
  useCacheTag([
    data.value.hub._id,
    data.value.hub._type,
    'page',
    ...data.value.items.map(page => page._id),
  ])
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
