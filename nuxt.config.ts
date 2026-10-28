import { existsSync } from 'node:fs'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { DEFAULT_LOCALE, LOCALES } from './shared/utils/locales'

const generatedSanityTypesUrl = new URL(
  './studio/types/sanity.types.ts',
  import.meta.url,
)
const fallbackSanityTypesUrl = new URL(
  './shared/types/sanity.types.ts',
  import.meta.url,
)

// Dev-only tooling lives in devDependencies and is not loaded by production builds.
const devModules = process.env.NODE_ENV === 'production'
  ? []
  : ['@nuxt/a11y', '@nuxt/eslint', '@nuxt/hints']

export default defineNuxtConfig({
  modules: [
    ...devModules,
    '@nuxt/scripts',
    '@nuxtjs/sanity',
    '@nuxtjs/i18n',
    '@nuxtjs/seo',
  ],

  devtools: { enabled: true },

  hooks: {
    // Visual editing overlay (React + @sanity/ui, ~780 kB) is only needed in
    // preview sessions: stop Nuxt from prefetching it for every visitor.
    'build:manifest': (manifest) => {
      for (const entry of Object.values(manifest)) {
        if (entry.isDynamicEntry && /visual-editing/.test(entry.src ?? ''))
          entry.prefetch = entry.preload = false
      }
    },
  },

  css: ['~/assets/css/main.css'],

  // Site URL: set `NUXT_PUBLIC_SITE_URL` (Netlify's `URL` is detected automatically).
  // Site name and description come from `nuxtSiteConfig` in `i18n/locales/*.json`.

  runtimeConfig: {
    sanityWebhookSecret: '',
  },

  alias: {
    '#sanity-types': fileURLToPath(
      existsSync(generatedSanityTypesUrl)
        ? generatedSanityTypesUrl
        : fallbackSanityTypesUrl,
    ),
  },

  routeRules: {
    '/**': {
      isr: 86400,
      headers: {
        'cache-control': 'public, max-age=0, must-revalidate',
      },
    },
    '/api/**': { isr: false },
    '/api/cache/**': {
      isr: false,
      robots: false,
      headers: {
        'cache-control': 'no-store',
      },
    },
    '/preview/**': {
      isr: false,
      robots: false,
      headers: {
        'cache-control': 'no-store',
      },
    },
    '/_sanity/**': {
      isr: false,
      robots: false,
      headers: {
        'cache-control': 'no-store',
      },
    },
  },
  compatibilityDate: '2025-07-15',

  vite: {
    plugins: [
      tailwindcss(),
    ],
  },

  i18n: {
    strategy: 'prefix_except_default',
    defaultLocale: DEFAULT_LOCALE,
    locales: LOCALES.map(({ code, name }) => ({ code, name, file: `${code}.json` })),
  },

  ogImage: {
    enabled: false,
  },

  schemaOrg: {
    enabled: false,
  },

  sanity: {
    projectId: process.env.NUXT_SANITY_PROJECT_ID,
    dataset: 'production',
    apiVersion: '2026-03-10',
    perspective: 'published',
    useCdn: true,
    visualEditing: {
      token: process.env.NUXT_SANITY_TOKEN,
      studioUrl: process.env.NUXT_SANITY_VISUAL_EDITING_STUDIO_URL,
      stega: true,
    },
  },

  sitemap: {
    sources: ['/api/__sitemap__/urls'],
    cacheMaxAgeSeconds: 86400,
  },
})
