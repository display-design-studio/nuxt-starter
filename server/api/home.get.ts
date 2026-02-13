import type { HomeQueryResult } from "#build/types/sanity-typegen";

export default defineEventHandler(() => {
  const homeQuery = defineQuery(`*[_type == "home"][0]{
    _id,
  }`);

  return useSanity().fetch<HomeQueryResult>(homeQuery);
});
