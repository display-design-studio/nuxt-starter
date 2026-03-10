import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",

  devtools: { enabled: true },

  runtimeConfig: {
    sanity: {
      token: process.env.NUXT_SANITY_TOKEN,
    },
    purgeSecret: process.env.NUXT_PURGE_SECRET,
  },

  css: ["./app/assets/css/main.css"],

  vite: {
    plugins: [tailwindcss()],
  },

  modules: [
    "@nuxt/a11y",
    "@nuxt/eslint",
    "@nuxt/hints",
    "@nuxt/scripts",
    "@nuxtjs/sanity",
    "@nuxtjs/i18n",
    "@nuxtjs/seo",
  ],

  site: {
    url: "https://example.com",
    name: "My Site",
  },

  i18n: {
    defaultLocale: "en",
    locales: [
      { code: "en", name: "English", file: "en.json" },
      { code: "it", name: "Italian", file: "it.json" },
    ],
  },

  sanity: {
    projectId: process.env.SANITY_PROJECT_ID,
    dataset: "production",
    apiVersion: "2026-03-10",
    perspective: "published",
    useCdn: true,
    // typegen: {
    //   enabled: true,
    //   schemaTypesPath: "./studio/schemaTypes/index.ts",
    //   queryPaths: [
    //     "server/sanity/queries/**/*.{ts,js,mjs}",
    //     "app/**/*.{vue,ts,js,mjs}",
    //   ],
    // },
    visualEditing: {
      token: process.env.NUXT_SANITY_TOKEN,
      studioUrl: process.env.NUXT_SANITY_VISUAL_EDITING_STUDIO_URL,
      stega: true,
    },
  },

  routeRules: {
    "/**": {
      swr: 86400,
      headers: {
        "cache-control":
          "public, max-age=60, s-maxage=86400, stale-while-revalidate=86400",
      },
    },
    "/api/**": { swr: false },
  },
});
