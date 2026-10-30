export interface CacheDocument { _id: unknown }

export const maxCacheTags = 500

export function isSanityDocumentId(value: unknown): value is string {
  return typeof value === 'string' && /^[\w.-]{1,256}$/.test(value)
}

export function isSanityDocumentType(value: unknown): value is string {
  return typeof value === 'string' && /^[\w-]{1,128}$/.test(value)
}

export function isDraftDocumentId(id: string) {
  return id.startsWith('drafts.') || id.startsWith('versions.')
}

/** Invalid input is retained as an invalid tag so callers can disable caching, not truncate it. */
export function documentCacheTag(id: unknown) {
  return isSanityDocumentId(id) && !isDraftDocumentId(id) ? `doc:${id}` : ''
}

export function collectionCacheTag(type: unknown) {
  return isSanityDocumentType(type) ? `collection:${type}` : ''
}

export function getDocumentCacheTags(documents: readonly CacheDocument[], collections: readonly string[] = []) {
  return [
    ...documents.map(document => documentCacheTag(document._id)),
    ...collections.map(collectionCacheTag),
  ]
}

/** Null means unsafe/incomplete dependencies: never cache a truncated tag set. */
export function normalizeCacheTags(tags: readonly string[]): string[] | null {
  const unique = [...new Set(tags)]
  if (unique.length > maxCacheTags)
    return null

  for (const tag of unique) {
    if (typeof tag !== 'string' || tag.length > 1024)
      return null
    if (tag.startsWith('doc:') && documentCacheTag(tag.slice(4)) === tag)
      continue
    if (tag.startsWith('collection:') && collectionCacheTag(tag.slice(11)) === tag)
      continue
    return null
  }

  return unique
}
