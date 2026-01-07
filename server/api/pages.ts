// export default defineSitemapEventHandler(async (e) => {
// const query = `*[_type == "page" && !(_id in path("drafts.**"))]{
//   "slug": {
//     "it": "/it/" + slug.it.current,
//     "en": "/en/" + slug.en.current
//   },
//   _updatedAt
// }`;
// const sanity = await useSanity();
// const products = await sanity.fetch(query);
// const result: { link: string; lastmod: string; sitemap: string }[] = [];
// products.forEach((page) => {
//   if (page.slug?.it) {
//     result.push({
//       link: page.slug.it,
//       lastmod: page._updatedAt,
//       sitemap: "it-IT",
//     });
//   }
//   if (page.slug?.en) {
//     result.push({
//       link: page.slug.en,
//       lastmod: page._updatedAt,
//       sitemap: "en-US",
//     });
//   }
// });
// return result.map((r) => ({
//   loc: r.link,
//   lastmod: r.lastmod,
//   _sitemap: r.sitemap,
// }));
// });
