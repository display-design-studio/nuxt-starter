import { defineSitemapEventHandler } from '#imports'

// NOTE: `slug` is assumed to be a per-language object (`slug[$lang].current`),
// matching `shared/utils/pageQuery.ts` and the i18n setup (`prefix_except_default`
// with multiple locales). Verify against the real schema in `studio/` once it is
// cloned locally (see README.md) — this repo has no `studio/` folder to check against.
export default defineSitemapEventHandler(async () => {
  const sanity = useSanity()
  let pages: Array<{ slug: string, language: string }>
  try {
    pages = await sanity.fetch<Array<{ slug: string, language: string }>>(
      `*[_type == "page" && defined(slug[language].current)]{ "slug": slug[language].current, language }`,
      {},
      { stega: false },
    )
  }
  catch {
    throw createError({ statusCode: 502, statusMessage: 'Failed to fetch from Sanity' })
  }

  return pages.map(page => ({
    loc: `/${page.slug}`,
    _sitemap: page.language,
  }))
})
