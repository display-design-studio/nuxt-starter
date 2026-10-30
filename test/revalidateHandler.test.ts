import { Buffer } from 'node:buffer'
import * as netlify from '@netlify/functions'
import { encodeSignatureHeader } from '@sanity/webhook'
import { describe, expect, mock, test } from 'bun:test'
import { createError, defineEventHandler, getHeader, readRawBody } from 'h3'
import { setNoStore } from '../server/utils/cdnCache'
import { getRevalidateCacheTags, hasFreshWebhookSignature, parseRevalidateBody } from '../server/utils/sanityWebhook'
import { createTestEvent, withTestGlobals } from './helpers/nitro'

// Keep the real exports before mocking: mock.restore() does not undo mock.module().
const originalNetlify = { ...netlify }
const secret = 'synthetic-test-secret'
const body = JSON.stringify({ _id: 'page.test', _type: 'page' })

async function withWebhookFixture(
  rawBody: string,
  signature: string,
  run: (fixture: {
    event: ReturnType<typeof createTestEvent>['event']
    res: ReturnType<typeof createTestEvent>['res']
    purgeCache: ReturnType<typeof mock<() => Promise<void>>>
  }) => Promise<void>,
) {
  const { event, req, res } = createTestEvent('/api/cache/revalidate')
  req.method = 'POST'
  req.headers['content-type'] = 'application/json'
  req.headers['content-length'] = String(Buffer.byteLength(rawBody))
  req.headers['sanity-webhook-signature'] = signature
  req.push(rawBody)
  req.push(null)

  const purgeCache = mock(async () => {})
  mock.module('@netlify/functions', () => ({ ...originalNetlify, purgeCache }))

  try {
    await withTestGlobals({
      defineEventHandler,
      setNoStore,
      readRawBody,
      getHeader,
      createError,
      hasFreshWebhookSignature,
      parseRevalidateBody,
      getRevalidateCacheTags,
      useRuntimeConfig: () => ({ sanityWebhookSecret: secret }),
    }, async () => run({ event, res, purgeCache }))
  }
  finally {
    mock.module('@netlify/functions', () => originalNetlify)
  }
}

describe('signed cache revalidation handler', () => {
  test('legacy deliveries purge the document and collection, not other detail pages', async () => {
    const signature = await encodeSignatureHeader(body, Date.now(), secret)

    await withWebhookFixture(body, signature, async ({ event, res, purgeCache }) => {
      const { default: handler } = await import('../server/api/cache/revalidate.post')
      const response = await handler(event)

      expect(response.status).toBe(202)
      expect(purgeCache).toHaveBeenCalledTimes(1)
      expect(purgeCache).toHaveBeenCalledWith({ tags: ['doc:page.test', 'collection:page'] })
      expect(res.getHeader('Cache-Control')).toBe('no-store')
      expect(res.getHeader('Netlify-CDN-Cache-Control')).toBe('no-store')
    })
  })

  test('a signed content-only update purges its document only and can be safely repeated', async () => {
    const rawBody = JSON.stringify({ _id: 'A', _type: 'article', operation: 'update', collectionChanged: false })
    const signature = await encodeSignatureHeader(rawBody, Date.now(), secret)
    await withWebhookFixture(rawBody, signature, async ({ event, purgeCache }) => {
      const { default: handler } = await import('../server/api/cache/revalidate.post')
      expect((await handler(event)).status).toBe(202)
      expect((await handler(event)).status).toBe(202)
      expect(purgeCache).toHaveBeenCalledTimes(2)
      expect(purgeCache).toHaveBeenCalledWith({ tags: ['doc:A'] })
    })
  })

  for (const operation of ['create', 'delete'] as const) {
    test(`a signed ${operation} always invalidates collection membership`, async () => {
      const rawBody = JSON.stringify({ _id: 'A', _type: 'article', operation, collectionChanged: false })
      const signature = await encodeSignatureHeader(rawBody, Date.now(), secret)
      await withWebhookFixture(rawBody, signature, async ({ event, purgeCache }) => {
        const { default: handler } = await import('../server/api/cache/revalidate.post')
        expect((await handler(event)).status).toBe(202)
        expect(purgeCache).toHaveBeenCalledWith({ tags: ['doc:A', 'collection:article'] })
      })
    })
  }

  test('authenticated draft/version events do not purge published caches', async () => {
    for (const _id of ['drafts.A', 'versions.release.A']) {
      const rawBody = JSON.stringify({ _id, _type: 'article' })
      const signature = await encodeSignatureHeader(rawBody, Date.now(), secret)
      await withWebhookFixture(rawBody, signature, async ({ event, purgeCache }) => {
        const { default: handler } = await import('../server/api/cache/revalidate.post')
        expect((await handler(event)).status).toBe(200)
        expect(purgeCache).not.toHaveBeenCalled()
      })
    }
  })

  for (const failure of ['Network failure', 'Cache purge API call returned an unexpected status code: 429']) {
    test(`returns a retryable failure for ${failure}`, async () => {
      const signature = await encodeSignatureHeader(body, Date.now(), secret)
      await withWebhookFixture(body, signature, async ({ event, res, purgeCache }) => {
        purgeCache.mockRejectedValue(new Error(failure))
        const { default: handler } = await import('../server/api/cache/revalidate.post')
        await expect(handler(event)).rejects.toMatchObject({ statusCode: 503, statusMessage: 'Cache invalidation failed' })
        expect(purgeCache).toHaveBeenCalledTimes(1)
        expect(res.getHeader('Cache-Control')).toBe('no-store')
      })
    })
  }

  test('rejects invalid signed metadata without a purge', async () => {
    const rawBody = JSON.stringify({ _id: 'A', _type: 'article', collectionChanged: 'false' })
    const signature = await encodeSignatureHeader(rawBody, Date.now(), secret)
    await withWebhookFixture(rawBody, signature, async ({ event, purgeCache }) => {
      const { default: handler } = await import('../server/api/cache/revalidate.post')
      await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
      expect(purgeCache).not.toHaveBeenCalled()
    })
  })

  for (const kind of ['invalid', 'expired', 'tampered'] as const) {
    test(`rejects a ${kind} signature without purging`, async () => {
      const signature = kind === 'invalid'
        ? 'invalid-signature'
        : await encodeSignatureHeader(
            kind === 'tampered' ? '{}' : body,
            Date.now() - (kind === 'expired' ? 6 * 60 * 1000 : 0),
            secret,
          )

      await withWebhookFixture(body, signature, async ({ event, res, purgeCache }) => {
        const { default: handler } = await import('../server/api/cache/revalidate.post')

        await expect(handler(event)).rejects.toMatchObject({ statusCode: 401 })
        expect(purgeCache).not.toHaveBeenCalled()
        expect(res.getHeader('Cache-Control')).toBe('no-store')
        expect(res.getHeader('Netlify-CDN-Cache-Control')).toBe('no-store')
      })
    })
  }

  test('rejects a signed malformed payload without purging', async () => {
    const malformed = '{invalid'
    const signature = await encodeSignatureHeader(malformed, Date.now(), secret)

    await withWebhookFixture(malformed, signature, async ({ event, purgeCache }) => {
      const { default: handler } = await import('../server/api/cache/revalidate.post')

      await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
      expect(purgeCache).not.toHaveBeenCalled()
    })
  })

  test('restores the real Netlify export after each fixture', () => {
    expect(netlify.purgeCache).toBe(originalNetlify.purgeCache)
  })
})
