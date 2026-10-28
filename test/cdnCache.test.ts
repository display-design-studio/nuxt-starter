import { IncomingMessage, ServerResponse } from 'node:http'
import { Socket } from 'node:net'
import { describe, expect, test } from 'bun:test'
import { createEvent } from 'h3'
import { setNoStore, setPublicCdnCache } from '../server/utils/cdnCache'

function createTestEvent() {
  const req = new IncomingMessage(new Socket())
  const res = new ServerResponse(req)
  return {
    event: createEvent(req, res),
    res,
  }
}

describe('CDN cache headers', () => {
  test('sets durable Netlify cache with deduplicated tags', () => {
    const { event, res } = createTestEvent()

    setPublicCdnCache(event, ['home', 'home', '', 'page'])

    expect(res.getHeader('Cache-Control')).toBe('public, max-age=0, must-revalidate')
    expect(res.getHeader('Netlify-CDN-Cache-Control')).toBe(
      'public, durable, max-age=86400, stale-while-revalidate=3600',
    )
    expect(res.getHeader('Netlify-Cache-Tag')).toBe('home,page')
  })

  test('omits the cache tag header when there are no tags', () => {
    const { event, res } = createTestEvent()

    setPublicCdnCache(event, ['', ''])

    expect(res.getHeader('Netlify-Cache-Tag')).toBeUndefined()
  })

  test('setNoStore disables browser and CDN caching', () => {
    const { event, res } = createTestEvent()

    setNoStore(event)

    expect(res.getHeader('Cache-Control')).toBe('no-store')
    expect(res.getHeader('Netlify-CDN-Cache-Control')).toBe('no-store')
  })
})
