import type { ClientConfig, SanityClient } from '@sanity/client'
import type { H3Event } from 'h3'
import { createClient } from '@sanity/client'
import { describe, expect, mock, spyOn, test } from 'bun:test'
import { createError, defineEventHandler } from 'h3'
import { setNoStore, setPublicCdnCache } from '../server/utils/cdnCache'
import { getSanityLocale, getSanitySlug } from '../server/utils/sanityParams'
import { getHomeCacheTags, homeQuery } from '../shared/utils/homeQuery'
import { getPageCacheTags, pageQuery } from '../shared/utils/pageQuery'
import { buildSitemapEntries, sitemapPagesQuery } from '../shared/utils/sitemap'
import { createTestEvent, withTestGlobals } from './helpers/nitro'

function createSanityFixture(result: unknown) {
  const baseClient = createClient({
    projectId: 'test-project',
    dataset: 'production',
    apiVersion: '2026-03-10',
    perspective: 'published',
    useCdn: true,
  })
  const fetchLive = mock(async () => result)
  const originalConfig = baseClient.config()
  const fetchCdn = mock(async (): Promise<unknown> => ({ _id: 'old', _type: 'page', title: 'Stale CDN' }))
  const derivedClients: SanityClient[] = []
  const withConfig = mock((config: ClientConfig) => {
    const client = baseClient.withConfig(config)
    client.fetch = fetchLive as typeof client.fetch
    derivedClients.push(client)
    return client
  })
  const useSanity = mock((_event: H3Event) => ({
    client: { withConfig, fetch: fetchCdn },
    fetch: fetchCdn,
  }))

  return {
    baseClient,
    originalConfig,
    derivedClients,
    fetchLive,
    fetchCdn,
    withConfig,
    useSanity,
    bindings: {
      defineEventHandler,
      defineSitemapEventHandler: defineEventHandler,
      createError,
      setNoStore,
      setPublicCdnCache,
      getSanityLocale,
      getSanitySlug,
      homeQuery,
      pageQuery,
      getHomeCacheTags,
      getPageCacheTags,
      sitemapPagesQuery,
      buildSitemapEntries,
      useSanity,
    },
  }
}

const endpoints = [
  {
    name: 'home',
    url: '/api/sanity/home?lang=en',
    query: homeQuery,
    params: { lang: 'en' },
    load: () => import('../server/api/sanity/home.get'),
  },
  {
    name: 'page',
    url: '/api/sanity/page?lang=en&slug=about',
    query: pageQuery,
    params: { lang: 'en', slug: 'about' },
    load: () => import('../server/api/sanity/page.get'),
  },
] as const

