import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

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

  css: ['/assets/css/main.css'],

  site: {
    url: 'https://example.com',
    name: 'My Site',
  },

  runtimeConfig: {
    sanity: {
      token: process.env.NUXT_SANITY_TOKEN,
    },
    sanityWebhookSecret: '',
  },

  alias: {
    '#sanity-types': fileURLToPath(
      new URL('./studio/types/sanity.types.ts', import.meta.url),
    ),
  },

  routeRules: {
    '/**': {
      isr: 86400,
      headers: {
        'cache-control':
          'public, max-age=0, s-maxage=31536000, stale-while-revalidate=31536000',
      },
    },
    '/api/sanity/**': { isr: false },
    '/api/cache/**': {
      isr: false,
      headers: {
        'cache-control': 'no-store',
      },
    },
  },
  compatibilityDate: '2025-07-15',

  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: [
        '@nuxtjs/sanity > @sanity/client > @sanity/visual-editing',
        '@nuxtjs/sanity > @sanity/visual-editing > @sanity/insert-menu',
        '@nuxtjs/sanity > @sanity/visual-editing > @sanity/mutate > lodash/groupBy.js', // CJS
        '@nuxtjs/sanity > @sanity/visual-editing > @sanity/ui > styled-components',
        '@nuxtjs/sanity > @sanity/visual-editing > @sanity/visual-editing > react-is', // CJS
        '@nuxtjs/sanity > @sanity/visual-editing > react', // CJS
        '@nuxtjs/sanity > @sanity/visual-editing > react-compiler-runtime', // CJS
        '@nuxtjs/sanity > @sanity/visual-editing > react-dom', // CJS
        '@nuxtjs/sanity > @sanity/visual-editing > react-dom/client', // CJS
        '@nuxtjs/sanity > @sanity/visual-editing > react/jsx-runtime', // CJS
        '@sanity/client',
        '@unhead/schema-org/vue',
        '@vue/devtools-core',
        '@vue/devtools-kit',
        'groq',
      ],
    },
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
    cacheMaxAgeSeconds: 604800,
  },
})
