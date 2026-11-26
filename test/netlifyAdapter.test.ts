import { describe, expect, test } from 'bun:test'
import { cacheProvider } from '../shared/cache/provider'
import { netlifyAdapter } from '../shared/cache/providers/netlify'

describe('netlify cache provider adapter', () => {
  test('is the default provider', () => {
    expect(cacheProvider).toBe(netlifyAdapter)
    expect(cacheProvider.id).toBe('netlify')
    expect(cacheProvider.tagHeader).toBe('Netlify-Cache-Tag')
  })

  test('public headers keep browser revalidation and one-year durable CDN retention', () => {
    expect(netlifyAdapter.publicHeaders()).toEqual({
      'Cache-Control': 'public, max-age=0, must-revalidate',
      'Netlify-CDN-Cache-Control': 'public, durable, max-age=31536000, must-revalidate',
    })
  })

  test('declared query parameters restrict the cache key', () => {
    expect(netlifyAdapter.publicHeaders({
      queryParams: ['lang', 'slug'],
    })['Netlify-Vary']).toBe('query=lang|slug')
    expect(netlifyAdapter.publicHeaders({
      queryParams: ['lang'],
    })['Netlify-Vary']).toBe('query=lang')
    expect('Netlify-Vary' in netlifyAdapter.publicHeaders()).toBe(false)
  })

  test('no-store disables browser and CDN caching', () => {
    expect(netlifyAdapter.noStoreHeaders).toEqual({
      'Cache-Control': 'no-store',
      'Netlify-CDN-Cache-Control': 'no-store',
    })
  })

  test('preview cookie varies the cache key', () => {
    expect(netlifyAdapter.previewVaryHeaders('sanity-preview-id')).toEqual({
      'Netlify-Vary': 'cookie=sanity-preview-id',
    })
  })
})
