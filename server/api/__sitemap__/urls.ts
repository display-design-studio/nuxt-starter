export default defineSitemapEventHandler(async () => {
  const sanity = useSanity()
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
