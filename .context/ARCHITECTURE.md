# Architecture

This document is the canonical technical context for agents. Keep it aligned with the repository when architecture changes; use `README.md` for human-facing explanations.

## System Shape

Nuxt 4 full-stack application using Vue 3, TypeScript, Sanity CMS, Tailwind CSS v4, and the Nuxt SEO suite. Netlify is the production target and provides ISR, durable CDN caching, and cache-tag invalidation.

Primary areas:

- `app/` — pages, layouts, components, composables, and client assets
- `server/api/sanity/` — published-content endpoints with explicit cache handling
- `server/api/cache/` — signed Sanity webhook for on-demand invalidation
- `server/middleware/` — preview-session cache bypass
- `server/utils/` — cache, request, Sanity parameter, and webhook helpers
- `shared/utils/` — isomorphic GROQ queries, locales, sitemap logic, and shared headers
- `shared/types/` — fallback Sanity types used until Studio typegen is available
- `i18n/locales/` — locale messages and site metadata
- `studio/` — optional Sanity Studio cloned into the repository by derived projects

## Sanity Data Flow

Add a document type through all four layers:

1. `shared/utils/<type>Query.ts` defines and exports a GROQ query with `defineQuery` from `groq`.
2. `server/api/sanity/<type>.get.ts` validates parameters, starts from `no-store`, fetches the published result with stega disabled, returns explicit 404/502 errors, and calls `setPublicCdnCache()` only after a successful result.
3. `app/composables/useSanity<Type>.ts` uses `useSanityQuery()` for preview and `useFetch('/api/sanity/<type>')` for published traffic.
4. `app/pages/*.vue` awaits the composable, disables caching before throwing on missing or upstream data, then adds the returned `_id` and `_type` as page cache tags.

Queries receive `$lang`; slug queries also receive `$slug`. Localized fields are objects keyed by locale and are projected with `field[$lang]`. Localized slugs use `slug[$lang].current`. Import generated query result types from `#sanity-types`.

## Caching Contract

- Browser responses use `Cache-Control: public, max-age=0, must-revalidate`.
- Netlify durable CDN responses use a 24-hour max age and a 1-hour stale-while-revalidate window.
- Published anonymous Sanity reads use the Sanity API CDN through `useCdn: true`.
- Successful API and page responses are tagged with Sanity document `_id` and `_type` values.
- Collection pages must also include every document type that can be added to the collection, so publishing a new document invalidates the listing.
- A signed Sanity webhook at `POST /api/cache/revalidate` purges cached API and page responses by `_id` and `_type`.
- Validated preview sessions identified by the `sanity-preview-id` cookie bypass browser and CDN caching.
- Preview, cache-control, and visual-editing routes are never ISR-cached.

Call `useCacheTag()` once per response with the complete tag set because later calls overwrite earlier response headers.

## Rendering and Visual Editing

- Pages use Netlify ISR with a 24-hour lifetime.
- Preview composables read drafts directly through `useSanityQuery()`.
- Production composables use server endpoints so published responses receive the Netlify caching contract.
- Sanity stega and the visual-editing overlay are enabled only for preview behavior.
- The visual-editing bundle is lazy and removed from normal visitor prefetching in the Nuxt build manifest hook.

## Internationalization

- Strategy: `prefix_except_default`.
- Default locale: `en`, without a URL prefix.
- Other enabled locales use a prefix such as `/it/...`.
- `shared/utils/locales.ts` is the single source of truth for active locales.
- Each active locale requires `i18n/locales/<code>.json`.
- Use `NuxtLinkLocale` for internal localized navigation.

## Styling and UI

- Tailwind CSS v4 is integrated through `@tailwindcss/vite`.
- The CSS entry point is `app/assets/css/main.css`.
- There is no `tailwind.config.js`; theme customization belongs in CSS through `@theme`.
- Accessibility hints, Nuxt hints, and Nuxt ESLint integration load only outside production.

## Environment Variables

| Variable | Purpose |
|---|---|
| `NUXT_SANITY_PROJECT_ID` | Sanity project identifier |
| `NUXT_SANITY_TOKEN` | Private token for draft reads and visual editing |
| `NUXT_SANITY_VISUAL_EDITING_STUDIO_URL` | Studio URL used by the visual-editing overlay |
| `NUXT_SANITY_WEBHOOK_SECRET` | HMAC secret for cache revalidation webhooks |
| `NUXT_PUBLIC_SITE_URL` | Canonical site URL when Netlify's `URL` is unavailable |

Never expose private tokens or webhook secrets through public runtime configuration or client code.

## Code Conventions

- Use 2-space indentation, single quotes, no semicolons, and Stroustrup braces.
- Follow `@antfu/eslint-config` and repository-specific ESLint rules.
- Prefer Nuxt auto-imports where the existing codebase does so.
- Preserve explicit error and cache behavior when extending Sanity endpoints.
- Treat generated files and framework build output as non-source artifacts.
