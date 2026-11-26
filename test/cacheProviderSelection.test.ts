import { describe, expect, test } from 'bun:test'
import { resolveCacheProvider } from '../shared/cache/selection'

describe('cache provider selection', () => {
  test('defaults to netlify without touching the Nitro preset', () => {
    expect(resolveCacheProvider({})).toEqual({ id: 'netlify' })
    expect(resolveCacheProvider({ NUXT_CACHE_PROVIDER: '  ' })).toEqual({ id: 'netlify' })
    expect(resolveCacheProvider({ NITRO_PRESET: 'node-server' })).toEqual({ id: 'netlify' })
  })

  test('an explicit provider sets its preset', () => {
    expect(resolveCacheProvider({ NUXT_CACHE_PROVIDER: 'netlify' })).toEqual({ id: 'netlify', preset: 'netlify' })
  })

  test('a matching explicit NITRO_PRESET is kept', () => {
    expect(resolveCacheProvider({ NUXT_CACHE_PROVIDER: 'netlify', NITRO_PRESET: 'netlify-edge' })).toEqual({
      id: 'netlify',
      preset: 'netlify-edge',
    })
  })

  test('rejects unknown providers and lists the supported ones', () => {
    expect(() => resolveCacheProvider({ NUXT_CACHE_PROVIDER: 'fastly' })).toThrow(/Unsupported NUXT_CACHE_PROVIDER "fastly".*netlify/)
    expect(() => resolveCacheProvider({ NUXT_CACHE_PROVIDER: 'toString' })).toThrow(/Unsupported/)
  })

  test('rejects an explicit provider that contradicts NITRO_PRESET', () => {
    expect(() => resolveCacheProvider({ NUXT_CACHE_PROVIDER: 'netlify', NITRO_PRESET: 'vercel' })).toThrow(/conflicts with NITRO_PRESET "vercel"/)
  })
})
