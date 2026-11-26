import type { H3Event } from 'h3'
import { setResponseHeader } from 'h3'
import { cacheProvider } from '../../shared/cache/provider'
import { addResponseCacheTags, disableResponseCache } from '../../shared/utils/responseCache'

export function setPublicCdnCache(
  event: H3Event,
  tags: readonly string[],
  options: { queryParams?: readonly string[] } = {},
) {
  if (!addResponseCacheTags(event, tags))
    return

  for (const [name, value] of Object.entries(cacheProvider.publicHeaders({ queryParams: options.queryParams })))
    setResponseHeader(event, name, value)
}

/** Only successful public endpoints may replace their provisional initial no-store. */
export function setNoStore(event: H3Event, options: { provisional?: boolean } = {}) {
  if (!options.provisional) {
    disableResponseCache(event)
    return
  }
  for (const [name, value] of Object.entries(cacheProvider.noStoreHeaders))
    setResponseHeader(event, name, value)
}
