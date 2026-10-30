# AGENTS.md

This file provides guidance to coding agents (Claude Code, Codex, etc.) working in this repository. Human-facing docs live in `README.md`.

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
2. **`server/api/sanity/<type>.get.ts`** — begin with provisional no-store, validate query params, derive a client with `useSanity(event).client.withConfig({ useCdn: false, perspective: 'published' })`, read anonymously with `stega: false`, then call `setPublicCdnCache()` with the shared query dependency selector; errors remain `no-store`
3. **`app/composables/useSanity<Type>.ts`** — preview-aware composable: `useSanityQuery()` in preview mode, `useFetch('/api/sanity/<type>')` in production
4. **`app/pages/*.vue`** — call the composable; set final no-store and throw on missing/upstream data, otherwise register the same dependency selector as the JSON endpoint. Tags are cumulative per request, not overwritten

### Caching Architecture

- **Browser cache**: stores responses but revalidates every request (`max-age=0, must-revalidate`)
- **Netlify content cache**: on-demand page ISR (`true`) and durable JSON retention of 31536000 seconds, matching the installed preset's one-year bound; no daily refresh or extra JSON stale window. Browser revalidation and normal deploy invalidation remain enabled; eviction/expiry can still cause regeneration
- **Sanity origin**: public server handlers derive live published clients (`useCdn: false`) without mutating the shared module client; the module-wide default remains `useCdn: true`
- **On-demand invalidation**: signed body `_id`/`_type` plus optional `operation`/`collectionChanged` select document/collection tags. Classified content-only updates purge only the document; create/delete or missing metadata also purge the collection. Draft/version events are skipped. Purge failures return retryable 503; finite provider retries require monitoring and authorized scoped recovery, not daily self-healing
- **Preview mode**: a validated `sanity-preview-id` cookie bypasses all caching
- **Dependencies**: `doc:<id>` for rendered documents/references; `collection:<type>` only for collection membership/order. Detail pages do not carry blanket type tags. Selectors are explicit and shared by HTML/JSON; invalid or over-500 tag sets disable caching without truncation. Final no-store wins over later helpers
- **Sitemap**: the URL source uses a no-argument Sanity helper to avoid the legacy H3 event mismatch. Module-resolved XML/index/locale route overrides and the sitemap cache retain a finite 86400-second, request-driven policy without document-webhook invalidation; this is not a strict freshness or indexing deadline

### Key Directories

- `app/` — Nuxt client app (pages, layouts, composables, assets)
- `server/api/sanity/` — Netlify-cached endpoints for each content type
- `server/api/cache/` — cache revalidation webhook handler
- `shared/utils/` — isomorphic GROQ query constants
- `i18n/locales/` — translation files (en active, it disabled). Active locales are defined once in `shared/utils/locales.ts`

### i18n

Strategy: `prefix_except_default` — default locale (`en`) has no prefix, others use `/it/...`. Queries always receive `$lang` param. Use `NuxtLinkLocale` instead of `NuxtLink` for internal links.

### Environment Variables

| Variable | Purpose |
|---|---|
| `NUXT_SANITY_PROJECT_ID` | Sanity project ID |
| `NUXT_SANITY_TOKEN` | Sanity API token (read + visual editing) |
| `NUXT_SANITY_VISUAL_EDITING_STUDIO_URL` | Studio URL for visual editing overlay |
| `NUXT_SANITY_WEBHOOK_SECRET` | HMAC secret for cache revalidation webhook |
| `NUXT_PUBLIC_SITE_URL` | Canonical site URL for sitemap/SEO (Netlify's `URL` is detected automatically) |

### Styling

Tailwind v4 via `@tailwindcss/vite`. Entry point: `app/assets/css/main.css` (just `@import "tailwindcss"`). No `tailwind.config.js` — configure via CSS using `@theme`.

### ESLint Style

2-space indent, single quotes, no semicolons, Stroustrup brace style (configured via `@antfu/eslint-config` in `eslint.config.mjs`).
