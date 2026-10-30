import type { H3Event } from 'h3'
import { getResponseHeader, removeResponseHeader, setResponseHeader } from 'h3'
import { normalizeCacheTags } from './cacheDependencies'
import { noStoreHeaders } from './cacheHeaders'

export function disableResponseCache(event: H3Event) {
  event.context.contentCacheDisabled = true
  event.context.nitro = event.context.nitro ?? {}
  event.context.nitro.noCache = true
  removeResponseHeader(event, 'Netlify-Cache-Tag')
  for (const [name, value] of Object.entries(noStoreHeaders))
    setResponseHeader(event, name, value)
}

export function addResponseCacheTags(event: H3Event, tags: readonly string[]) {
  if (event.context.contentCacheDisabled || event.context.nitro?.noCache) {
    disableResponseCache(event)
    return false
  }

  const previous = getResponseHeader(event, 'Netlify-Cache-Tag')
  const existing = previous === undefined
    ? []
    : String(previous).split(',')
  const normalized = normalizeCacheTags([
    ...existing,
    ...tags,
  ])
  if (!normalized || normalized.length === 0) {
    disableResponseCache(event)
    return false
  }

  setResponseHeader(event, 'Netlify-Cache-Tag', normalized.join(','))
  return true
}
