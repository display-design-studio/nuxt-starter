import type { CacheProviderAdapter } from './types'
import { netlifyAdapter } from './providers/netlify'
import { DEFAULT_CACHE_PROVIDER } from './selection'

/** Replaced at build time (Vite `define` and Nitro `replace`) with the selected provider id. */
declare const __CACHE_PROVIDER__: string | undefined

const adapters: Record<string, CacheProviderAdapter> = {
  netlify: netlifyAdapter,
}

const providerId = typeof __CACHE_PROVIDER__ === 'string'
  ? __CACHE_PROVIDER__
  : DEFAULT_CACHE_PROVIDER

const adapter = Object.hasOwn(adapters, providerId)
  ? adapters[providerId]
  : undefined
if (!adapter)
  throw new Error(`No cache adapter for provider "${providerId}"`)

export const cacheProvider: CacheProviderAdapter = adapter
