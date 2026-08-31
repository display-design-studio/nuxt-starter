import { encodeSignatureHeader } from '@sanity/webhook'
import { describe, expect, test } from 'bun:test'
import {
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
})
