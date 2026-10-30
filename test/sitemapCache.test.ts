import { describe, expect, test } from 'bun:test'
import { getSitemapCacheRouteRules } from '../shared/utils/sitemapCache'

function virtualConfig(config: object) {
  return `export default ${JSON.stringify(config)}`
}

describe('sitemap retention exceptions from resolved module metadata', () => {
  test('resolves the current single locale names and keeps content routes out', () => {
    const rules = getSitemapCacheRouteRules(virtualConfig({
      sitemapName: 'sitemap.xml',
      isMultiSitemap: true,
      sitemapsPathPrefix: '/__sitemap__',
      sitemaps: {
        index: { _route: '/sitemap_index.xml' },
        en: { _route: '/__sitemap__/en.xml' },
      },
    }))
    expect(rules).toEqual({
      '/sitemap.xml': { isr: 86400 },
      '/sitemap_index.xml': { isr: 86400 },
      '/__sitemap__/**': { isr: 86400 },
      '/__sitemap__/en.xml': { isr: 86400 },
    })
    expect(rules['/**']).toBeUndefined()
    expect(rules['/api/__sitemap__/urls']).toBeUndefined()
  })

  test('covers synthetic multiple locales, custom prefix and root named maps', () => {
    for (const prefix of ['/maps', false] as const) {
      const path = prefix || ''
      const rules = getSitemapCacheRouteRules(virtualConfig({
        sitemapName: 'sitemap.xml',
        isMultiSitemap: true,
        sitemapsPathPrefix: prefix,
        sitemaps: {
          en: { _route: `${path}/en.xml` },
          it: { _route: `${path}/it.xml` },
        },
      }))
      expect(rules[`${path}/en.xml`]).toEqual({ isr: 86400 })
      expect(rules[`${path}/it.xml`]).toEqual({ isr: 86400 })
      expect(rules['/sitemap_index.xml']).toEqual({ isr: 86400 })
      expect(rules['/**']).toBeUndefined()
    }
  })

  test('covers a custom single sitemap and fails visibly on incompatible module metadata', () => {
    expect(getSitemapCacheRouteRules(virtualConfig({
      sitemapName: 'custom-map.xml',
      isMultiSitemap: false,
      sitemaps: {
        main: { route: '/custom-map.xml' },
      },
    }))).toEqual({
      '/custom-map.xml': { isr: 86400 },
    })
    expect(() => getSitemapCacheRouteRules('not a static export')).toThrow()
  })
})
