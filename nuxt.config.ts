export default defineNuxtConfig({
  devtools: { enabled: true },
  compatibilityDate: "2024-04-03",
  modules: [
    "@nuxtjs/tailwindcss",
    "@nuxtjs/seo",
    "@nuxtjs/i18n",
    "@nuxtjs/sanity",
    "gsap-nuxt-module",
  ],
  tailwindcss: {
    viewer: false,
  },
  site: {
    url: "https://nuxt.com/",
  },
  seo: {
    fallbackTitle: false,
  },
  sitemap: {
    enabled: false,
    // sources: ["/api/pages"],
  },
  robots: {
    allow: "/",
    disallow: [],
  },
  i18n: {
    locales: [
      {
        code: "it",
        file: "it-IT.json",
        language: "it-IT",
      },
    ],
    lazy: true,
    defaultLocale: "it",
    strategy: "prefix_and_default",
    baseUrl: "https://nuxt.com/",
    bundle: {
      optimizeTranslationDirective: false,
    },
  },
  sanity: {
    projectId: "xrn5spf3",
    dataset: "production",
    apiVersion: "2025-01-01",
    useCdn: true,
    // visualEditing: {
    //   token: process.env.NUXT_SANITY_TOKEN,
    //   studioUrl: "https://YOUR_STUDIO.sanity.studio/",
    //   stega: true,
    // },
  },
});
