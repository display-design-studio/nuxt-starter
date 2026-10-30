import type { HomeQueryResult } from '#sanity-types'
import { createError } from 'h3'

/**
 * Cached endpoint to fetch the Sanity home document.
 * GET /api/sanity/home
 *
 * @remarks
 * Query string parameters:
 * - `lang` (optional, default `"en"`) — locale code passed to `homeQuery` as `$lang`.
 *
 * Cache behaviour:
 * - Browser: always revalidates
 * - Netlify durable CDN: on-demand invalidation, one-year provider retention bound
 * - Sanity origin: live published API, anonymous and without stega encoding
 *
 * Cache is invalidated via the Sanity webhook (`/api/cache/revalidate`).
 */
export default defineEventHandler(async (event) => {
  setNoStore(event, { provisional: true })
  const locale = getSanityLocale(event)
  const sanity = useSanity(event).client.withConfig({
    useCdn: false,
    perspective: 'published',
  })
  let result: HomeQueryResult

  try {
    result = await sanity.fetch<HomeQueryResult>(
      homeQuery,
      { lang: locale },
      { stega: false },
    )
  }
  catch (error) {
    console.error('Failed to fetch the Sanity home document', error)
    throw createError({ statusCode: 502, statusMessage: 'Failed to fetch from Sanity' })
  }

  if (!result) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }

  setPublicCdnCache(event, getHomeCacheTags(result))
  return result
})
