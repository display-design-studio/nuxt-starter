import { netlifyAdapter } from './providers/netlify'

/** The single selection point for the cache provider (build-time selection arrives with NUXT_CACHE_PROVIDER). */
export const cacheProvider = netlifyAdapter
