import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",

  devtools: { enabled: true },

  alias: {
    "#sanity-types": fileURLToPath(
      new URL("./studio/types/sanity.types.ts", import.meta.url),
    ),
  },

  runtimeConfig: {
    sanity: {
      token: process.env.NUXT_SANITY_TOKEN,
    },
    purgeSecret: process.env.NUXT_PURGE_SECRET,
    sanityWebhookSecret: process.env.NUXT_SANITY_WEBHOOK_SECRET,
  },

  css: ["/assets/css/main.css"],

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
    strategy: "prefix_except_default",
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

  sitemap: {
    sources: ["/api/__sitemap__/urls"],
  },

  routeRules: {
    "/**": {
      isr: 86400,
      headers: {
        "cache-control": "public, max-age=0, must-revalidate",
      },
    },
    "/api/sanity/**": { isr: false },
  },
});
