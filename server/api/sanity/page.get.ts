import type { PageQueryResult } from '#sanity-types'
import { createError } from 'h3'

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
 * - Browser: always revalidates
 * - Netlify durable CDN: 24 hours, with a 1-hour stale window
 * - Sanity API CDN: enabled for the published query
 *
 * Cache is invalidated via the Sanity webhook (`/api/cache/revalidate`).
 */
export default defineEventHandler(async (event) => {
  setNoStore(event)
  const locale = getSanityLocale(event)
  const slug = getSanitySlug(event)
  const sanity = useSanity()
  let result: PageQueryResult

  try {
    result = await sanity.fetch<PageQueryResult>(
      pageQuery,
      { lang: locale, slug },
      { stega: false },
    )
  }
  catch (error) {
    console.error('Failed to fetch a Sanity page document', error)
    throw createError({ statusCode: 502, statusMessage: 'Failed to fetch from Sanity' })
  }

  if (!result) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }

  setPublicCdnCache(event, [result._id, result._type])
  return result
})
