import { readFile } from 'node:fs/promises'
import { IncomingMessage, ServerResponse } from 'node:http'
import { Socket } from 'node:net'
import { describe, expect, test } from 'bun:test'
import { createEvent } from 'h3'
import { setNoStore, setPublicCdnCache } from '../server/utils/cdnCache'
import { publicContentMaxAge } from '../shared/utils/cacheHeaders'

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

    setPublicCdnCache(event, ['doc:home', 'doc:home', 'collection:page'])

    expect(res.getHeader('Cache-Control')).toBe('public, max-age=0, must-revalidate')
    expect(res.getHeader('Netlify-CDN-Cache-Control')).toBe(
      'public, durable, max-age=31536000, must-revalidate',
    )
    expect(res.getHeader('Netlify-Cache-Tag')).toBe('doc:home,collection:page')
  })

  test('restricts the CDN cache key to the declared query parameters', () => {
    const { event, res } = createTestEvent()

    setPublicCdnCache(event, ['doc:page'], {
      queryParams: ['lang', 'slug'],
    })

    expect(res.getHeader('Netlify-Vary')).toBe('query=lang|slug')
  })

  test('does not set a query vary when caching is disabled', () => {
    const { event, res } = createTestEvent()

    setPublicCdnCache(event, [''], {
      queryParams: ['lang'],
    })

    expect(res.getHeader('Netlify-Vary')).toBeUndefined()
  })

  test('disables caching rather than omitting invalid dependency tags', () => {
    const { event, res } = createTestEvent()

    setPublicCdnCache(event, ['', ''])

    expect(res.getHeader('Netlify-Cache-Tag')).toBeUndefined()
    expect(res.getHeader('Cache-Control')).toBe('no-store')
  })

  test('setNoStore disables browser and CDN caching', () => {
    const { event, res } = createTestEvent()

    setNoStore(event)

    expect(res.getHeader('Cache-Control')).toBe('no-store')
    expect(res.getHeader('Netlify-CDN-Cache-Control')).toBe('no-store')
  })

  test('content is still fresh after one day and matches the installed boolean ISR preset', async () => {
    expect(publicContentMaxAge).toBe(31536000)
    expect(86400 + 1 < publicContentMaxAge).toBe(true)

    const preset = await readFile(new URL(
      './dist/presets/netlify/runtime/netlify.mjs',
      import.meta.resolve('nitropack/package.json'),
    ), 'utf8')
    expect(preset).toContain('const ONE_YEAR_IN_SECONDS = 365 * 24 * 60 * 60')
    expect(preset).toContain('typeof isr === "number" ? isr : ONE_YEAR_IN_SECONDS')
    expect(preset).toContain(': "must-revalidate"')
  })
})
