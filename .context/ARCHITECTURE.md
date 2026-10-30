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
4. `app/pages/*.vue` awaits the composable, disables caching before throwing on missing or upstream data, then registers the same query-specific dependency selector as the endpoint.

Queries receive `$lang`; slug queries also receive `$slug`. Localized fields are objects keyed by locale and are projected with `field[$lang]`. Localized slugs use `slug[$lang].current`. Import generated query result types from `#sanity-types`.

## Caching Contract

- Browser responses use `Cache-Control: public, max-age=0, must-revalidate`.
- Successful content responses use one-year Netlify durable retention with must-revalidate and no additional stale window. Normal deploys invalidate cache entries; missed webhooks require monitored recovery.
- Public handlers derive anonymous live published clients with `useCdn: false` and `stega: false`, without mutating the module-wide `useCdn: true` client.
- Shared selectors tag HTML and JSON with `doc:<id>` for rendered documents/references and `collection:<type>` for membership/order dependencies. Home also declares `collection:home` because its query selects the first matching document.
- Collection pages include all rendered IDs and static collection dependencies even when empty. Query membership/sort fields must match webhook classification; localized slugs must be unique in the CMS.
- A signed Sanity webhook at `POST /api/cache/revalidate` accepts `_id`, `_type`, optional `operation` and `collectionChanged`. It purges document dependencies and conservatively collection dependencies unless a signed update explicitly says collectionChanged is false. Draft/version deliveries are ignored after authentication; purge failures return retryable 503.
- Validated preview sessions identified by the `sanity-preview-id` cookie bypass browser and CDN caching.
- Preview, cache-control, and visual-editing routes are never ISR-cached.

`useCacheTag()` merges registrations per request. Invalid dependencies or more than 500 tags disable caching without truncation; preview/error no-store is sticky. Endpoints begin with provisional no-store and enable caching only on success. Each content endpoint performs one GROQ fetch per origin execution; cache hits avoid Sanity reads and Nuxt payload hydration reuses SSR data.

## Rendering and Visual Editing

- Content pages use boolean Netlify ISR, mapped by the installed adapter to one year. Sitemap XML/index routes retain separate 86400-second ISR and module caching without document-webhook invalidation.
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