describe('published Sanity origin reads', () => {
  for (const endpoint of endpoints) {
    test(`${endpoint.name} returns the live revision rather than the stale CDN revision`, async () => {
      const result = { _id: `${endpoint.name}.test`, _type: endpoint.name, title: 'Live revision' }
      const fixture = createSanityFixture(result)
      const { event, req, res } = createTestEvent(endpoint.url)
      req.headers.cookie = 'sanity-preview-id=untrusted-preview'

      await withTestGlobals(fixture.bindings, async () => {
        const { default: handler } = await endpoint.load()
        expect(await handler(event)).toEqual(result)
      })

      expect(fixture.useSanity).toHaveBeenCalledWith(event)
      expect(fixture.withConfig).toHaveBeenCalledWith({ useCdn: false, perspective: 'published' })
      expect(fixture.fetchLive).toHaveBeenCalledWith(endpoint.query, endpoint.params, { stega: false })
      expect(fixture.fetchLive).toHaveBeenCalledTimes(1)
      expect(fixture.fetchCdn).not.toHaveBeenCalled()
      expect(fixture.derivedClients[0]?.config().useCdn).toBe(false)
      expect(fixture.derivedClients[0]?.config().perspective).toBe('published')
      expect(fixture.derivedClients[0]?.config().token).toBeUndefined()
      expect(fixture.baseClient.config()).toEqual(fixture.originalConfig)
      expect(res.getHeader('Cache-Control')).toBe('public, max-age=0, must-revalidate')
      expect(res.getHeader('Netlify-CDN-Cache-Control')).toBe(
        'public, durable, max-age=31536000, must-revalidate',
      )
      const pageTags = endpoint.name === 'home'
        ? getHomeCacheTags(result)
        : getPageCacheTags(result)
      expect(res.getHeader('Netlify-Cache-Tag')).toBe(pageTags.join(','))
      expect(pageTags).toEqual(endpoint.name === 'home'
        ? [`doc:${result._id}`, 'collection:home']
        : [`doc:${result._id}`])
    })

    test(`${endpoint.name} rejects invalid parameters before reading Sanity`, async () => {
      const path = `/api/sanity/${endpoint.name}`
      const invalidQueries = [
        'lang=it&slug=about',
        'lang=en&lang=it&slug=about',
        'lang=&slug=about',
        ...(endpoint.name === 'page'
          ? [
              'lang=en',
              'lang=en&slug=',
              'slug=nested%2Fpage',
              'slug=about&slug=other',
            ]
          : []),
      ]

      for (const query of invalidQueries) {
        const fixture = createSanityFixture(null)
        const { event, res } = createTestEvent(`${path}?${query}`)

        await withTestGlobals(fixture.bindings, async () => {
          const { default: handler } = await endpoint.load()
          await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
        })

        expect(fixture.useSanity).not.toHaveBeenCalled()
        expect(fixture.fetchLive).not.toHaveBeenCalled()
        expect(fixture.fetchCdn).not.toHaveBeenCalled()
        expect(res.getHeader('Cache-Control')).toBe('no-store')
        expect(res.getHeader('Netlify-CDN-Cache-Control')).toBe('no-store')
        expect(res.getHeader('Netlify-Cache-Tag')).toBeUndefined()
      }
    })

    test(`${endpoint.name} returns a non-cacheable 404 for absent live content`, async () => {
      const fixture = createSanityFixture(null)
      const { event, res } = createTestEvent(endpoint.url)

      await withTestGlobals(fixture.bindings, async () => {
        const { default: handler } = await endpoint.load()
        await expect(handler(event)).rejects.toMatchObject({ statusCode: 404 })
      })

      expect(fixture.fetchLive).toHaveBeenCalledTimes(1)
      expect(fixture.fetchCdn).not.toHaveBeenCalled()
      expect(fixture.baseClient.config()).toEqual(fixture.originalConfig)
      expect(res.getHeader('Cache-Control')).toBe('no-store')
      expect(res.getHeader('Netlify-CDN-Cache-Control')).toBe('no-store')
      expect(res.getHeader('Netlify-Cache-Tag')).toBeUndefined()
    })

    test(`${endpoint.name} returns a non-cacheable 502 without a CDN fallback`, async () => {
      const fixture = createSanityFixture(null)
      fixture.fetchLive.mockRejectedValue(new Error('Synthetic upstream failure'))
      const { event, res } = createTestEvent(endpoint.url)
      const logError = spyOn(console, 'error').mockImplementation(() => {})

      try {
        await withTestGlobals(fixture.bindings, async () => {
          const { default: handler } = await endpoint.load()
          await expect(handler(event)).rejects.toMatchObject({ statusCode: 502 })
        })
      }
      finally {
        logError.mockRestore()
      }

      expect(fixture.fetchLive).toHaveBeenCalledTimes(1)
      expect(fixture.fetchCdn).not.toHaveBeenCalled()
      expect(fixture.baseClient.config()).toEqual(fixture.originalConfig)
      expect(res.getHeader('Cache-Control')).toBe('no-store')
      expect(res.getHeader('Netlify-CDN-Cache-Control')).toBe('no-store')
      expect(res.getHeader('Netlify-Cache-Tag')).toBeUndefined()
    })
  }

  test('the sitemap source returns live localized slugs without mutating the module client', async () => {
    const fixture = createSanityFixture([
      {
        slug: {
          en: { current: 'live-slug' },
          it: { current: 'slug-it' },
        },
      },
      { slug: null },
    ])
    fixture.fetchCdn.mockResolvedValue([
      {
        slug: {
          en: { current: 'stale-slug' },
        },
      },
    ])
    const { event, req, res } = createTestEvent('/api/__sitemap__/urls')
    req.headers.cookie = 'sanity-preview-id=untrusted-preview'

    await withTestGlobals(fixture.bindings, async () => {
      const { default: handler } = await import('../server/api/__sitemap__/urls')
      expect(await handler(event)).toEqual([
        { loc: '/live-slug', _sitemap: 'en' },
      ])
    })

    expect(fixture.useSanity).toHaveBeenCalledWith()
    expect(fixture.withConfig).toHaveBeenCalledWith({ useCdn: false, perspective: 'published' })
    expect(fixture.fetchLive).toHaveBeenCalledWith(sitemapPagesQuery, {}, { stega: false })
    expect(fixture.fetchCdn).not.toHaveBeenCalled()
    expect(fixture.derivedClients[0]?.config().useCdn).toBe(false)
    expect(fixture.derivedClients[0]?.config().perspective).toBe('published')
    expect(fixture.derivedClients[0]?.config().token).toBeUndefined()
    expect(fixture.baseClient.config()).toEqual(fixture.originalConfig)
    expect(res.getHeader('Netlify-Cache-Tag')).toBeUndefined()
  })

  test('the sitemap source returns 502 rather than a successful empty list on upstream failure', async () => {
    const fixture = createSanityFixture([])
    fixture.fetchLive.mockRejectedValue(new Error('Synthetic sitemap upstream failure'))
    const { event } = createTestEvent('/api/__sitemap__/urls')
    const logError = spyOn(console, 'error').mockImplementation(() => {})

    try {
      await withTestGlobals(fixture.bindings, async () => {
        const { default: handler } = await import('../server/api/__sitemap__/urls')
        await expect(handler(event)).rejects.toMatchObject({ statusCode: 502 })
      })
    }
    finally {
      logError.mockRestore()
    }

    expect(fixture.fetchLive).toHaveBeenCalledTimes(1)
    expect(fixture.fetchCdn).not.toHaveBeenCalled()
    expect(fixture.baseClient.config()).toEqual(fixture.originalConfig)
  })

  test('the harness restores globals after success and failure', async () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'useSanity')

    await withTestGlobals({ useSanity: 'outer' }, async () => {
      await expect(withTestGlobals({ useSanity: 'inner' }, async () => {
        throw new Error('Synthetic test failure')
      })).rejects.toThrow('Synthetic test failure')
      expect(Reflect.get(globalThis, 'useSanity')).toBe('outer')
    })

    expect(Object.getOwnPropertyDescriptor(globalThis, 'useSanity')).toEqual(original)
  })
})
