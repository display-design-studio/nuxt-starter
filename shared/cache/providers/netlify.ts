import type { CacheProviderAdapter } from '../types'
import { publicContentMaxAge } from '../../utils/cacheHeaders'

/**
 * Netlify keys its cache on the full query string by default. Restricting the key to the
 * parameters an endpoint actually reads stops tracking or random parameters from creating
 * separate entries (and separate live Sanity reads) for identical content.
 */
function queryVaryValue(params: readonly string[]) {
  return `query=${params.join('|')}`
}

export const netlifyAdapter: CacheProviderAdapter = {
  id: 'netlify',
  tagHeader: 'Netlify-Cache-Tag',
  publicHeaders: ({ queryParams } = {}) => ({
    'Cache-Control': 'public, max-age=0, must-revalidate',
    'Netlify-CDN-Cache-Control': `public, durable, max-age=${publicContentMaxAge}, must-revalidate`,
    ...(queryParams
      ? {
          'Netlify-Vary': queryVaryValue(queryParams),
        }
      : {}),
  }),
  noStoreHeaders: {
    'Cache-Control': 'no-store',
    'Netlify-CDN-Cache-Control': 'no-store',
  },
  previewVaryHeaders: cookieName => ({
    'Netlify-Vary': `cookie=${cookieName}`,
  }),
}
