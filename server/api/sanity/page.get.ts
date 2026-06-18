import type { PageQueryResult } from '#sanity-types'
import { getQuery, setHeader } from 'h3'

const browserMaxAge = 3600
const cdnMaxAge = 86400

/**
 * Cached endpoint to fetch a Sanity page document by slug and language.
 * GET /api/sanity/page
 *
 * @remarks
 * Query string parameters:
 * - `slug` (optional, default `""`) — page slug passed to `pageQuery` as `$slug`.
 * - `lang` (optional, default `"en"`) — locale code passed to `pageQuery` as `$lang`.
 *
 * Cache behaviour:
 * - Browser: `max-age=3600` (1 hour)
 * - CDN / Nitro SWR: `s-maxage=86400, stale-while-revalidate=86400` (24 hours)
 * - Nitro cache key: `page:<lang>:<slug>`
 *
 * Cache is invalidated via the Sanity webhook (`/api/cache/revalidate`)
 * or manually via `POST /api/cache/purge`.
 */
export default defineCachedEventHandler(
  async (event) => {
    const { lang: locale = 'en', slug = '' } = getQuery<{
      lang?: string
      slug?: string
    }>(event)

    setHeader(
      event,
      'Cache-Control',
      `public, max-age=${browserMaxAge}, s-maxage=${cdnMaxAge}, stale-while-revalidate=${cdnMaxAge}`,
    )

    const sanity = useSanity()
    return sanity.fetch<PageQueryResult>(
      pageQuery,
      { lang: locale, slug },
      { stega: false },
    )
  },
  {
    maxAge: cdnMaxAge,
    shouldBypassCache: () => import.meta.dev,
    getKey: (event) => {
      const { lang = 'en', slug = '' } = getQuery<{
        lang?: string
        slug?: string
      }>(event)
      return `page:${lang}:${slug}`
    },
  },
)
