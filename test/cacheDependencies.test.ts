import { describe, expect, test } from 'bun:test'
import { collectionCacheTag, documentCacheTag, getDocumentCacheTags, normalizeCacheTags } from '../shared/utils/cacheDependencies'
import { getHomeCacheTags } from '../shared/utils/homeQuery'
import { getPageCacheTags } from '../shared/utils/pageQuery'

describe('explicit cache dependencies', () => {
  test('detail selectors do not attach blanket type dependencies', () => {
    expect(getHomeCacheTags({ _id: 'home' })).toEqual(['doc:home'])
    expect(getPageCacheTags({ _id: 'A' })).toEqual(['doc:A'])
    expect(getPageCacheTags({ _id: 'B' })).toEqual(['doc:B'])
  })

  test('a query can select rendered references and an empty collection explicitly', () => {
    expect(getDocumentCacheTags([{ _id: 'A' }, { _id: 'author' }], ['article'])).toEqual([
      'doc:A',
      'doc:author',
      'collection:article',
    ])
    expect(getDocumentCacheTags([], ['article'])).toEqual(['collection:article'])
  })

  test('validates namespaces and never silently drops invalid dependencies', () => {
    expect(documentCacheTag('page.about')).toBe('doc:page.about')
    expect(collectionCacheTag('article')).toBe('collection:article')
    for (const id of [undefined, '', 'bad,id', 'bad\r\nheader', 'drafts.A', 'versions.release.A'])
      expect(normalizeCacheTags([documentCacheTag(id)])).toBeNull()
    for (const type of ['', 'bad:type', 'bad,type'])
      expect(normalizeCacheTags([collectionCacheTag(type)])).toBeNull()
    expect(normalizeCacheTags(['article'])).toBeNull()
    expect(normalizeCacheTags(['doc:A', 'doc:A', 'collection:article'])).toEqual(['doc:A', 'collection:article'])
  })
})
