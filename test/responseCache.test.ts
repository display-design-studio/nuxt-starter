import { describe, expect, test } from 'bun:test'
import { setResponseHeader } from 'h3'
import { setNoStore, setPublicCdnCache } from '../server/utils/cdnCache'
import { addResponseCacheTags, disableResponseCache } from '../shared/utils/responseCache'
import { createTestEvent } from './helpers/nitro'

describe('request-local response dependencies', () => {
  test('merges layout, page, footer and API registrations without replacing earlier tags', () => {
    for (const registrations of [
      [['doc:layout'], ['doc:page', 'doc:layout'], ['doc:footer']],
      [['doc:footer'], ['doc:page', 'doc:layout'], ['doc:layout']],
    ]) {
      const { event, res } = createTestEvent('/')
      for (const tags of registrations)
        addResponseCacheTags(event, tags)
      setPublicCdnCache(event, ['doc:page'])
      expect(String(res.getHeader('Netlify-Cache-Tag')).split(',').sort()).toEqual([
        'doc:footer',
        'doc:layout',
        'doc:page',
      ])
    }
  })

  test('never shares registrations across requests', () => {
    const first = createTestEvent('/A')
    const second = createTestEvent('/B')
    addResponseCacheTags(first.event, ['doc:A'])
    addResponseCacheTags(second.event, ['doc:B'])
    expect(first.res.getHeader('Netlify-Cache-Tag')).toBe('doc:A')
    expect(second.res.getHeader('Netlify-Cache-Tag')).toBe('doc:B')
  })

  test('accepts exactly 500 unique tags but disables caching on the 501st', () => {
    const { event, res } = createTestEvent('/')
    const tags = Array.from({ length: 500 }, (_, i) => `doc:item-${i}`)
    setPublicCdnCache(event, tags)
    expect(res.getHeader('Cache-Control')).toBe('public, max-age=0, must-revalidate')
    addResponseCacheTags(event, ['doc:overflow'])
    setPublicCdnCache(event, ['doc:later'])
    expect(res.getHeader('Cache-Control')).toBe('no-store')
    expect(res.getHeader('Netlify-CDN-Cache-Control')).toBe('no-store')
    expect(res.getHeader('Netlify-Cache-Tag')).toBeUndefined()
    expect(event.context.nitro.noCache).toBe(true)
  })

  test('invalid new or existing tags cannot produce a partially cached response', () => {
    for (const invalid of ['', 'page', 'doc:bad,id', `doc:${'a'.repeat(1025)}`]) {
      const { event, res } = createTestEvent('/')
      addResponseCacheTags(event, ['doc:valid'])
      addResponseCacheTags(event, [invalid])
      setPublicCdnCache(event, ['doc:later'])
      expect(res.getHeader('Netlify-Cache-Tag')).toBeUndefined()
      expect(res.getHeader('Netlify-CDN-Cache-Control')).toBe('no-store')
    }
    const { event, res } = createTestEvent('/')
    setResponseHeader(event, 'Netlify-Cache-Tag', 'untrusted')
    setPublicCdnCache(event, ['doc:valid'])
    expect(res.getHeader('Netlify-CDN-Cache-Control')).toBe('no-store')
  })

  test('preview and final error no-store decisions win over later public helpers', () => {
    for (const reason of ['preview', 'error', 'page-error']) {
      const { event, res } = createTestEvent('/')
      if (reason === 'preview')
        event.context.nitro = { noCache: true }
      else if (reason === 'error')
        setNoStore(event)
      else
        disableResponseCache(event)
      setNoStore(event, { provisional: true })
      setPublicCdnCache(event, ['doc:A'])
      addResponseCacheTags(event, ['doc:B'])
      expect(res.getHeader('Cache-Control')).toBe('no-store')
      expect(res.getHeader('Netlify-CDN-Cache-Control')).toBe('no-store')
      expect(res.getHeader('Netlify-Cache-Tag')).toBeUndefined()
    }
  })

  test('a successful endpoint can replace only its provisional no-store', () => {
    const { event, res } = createTestEvent('/api/sanity/home')
    setNoStore(event, { provisional: true })
    setPublicCdnCache(event, ['doc:home'])
    expect(res.getHeader('Cache-Control')).toBe('public, max-age=0, must-revalidate')
  })
})
