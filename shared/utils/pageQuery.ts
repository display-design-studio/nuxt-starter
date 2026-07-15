import { defineQuery } from 'groq'

/**
 * GROQ query to fetch a single page document by slug and language.
 *
 * @remarks
 * Used by `server/api/sanity/page.get.ts` via `useSanity().fetch()`.
 * Requires two GROQ parameters:
 * - `$slug` — the page slug (matches `slug[$lang].current`, a per-language slug object)
 * - `$lang` — the locale code (matches `language`, and selects the slug object key)
 *
 * @remarks
 * NOTE: `slug` is assumed to be a per-language object keyed by locale
 * (`slug[$lang].current`), consistent with `server/api/__sitemap__/urls.ts`
 * and the i18n setup (`prefix_except_default` with multiple locales).
 * Verify this against the real schema in `studio/` once it is cloned
 * locally (see README.md) — this repo has no `studio/` folder to check
 * against.
 *
 * @returns `PageQueryResult` — full page document or `null` if not found.
 */
export const pageQuery
  = defineQuery(`*[_type == "page" && slug[$lang].current == $slug && language == $lang][0]{
  ...
}`)
