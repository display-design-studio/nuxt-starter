# Nuxt Starter — Developer & AI Context Guide

This document describes the architecture, conventions, and extension patterns of this starter.
It is intended as context for Claude and future skills, not as a beginner tutorial.

---

## 1. Overview

A production-ready Nuxt 4 starter wired to Sanity CMS, deployed on Netlify.
Goals: structured content via Sanity, three cache layers (browser revalidation, Netlify CDN, and Sanity API CDN), i18n, SEO, and visual editing out of the box.

**Key modules**

| Module | Role |
|---|---|
| `@nuxtjs/sanity` | Sanity client, `useSanityQuery`, typegen, visual editing |
| `@nuxtjs/i18n` | Locale routing, `useI18n` |
| `@nuxtjs/seo` | Meta, OG, sitemap via `site.*` config |
| `@nuxt/scripts` | Third-party script loading |
| `@nuxt/a11y` | Accessibility hints |
| `@tailwindcss/vite` | Tailwind v4 via Vite plugin |

---

## 2. Architecture & Conventions

### Directory layout

```
app/
  composables/        # useSanity<Type>.ts, useCacheTag.ts
  pages/              # index.vue, [slug].vue (placeholder)
  assets/css/         # main.css (Tailwind entry)

server/
  api/
    sanity/           # Netlify-cached endpoints: home.get.ts, page.get.ts
    cache/            # revalidate.ts (Sanity webhook)
  middleware/
    sanity-preview-cache.ts   # validated preview cookie + no-store for preview

shared/
  utils/              # GROQ queries: homeQuery.ts, pageQuery.ts
```

### Core data-flow pattern

```
shared/utils/<type>Query.ts      GROQ query (exported const)
  └─> server/api/sanity/<type>.get.ts   validated handler + Netlify cache headers/tags
        └─> app/composables/useSanity<Type>.ts   preview switch → useSanityQuery | useFetch
              └─> app/pages/*.vue   await composable + useCacheTag(data._id)
```

### Types

Import query results from `#sanity-types`. The alias uses `studio/types/sanity.types.ts`
when the Studio has been cloned and typegen has run, otherwise it falls back to
the minimal checked-in starter types under `shared/types/`.

---

## 3. Sanity CMS Integration

### Configuration (`nuxt.config.ts`)

```ts
sanity: {
  projectId: process.env.NUXT_SANITY_PROJECT_ID,
  dataset: "production",
  apiVersion: "2026-03-10",
  perspective: "published",
  useCdn: true,
  visualEditing: {
    token: process.env.NUXT_SANITY_TOKEN,
    studioUrl: process.env.NUXT_SANITY_VISUAL_EDITING_STUDIO_URL,
    stega: true,   // embeds stega metadata for overlay rendering
  },
}
```

### `useSanityQuery` vs cached endpoint

- **Preview mode** (`sanity-preview-id` cookie set): composable calls `useSanityQuery` directly — live data, no cache.
- **Production**: composable calls `useFetch('/api/sanity/<type>')` — hits the Netlify-cached endpoint, stega disabled.

### Composable pattern

```ts
// app/composables/useSanityHome.ts
export function useSanityHome(params: { lang: string }) {
  const visualEditingState = useSanityVisualEditingState()
  const isPreview = computed(() => Boolean(visualEditingState?.enabled))

  if (isPreview.value) {
    return useSanityQuery<HomeQueryResult>(homeQuery, params)
  }
  return useFetch<HomeQueryResult>('/api/sanity/home', { query: params })
}
```

Same shape for `useSanityPage` (adds `slug` param).

### Visual Editing

- Stega encodes source maps into string values at render time.
- Studio URL is set via `NUXT_SANITY_VISUAL_EDITING_STUDIO_URL`.
- Preview session is identified by the `sanity-preview-id` cookie (set by the Sanity visual editing flow).

### GROQ query convention

- File: `shared/utils/<type>Query.ts`
- Export name: `<type>Query` (camelCase, matches filename)
- GROQ params: `$lang` for locale, `$slug` for slug
- Auto-imported by Nuxt — available in both server and app without explicit imports

---

## 4. Caching Architecture

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

