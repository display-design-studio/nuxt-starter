import { defineSitemapEventHandler } from "#imports";

export default defineSitemapEventHandler(async () => {
  const sanity = useSanity();
  const pages = await sanity.fetch<Array<{ slug: string; language: string }>>(
    `*[_type == "page" && defined(slug.current)]{ "slug": slug.current, language }`,
    {},
    { stega: false }
  );

  return pages.map((page) => ({
    loc: `/${page.slug}`,
    _sitemap: page.language,
  }));
});
