import { describe, expect, test } from 'bun:test'
import { isApiPath, isSanityInfrastructurePath, isStaticAssetPath } from '../server/utils/requestPaths'

describe('request path classification', () => {
  test('treats build output and common assets as static', () => {
    for (const path of [
      '/_nuxt/entry.js',
      '/_nuxt/any',
      '/logo.webp',
      '/a/b.avif',
      '/hero.JPG'.toLowerCase(),
      '/font.woff2',
      '/favicon.ico',
      '/x.js.map',
    ])
      expect(isStaticAssetPath(path)).toBe(true)
  })

  test('does not treat pages as static', () => {
    for (const path of [
      '/',
      '/hello-world',
      '/it/ciao-mondo',
      '/sitemap.xml',
    ])
      expect(isStaticAssetPath(path)).toBe(false)
  })

  test('detects API and Sanity infrastructure routes', () => {
    expect(isApiPath('/api/sanity/home')).toBe(true)
    expect(isApiPath('/apiary')).toBe(false)
    expect(isSanityInfrastructurePath('/preview/enable')).toBe(true)
    expect(isSanityInfrastructurePath('/_sanity/visual-editing/fetch')).toBe(true)
    expect(isSanityInfrastructurePath('/previews')).toBe(false)
  })
})
