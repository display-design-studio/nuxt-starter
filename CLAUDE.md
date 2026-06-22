# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun install        # install dependencies
bun run dev        # start dev server at http://localhost:3000
bun run build      # production build
bun run generate   # static site generation (SSG alternative)
bun run preview    # preview production build
bun run lint       # ESLint check
bun run lint:fix   # ESLint auto-fix
```

## Architecture

Nuxt 4 full-stack app with Sanity CMS, deployed on Netlify with ISR (Incremental Static Regeneration).

### Data-Flow Pattern (add a new document type by following all 4 steps)

1. **`shared/utils/<type>Query.ts`** — define the GROQ query constant (use the `groq` template tag)
2. **`server/api/sanity/<type>.get.ts`** — `defineCachedEventHandler` that runs the query; sets `Cache-Control: public, max-age=3600, s-maxage=86400`; assigns Netlify cache tag via `useCacheTag()`
3. **`app/composables/useSanity<Type>.ts`** — preview-aware composable: `useSanityQuery()` in preview mode, `useFetch('/api/sanity/<type>')` in production
4. **`app/pages/*.vue`** — call the composable; `stega: false` is set automatically by the cached endpoint

### Caching Architecture

- **Browser cache**: 1 hour (`max-age=3600`)
- **Netlify CDN**: 24 hours (`s-maxage=86400`, `stale-while-revalidate=86400`)
- **ISR revalidation**: Sanity webhooks POST to `/api/cache/revalidate`, which calls `purgeCache()` with the document `_id` as the Netlify cache tag and clears Nitro storage
- **Preview mode**: Bypasses all caching when `sanity-preview-id` cookie is present (handled by `server/middleware/sanity-preview-cache.ts`)

### Key Directories

- `app/` — Nuxt client app (pages, layouts, composables, assets)
- `server/api/sanity/` — cached Nitro endpoints for each content type
- `server/api/cache/` — cache revalidation webhook handler
- `shared/utils/` — isomorphic GROQ query constants
- `i18n/locales/` — translation files (en active, it disabled)

### i18n

Strategy: `prefix_except_default` — default locale (`en`) has no prefix, others use `/it/...`. Queries always receive `$lang` param. Use `NuxtLinkLocale` instead of `NuxtLink` for internal links.

### Environment Variables

| Variable | Purpose |
|---|---|
| `NUXT_SANITY_PROJECT_ID` | Sanity project ID |
| `NUXT_SANITY_TOKEN` | Sanity API token (read + visual editing) |
| `NUXT_SANITY_VISUAL_EDITING_STUDIO_URL` | Studio URL for visual editing overlay |
| `NUXT_SANITY_WEBHOOK_SECRET` | HMAC secret for cache revalidation webhook |

### Styling

Tailwind v4 via `@tailwindcss/vite`. Entry point: `app/assets/css/main.css` (just `@import "tailwindcss"`). No `tailwind.config.js` — configure via CSS using `@theme`.

### ESLint Style

2-space indent, single quotes, no semicolons, Stroustrup brace style (configured via `@nuxt/eslint` stylistic preset).
