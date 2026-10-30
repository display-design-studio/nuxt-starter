import { encodeSignatureHeader } from '@sanity/webhook'
import { describe, expect, test } from 'bun:test'
import {
  getRevalidateCacheTags,
  hasFreshWebhookSignature,
  parseRevalidateBody,
} from '../server/utils/sanityWebhook'

describe('Sanity webhook validation', () => {
  test('accepts the configured document payload shape', () => {
    expect(parseRevalidateBody('{"_id":"page.about-us","_type":"page"}')).toEqual({
      _id: 'page.about-us',
      _type: 'page',
    })
  })

  test('rejects missing and malformed document identifiers', () => {
    expect(() => parseRevalidateBody('{}')).toThrow()
    expect(() => parseRevalidateBody('{"_id":"page/about","_type":"page"}')).toThrow()
    expect(() => parseRevalidateBody('{invalid')).toThrow()
  })

  test('accepts recent signatures and rejects stale signatures', async () => {
    const now = Date.now()
    const recent = await encodeSignatureHeader('{}', now, 'test-secret')
    const stale = await encodeSignatureHeader('{}', now - 6 * 60 * 1000, 'test-secret')

    expect(hasFreshWebhookSignature(recent, now)).toBe(true)
    expect(hasFreshWebhookSignature(stale, now)).toBe(false)
    expect(hasFreshWebhookSignature('invalid', now)).toBe(false)
  })

  test('classifies signed-body metadata without trusting arbitrary raw tags', () => {
    const legacy = { _id: 'A', _type: 'article' }
    expect(getRevalidateCacheTags(parseRevalidateBody(JSON.stringify(legacy)))).toEqual(['doc:A', 'collection:article'])
    expect(getRevalidateCacheTags(parseRevalidateBody(JSON.stringify({
      ...legacy,
      operation: 'update',
      collectionChanged: false,
      tags: ['*', 'doc:B'],
    })))).toEqual(['doc:A'])
    expect(getRevalidateCacheTags({ ...legacy, operation: 'update', collectionChanged: true })).toEqual(['doc:A', 'collection:article'])
    expect(getRevalidateCacheTags({ ...legacy, collectionChanged: false })).toEqual(['doc:A', 'collection:article'])
    expect(getRevalidateCacheTags({ ...legacy, operation: 'update' })).toEqual(['doc:A', 'collection:article'])
    for (const operation of ['create', 'delete'] as const)
      expect(getRevalidateCacheTags({ ...legacy, operation, collectionChanged: false })).toEqual(['doc:A', 'collection:article'])
  })

  test('rejects invalid metadata and document identifiers', () => {
    for (const metadata of [
      { operation: 'publish' },
      { operation: null },
      { collectionChanged: 'false' },
      { collectionChanged: null },
    ]) {
      expect(() => parseRevalidateBody(JSON.stringify({ _id: 'A', _type: 'article', ...metadata }))).toThrow()
    }
    expect(() => parseRevalidateBody(JSON.stringify({ _id: 'A'.repeat(257), _type: 'article' }))).toThrow()
    expect(() => parseRevalidateBody(JSON.stringify({ _id: 'A', _type: 'article:bad' }))).toThrow()
  })

  test('draft and version deliveries cannot invalidate published content', () => {
    for (const _id of ['drafts.A', 'versions.release.A'])
      expect(getRevalidateCacheTags(parseRevalidateBody(JSON.stringify({ _id, _type: 'article' })))).toEqual([])
  })
})
