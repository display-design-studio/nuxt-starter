// The sitemap module owns periodic caching; each source execution reads live published routes.
export default defineSitemapEventHandler(async () => {
  const sanity = useSanity().client.withConfig({
    useCdn: false,
    perspective: 'published',
  })
  let pages: SitemapPage[]
  try {
    pages = await sanity.fetch<SitemapPage[]>(sitemapPagesQuery, {}, { stega: false })
  }
  catch (error) {
    console.error('Failed to fetch Sanity pages for the sitemap', error)
    throw createError({ statusCode: 502, statusMessage: 'Failed to fetch from Sanity' })
  }

  return buildSitemapEntries(pages)
})
