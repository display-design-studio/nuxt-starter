import { describe, expect, test } from 'bun:test'
import { getRevalidateCacheTags } from '../server/utils/sanityWebhook'
import { getDocumentCacheTags } from '../shared/utils/cacheDependencies'
import { getHomeCacheTags } from '../shared/utils/homeQuery'
import { getPageCacheTags } from '../shared/utils/pageQuery'

// Test-only index: Netlify owns the real storage and reverse tag index.
function seedResponses(dependencies: Record<string, string[]>) {
  return new Map(Object.entries(dependencies).flatMap(([path, tags]) =>
    ['html', 'json'].map(format => [
      `${path}.${format}`,
      new Set(tags),
    ] as const),
  ))
}

function purge(cache: ReturnType<typeof seedResponses>, tags: string[]) {
  for (const [key, dependencies] of cache) {
    if (tags.some(tag => dependencies.has(tag)))
      cache.delete(key)
  }
}

describe('synthetic article and blog-home dependency index', () => {
  test('publishing another home invalidates the cached first-document selection', () => {
    const cache = seedResponses({
      home: getHomeCacheTags({ _id: 'old-home' }),
      A: getPageCacheTags({ _id: 'A' }),
    })
    purge(cache, getRevalidateCacheTags({ _id: 'new-home', _type: 'home', operation: 'create' }))
    expect([
      ...cache.keys(),
    ]).toEqual(['A.html', 'A.json'])
  })
  test('a content-only A publication invalidates A/home HTML and JSON, not B or other listings', () => {
    const cache = seedResponses({
      A: getPageCacheTags({ _id: 'A' }),
      B: getPageCacheTags({ _id: 'B' }),
      home: getDocumentCacheTags([
        { _id: 'home' },
        { _id: 'A' },
        { _id: 'B' },
      ], ['article']),
      otherListing: getDocumentCacheTags([
        { _id: 'other' },
      ], ['article']),
    })
    purge(cache, getRevalidateCacheTags({
      _id: 'A',
      _type: 'article',
      operation: 'update',
      collectionChanged: false,
    }))
    expect([
      ...cache.keys(),
    ].sort()).toEqual([
      'B.html',
      'B.json',
      'otherListing.html',
      'otherListing.json',
    ])
  })

  test('first publication or membership/order changes reach empty and previously unrelated lists', () => {
    const cache = seedResponses({
      A: getPageCacheTags({ _id: 'A' }),
      emptyHome: getDocumentCacheTags([
        { _id: 'home' },
      ], ['article']),
      listing: getDocumentCacheTags([
        { _id: 'listing' },
        { _id: 'A' },
      ], ['article']),
      products: getDocumentCacheTags([], ['product']),
    })
    purge(cache, getRevalidateCacheTags({ _id: 'new-article', _type: 'article', operation: 'create' }))
    expect([
      ...cache.keys(),
    ].sort()).toEqual([
      'A.html',
      'A.json',
      'products.html',
      'products.json',
    ])
  })

  test('a rendered reference invalidates only its dependents', () => {
    const cache = seedResponses({
      A: getDocumentCacheTags([
        { _id: 'A' },
        { _id: 'author' },
      ]),
      B: getPageCacheTags({ _id: 'B' }),
      home: getDocumentCacheTags([
        { _id: 'home' },
        { _id: 'A' },
        { _id: 'author' },
      ], ['article']),
    })
    purge(cache, getRevalidateCacheTags({
      _id: 'author',
      _type: 'author',
      operation: 'update',
      collectionChanged: false,
    }))
    expect([
      ...cache.keys(),
    ]).toEqual(['B.html', 'B.json'])
  })

  test('unpublish or slug changes remove old routes and listing entries, not other details', () => {
    const cache = seedResponses({
      '/blog/old-slug': getPageCacheTags({ _id: 'A' }),
      '/blog/B': getPageCacheTags({ _id: 'B' }),
      '/blog': getDocumentCacheTags([
        { _id: 'home' },
        { _id: 'A' },
      ], ['article']),
    })
    purge(cache, getRevalidateCacheTags({ _id: 'A', _type: 'article', operation: 'delete' }))
    expect([
      ...cache.keys(),
    ]).toEqual(['/blog/B.html', '/blog/B.json'])
  })
})
