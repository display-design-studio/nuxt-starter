import { defineQuery } from 'groq'
import { getDocumentCacheTags } from './cacheDependencies'

/**
 * GROQ query to fetch a single page document by slug and language.
 *
 * @remarks
 * Used by `server/api/sanity/page.get.ts` via `useSanity().fetch()`.
 * Requires two GROQ parameters:
 * - `$slug` — the page slug (matches `slug[$lang].current`, a `localeSlug` object keyed by locale)
 * - `$lang` — the locale code (selects the slug object key)
 *
 * @remarks
 * Pages have no `language` field: the locale lives in the `localeSlug` keys
 * (verified against the deployed schema).
 *
 * @returns `PageQueryResult` — full page document or `null` if not found.
 */
export const pageQuery
  = defineQuery(`*[_type == "page" && slug[$lang].current == $slug][0]{
  ...
}`)

export function getPageCacheTags(page: { _id: string }) {
  return getDocumentCacheTags([page])
}
