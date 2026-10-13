import { describe, expect, test } from 'bun:test'
import { DEFAULT_LOCALE, localizedPath, SUPPORTED_LOCALES } from '../shared/utils/locales'
import { buildSitemapEntries } from '../shared/utils/sitemap'

describe('locales', () => {
  test('default locale is supported and unprefixed', () => {
    expect(SUPPORTED_LOCALES).toContain(DEFAULT_LOCALE)
    expect(localizedPath(DEFAULT_LOCALE, 'about')).toBe('/about')
    expect(localizedPath('it', 'chi-siamo')).toBe('/it/chi-siamo')
  })
})

describe('sitemap entries', () => {
  test('builds one entry per active locale with a slug', () => {
    const entries = buildSitemapEntries([
      { slug: { en: { current: 'hello-world' }, it: { current: 'ciao-mondo' } } },
      { slug: { en: { current: 'about' } } },
    ])

    expect(entries).toContainEqual({ loc: '/hello-world', _sitemap: 'en' })
    expect(entries).toContainEqual({ loc: '/about', _sitemap: 'en' })
    expect(entries.every(entry => SUPPORTED_LOCALES.includes(entry._sitemap))).toBe(true)
  })

  test('skips pages without a usable slug', () => {
    expect(buildSitemapEntries([{ slug: null }, { slug: { en: null } }, {}])).toEqual([])
  })
})
