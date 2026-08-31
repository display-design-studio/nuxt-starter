import { existsSync } from 'node:fs'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'

const generatedSanityTypesUrl = new URL(
  './studio/types/sanity.types.ts',
  import.meta.url,
)
const fallbackSanityTypesUrl = new URL(
  './shared/types/sanity.types.ts',
  import.meta.url,
)

export default defineNuxtConfig({
  modules: [
    '@nuxt/a11y',
    '@nuxt/eslint',
    '@nuxt/hints',
    '@nuxt/scripts',
    '@nuxtjs/sanity',
    '@nuxtjs/i18n',
    '@nuxtjs/seo',
  ],

  devtools: { enabled: true },

  css: ['~/assets/css/main.css'],

  site: {
    url: 'https://example.com',
    name: 'My Site',
  },

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
    plugins: [tailwindcss()],
  },

  eslint: {
    config: {
      stylistic: {
        indent: 2,
        quotes: 'single',
        semi: false,
        commaDangle: 'always-multiline',
        braceStyle: 'stroustrup',
      },
    },
  },

  i18n: {
    strategy: 'prefix_except_default',
    defaultLocale: 'en',
    locales: [
      { code: 'en', name: 'English', file: 'en.json' },
      // { code: "it", name: "Italian", file: "it.json" },
    ],
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
    cacheMaxAgeSeconds: 300,
  },
})
