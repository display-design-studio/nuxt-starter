import type { H3Event } from 'h3'
import { setResponseHeader } from 'h3'

const netlifyMaxAge = 86400
const netlifyStaleWhileRevalidate = 3600

export function setPublicCdnCache(event: H3Event, tags: string[]) {
  const uniqueTags = [...new Set(tags.filter(Boolean))]

  setResponseHeader(event, 'Cache-Control', 'public, max-age=0, must-revalidate')
  setResponseHeader(
    event,
    'Netlify-CDN-Cache-Control',
    `public, durable, max-age=${netlifyMaxAge}, stale-while-revalidate=${netlifyStaleWhileRevalidate}`,
  )

  if (uniqueTags.length > 0)
    setResponseHeader(event, 'Netlify-Cache-Tag', uniqueTags.join(','))
}

export function setNoStore(event: H3Event) {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  setResponseHeader(event, 'Netlify-CDN-Cache-Control', 'no-store')
}
