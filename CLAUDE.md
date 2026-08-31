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
bun run test       # focused unit tests
bun run typecheck  # Nuxt/Vue type checking
```

## Architecture

Nuxt 4 full-stack app with Sanity CMS, deployed on Netlify with ISR (Incremental Static Regeneration).

### Data-Flow Pattern (add a new document type by following all 4 steps)

1. **`shared/utils/<type>Query.ts`** — define the GROQ query constant (use the `groq` template tag)
2. **`server/api/sanity/<type>.get.ts`** — `defineEventHandler` that validates query params, runs the published query, calls `setPublicCdnCache()` with the result `_id`/`_type`, and explicitly marks errors `no-store`
3. **`app/composables/useSanity<Type>.ts`** — preview-aware composable: `useSanityQuery()` in preview mode, `useFetch('/api/sanity/<type>')` in production
4. **`app/pages/*.vue`** — call the composable; throw on missing/upstream data before adding the result `_id`/`_type` as page cache tags

### Caching Architecture

- **Browser cache**: stores responses but revalidates every request (`max-age=0, must-revalidate`)
- **Netlify durable CDN**: 24 hours with a 1-hour stale-while-revalidate window
- **Sanity API CDN**: anonymous published reads use `useCdn: true`
- **On-demand invalidation**: signed Sanity webhooks purge both page and API responses by `_id`/`_type`
- **Preview mode**: a validated `sanity-preview-id` cookie bypasses all caching

### Key Directories

- `app/` — Nuxt client app (pages, layouts, composables, assets)
- `server/api/sanity/` — Netlify-cached endpoints for each content type
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
