import { purgeCache } from '@netlify/functions'

/**
 * Provider-specific tag purge. Throws on any failure (network error, non-2xx, rate limit)
 * so callers can return a retryable error instead of acknowledging success.
 */
export async function purgeCacheTags(tags: readonly string[]) {
  await purgeCache({
    tags: [...tags],
  })
}
