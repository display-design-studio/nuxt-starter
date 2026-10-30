import { defineQuery } from 'groq'
import { getDocumentCacheTags } from './cacheDependencies'

/**
 * GROQ query to fetch the home document.
 *
 * @remarks
 * Used by `server/api/sanity/home.get.ts` via `useSanity().fetch()`.
 * Returns the first document of type `home` with its `_id`.
 *
 * @returns `HomeQueryResult` — single home document or `null` if not found.
 */
export const homeQuery = defineQuery(`*[_type == "home"][0]{
  _id,
  _type,
  "title": title[$lang]
}`)

export function getHomeCacheTags(home: { _id: string }) {
  return getDocumentCacheTags([home])
}
