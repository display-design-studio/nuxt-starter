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
server/api/sanity/       Netlify-cached endpoints per document type
server/api/cache/        webhook-driven ISR revalidation
shared/utils/            GROQ query constants
studio/                  Sanity Studio (added per above, not part of this template)
```

Adding a new Sanity document type follows a 4-step pattern: GROQ query
(`shared/utils/<type>Query.ts`) → Netlify-cached endpoint (`server/api/sanity/<type>.get.ts`) →
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

For containerized development, see [Local Container Development](#local-container-development).

## Deployment

Netlify-first. ISR cache is purged via `POST /api/cache/revalidate`, triggered by a
Sanity webhook, using `purgeCache()` from `@netlify/functions`.

## Template Maintenance

This repo is used as a template. The following files exist only to maintain
*this* repository and are safe to delete once you've cloned it for your own project:

- `.github/renovate.json` — Renovate bot config scoped to this template repo

## License

[MIT](./LICENSE)

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
