/** Replaced at build time with the selected provider id; keep the comparisons inline so unused SDKs are dropped. */
declare const __CACHE_PROVIDER__: string | undefined

const providerId = typeof __CACHE_PROVIDER__ === 'string'
  ? __CACHE_PROVIDER__
  : 'netlify'

/**
 * Provider-specific tag purge. Throws on any failure (network error, non-2xx, rate limit)
 * so callers can return a retryable error instead of acknowledging success.
 */
export async function purgeCacheTags(tags: readonly string[]) {
  if (providerId === 'netlify') {
    const { purgeNetlifyTags } = await import('./providers/netlify')
    return purgeNetlifyTags(tags)
  }

  throw new Error(`No cache purge implementation for provider "${providerId}"`)
}
