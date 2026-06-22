import { defineQuery } from 'groq'

/**
 * GROQ query to fetch a single page document by slug and language.
 *
 * @remarks
 * Used by `server/api/sanity/page.get.ts` via `useSanity().fetch()`.
 * Requires two GROQ parameters:
 * - `$slug` — the page slug (matches `slug.current`)
 * - `$lang` — the locale code (matches `language`)
 *
 * @returns `PageQueryResult` — full page document or `null` if not found.
 */
export const pageQuery
  = defineQuery(`*[_type == "page" && slug[$lang].current == $slug && language == $lang][0]{
  ...
}`)
