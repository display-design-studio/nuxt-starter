# Nuxt Starter

A Nuxt 4 full-stack starter wired to Sanity CMS, with two-layer ISR caching, i18n, and visual editing, deployed on Netlify.

## Features

- **Sanity CMS integration** via `@nuxtjs/sanity` — typed GROQ queries, visual editing (stega), preview mode
- **Two-layer caching** — browser (1h) + Netlify CDN ISR (24h), invalidated via Sanity webhook with per-document cache tags
- **i18n** via `@nuxtjs/i18n` (`prefix_except_default` strategy — default locale unprefixed)
- **SEO** via `@nuxtjs/seo` (sitemap, meta, schema.org)
- **Tailwind v4** via `@tailwindcss/vite`
- **Docker/Podman** setup for local development (`compose.yml`, `Makefile`)

## Tech Stack

| Module | Role |
|---|---|
| `@nuxtjs/sanity` | Sanity client, `useSanityQuery`, typegen, visual editing |
| `@nuxtjs/i18n` | Locale routing, `useI18n` |
| `@nuxtjs/seo` | Meta, OG, sitemap via `site.*` config |
| `@nuxt/scripts` | Third-party script loading |
| `@nuxt/a11y` | Accessibility hints |
| `@tailwindcss/vite` | Tailwind v4 via Vite plugin |

## Getting Started

```bash
bun install
cp .env.example .env   # fill in Sanity project ID, token, studio URL, secrets
bun run dev             # http://localhost:3000
```

See `STARTER.md` for the full environment variable reference.

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
GROQ query results are typed end-to-end.

## Project Structure & Data Flow

```
app/composables/        useSanity<Type>.ts — preview-aware data fetching
app/pages/               route components
server/api/sanity/       cached Nitro endpoints per document type
server/api/cache/        webhook-driven ISR revalidation
shared/utils/            GROQ query constants
studio/                  Sanity Studio (added per above, not part of this template)
```

Adding a new Sanity document type follows a 4-step pattern: GROQ query
(`shared/utils/<type>Query.ts`) → cached endpoint (`server/api/sanity/<type>.get.ts`) →
preview-aware composable (`app/composables/useSanity<Type>.ts`) → page.

See `STARTER.md` for the full architecture guide — caching internals, the composable
pattern, cache invalidation endpoints, and code examples for each step.

## Scripts

| Script | Purpose |
|---|---|
| `bun run dev` | Start the dev server |
| `bun run build` | Production build |
| `bun run generate` | Static site generation (SSG alternative) |
| `bun run preview` | Preview production build |
| `bun run lint` / `lint:fix` | ESLint check / auto-fix |

For containerized development, see `make help` (Docker/Podman via `compose.yml`).

## Deployment

Netlify-first. ISR cache is purged via `POST /api/cache/revalidate`, triggered by a
Sanity webhook, using `purgeCache()` from `@netlify/functions`.

## License

[MIT](./LICENSE)
