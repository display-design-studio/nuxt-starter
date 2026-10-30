import { describe, expect, test } from 'bun:test'
import { defineEventHandler } from 'h3'
import { setNoStore, setPublicCdnCache } from '../server/utils/cdnCache'
import { isApiPath, isSanityInfrastructurePath, isStaticAssetPath } from '../server/utils/requestPaths'
import { createTestEvent, withTestGlobals } from './helpers/nitro'

describe('validated preview cache isolation', () => {
  for (const cookie of [undefined, 'invalid', 'synthetic-preview-id']) {
    test(`page cache policy for ${cookie ?? 'anonymous'} session`, async () => {
      const { event, req, res } = createTestEvent('/about')
      if (cookie)
        req.headers.cookie = `sanity-preview-id=${cookie}`
      await withTestGlobals({
        defineEventHandler,
        isApiPath,
        isStaticAssetPath,
        isSanityInfrastructurePath,
        setNoStore,
        useRuntimeConfig: () => ({
          sanity: {
            visualEditing: { previewModeId: 'synthetic-preview-id' },
          },
        }),
      }, async () => {
        const { default: middleware } = await import('../server/middleware/sanity-preview-cache')
        await middleware(event)
        setPublicCdnCache(event, ['doc:about'])
        expect(res.getHeader('Netlify-Vary')).toBe('cookie=sanity-preview-id')
        if (cookie === 'synthetic-preview-id') {
          expect(res.getHeader('Cache-Control')).toBe('no-store')
          expect(res.getHeader('Netlify-CDN-Cache-Control')).toBe('no-store')
          expect(res.getHeader('Netlify-Cache-Tag')).toBeUndefined()
        }
        else {
          expect(res.getHeader('Cache-Control')).toBe('public, max-age=0, must-revalidate')
          expect(res.getHeader('Netlify-Cache-Tag')).toBe('doc:about')
        }
      })
    })
  }

  test('preview proxy and toggle are never cacheable without a cookie', async () => {
    await withTestGlobals({
      defineEventHandler,
      isApiPath,
      isStaticAssetPath,
      isSanityInfrastructurePath,
      setNoStore,
      useRuntimeConfig: () => ({}),
    }, async () => {
      const { default: middleware } = await import('../server/middleware/sanity-preview-cache')
      for (const path of ['/preview/enable', '/preview/disable', '/_sanity/visual-editing/fetch']) {
        const { event, res } = createTestEvent(path)
        await middleware(event)
        setPublicCdnCache(event, ['doc:about'])
        expect(res.getHeader('Netlify-CDN-Cache-Control')).toBe('no-store')
        expect(res.getHeader('Netlify-Cache-Tag')).toBeUndefined()
      }
    })
  })
})
