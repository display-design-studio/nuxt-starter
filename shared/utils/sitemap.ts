import { defineQuery } from 'groq'
import { localizedPath, SUPPORTED_LOCALES } from './locales'

/**
 * GROQ query to fetch the per-language slugs of every page.
 *
 * @remarks
 * Used by `server/api/__sitemap__/urls.ts`. `slug` is a `localeSlug` object
 * keyed by locale (`slug.en.current`); pages have no `language` field.
 */
export const sitemapPagesQuery = defineQuery(`*[_type == "page" && defined(slug)]{
  slug
}`)

export interface SitemapPage {
  slug?: Record<string, { current?: string } | null | undefined> | null
}

/** One sitemap entry per page and active locale that has a slug. */
export function buildSitemapEntries(pages: SitemapPage[]) {
  return pages.flatMap(({ slug }) =>
    SUPPORTED_LOCALES.flatMap((language) => {
      const current = slug?.[language]?.current
      return current
        ? [
            {
              loc: localizedPath(language, current),
              _sitemap: language,
            },
          ]
        : []
    }),
  )
}