1. Sets `Netlify-Vary: cookie=sanity-preview-id` on page responses.
2. Validates the cookie against the private preview ID before setting `no-store`.
3. Always disables caching for `/preview/**` and `/_sanity/**`.

### Cache tagging

`app/composables/useCacheTag.ts` sets the `Netlify-Cache-Tag` response header (server-side only).
API and page responses are tagged with the Sanity document `_id` and `_type`.

```ts
// In a page component (server-side only)
useCacheTag(home.value._id)
```

### Cache invalidation

| Endpoint | Trigger | Auth | Behaviour |
|---|---|---|---|
| `POST /api/cache/revalidate` | Sanity webhook | Timestamped HMAC signature | Purges API and page responses by `_id` and `_type` |

Targeted invalidation is fully covered by the Sanity webhook above — there is no manual/deploy-triggered purge endpoint.

### Required env vars

| Variable | Purpose |
|---|---|
| `NUXT_SANITY_PROJECT_ID` | Sanity project ID |
| `NUXT_SANITY_TOKEN` | Sanity API token (read + visual editing) |
| `NUXT_SANITY_VISUAL_EDITING_STUDIO_URL` | Sanity Studio URL for visual editing overlay |
| `NUXT_SANITY_WEBHOOK_SECRET` | Secret for `POST /api/cache/revalidate` (Sanity webhook) |

---

## 5. Extending the Starter

### Adding a new Sanity document type — 4-step pattern

**Step 1 — GROQ query** `shared/utils/<type>Query.ts`

```ts
export const <type>Query = groq`*[_type == "<type>" && language == $lang][0]{
  _id,
  // ... fields
}`;
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

export const useSanity<Type> = (params: { lang: string }) => {
  const visualEditingState = useSanityVisualEditingState();
  const isPreview = computed(() => Boolean(visualEditingState?.enabled));

  if (isPreview.value) {
    return useSanityQuery<<Type>QueryResult>(<type>Query, params);
  }
  return useFetch<<Type>QueryResult>("/api/sanity/<type>", { query: params });
};
```

**Step 4 — Page**

```vue
<script setup lang="ts">
const { locale } = useI18n()
const { data } = await useSanity<Type>({ lang: locale.value })

if (data.value?._id) {
  useCacheTag(data.value._id)
}
</script>
```

### Placeholder pages

`app/pages/index.vue` and `app/pages/[slug].vue` render raw `<pre>{{ data }}</pre>`.
These are intentional placeholders — replace with project-specific markup.
The data-fetching and caching wiring is already correct; only the template needs work.

`[slug].vue` extracts the slug from the route:

```vue
<script setup lang="ts">
const route = useRoute()
const { locale } = useI18n()
const { data: page } = await useSanityPage({ lang: locale.value, slug: route.params.slug as string })
if (page.value?._id)
  useCacheTag(page.value._id)
</script>
```

---

## 6. i18n

- Default locale: `en`. Supported: `en`, `it`.
- Locale files: `i18n/locales/en.json`, `i18n/locales/it.json`.
- Active locale via `useI18n().locale`.
- `lang` is passed as a query param to all API endpoints and GROQ queries as `$lang`.
- To add a locale: add entry to `i18n.locales` in `nuxt.config.ts` and create the corresponding JSON file.

---

## 7. Deployment

This starter is **Netlify-first**. Cache invalidation relies on `purgeCache` from `@netlify/functions`, which is a Netlify-specific API. `/api/cache/revalidate` calls it directly. If deploying to a different platform, this endpoint needs to be replaced with the equivalent CDN purge mechanism.

No other Netlify-specific configuration is required beyond setting env vars in the Netlify dashboard.

---

## 8. Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NUXT_SANITY_PROJECT_ID` | Yes | Sanity project ID |
| `NUXT_SANITY_TOKEN` | Yes | Private server token used only for visual editing and draft reads; public endpoint reads remain anonymous |
| `NUXT_SANITY_VISUAL_EDITING_STUDIO_URL` | Yes | Sanity Studio URL for visual editing overlay |
| `NUXT_SANITY_WEBHOOK_SECRET` | Yes (production) | Shared secret for Sanity webhook cache revalidation |
