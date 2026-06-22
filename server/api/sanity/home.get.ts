import type { HomeQueryResult } from '#sanity-types'
import type { SanityQueryParams } from '~/shared/utils/queryParams'
import { createError, getQuery, setHeader } from 'h3'

const browserMaxAge = 3600
const cdnMaxAge = 86400

/**
 * Cached endpoint to fetch the Sanity home document.
 * GET /api/sanity/home
 *
 * @remarks
 * Query string parameters:
 * - `lang` (optional, default `"en"`) — locale code passed to `homeQuery` as `$lang`.
 *
 * Cache behaviour:
 * - Browser: `max-age=3600` (1 hour)
 * - CDN / Nitro SWR: `s-maxage=86400, stale-while-revalidate=86400` (24 hours)
 * - Nitro cache key: `home:<lang>`
 *
 * Cache is invalidated via the Sanity webhook (`/api/cache/revalidate`)
 * or manually via `POST /api/cache/purge`.
 */
export default defineCachedEventHandler(
  async (event) => {
    const { lang: locale = 'en' } = getQuery<Pick<SanityQueryParams, 'lang'>>(event)

    setHeader(
      event,
      'Cache-Control',
      `public, max-age=${browserMaxAge}, s-maxage=${cdnMaxAge}, stale-while-revalidate=${cdnMaxAge}`,
    )

    const sanity = useSanity()
    const result = await sanity.fetch<HomeQueryResult>(
      homeQuery,
      { lang: locale },
      { stega: false },
    )

    if (!result) throw createError({ statusCode: 404, statusMessage: 'Not Found' })
    return result
  },
  {
    maxAge: cdnMaxAge,
    shouldBypassCache: () => import.meta.dev,
    getKey: (event) => {
      const { lang: locale = 'en' } = getQuery<Pick<SanityQueryParams, 'lang'>>(event)
      return `home:${locale}`
    },
  },
)
