import type { HomeQueryResult } from "#build/types/sanity-typegen";
import { getQuery, setHeader } from "h3";

const browserMaxAge = 60;
const cdnMaxAge = 86400;

/**
 * Cached endpoint to fetch the Sanity home document.
 * GET /api/sanity/home
 *
 * @remarks
 * Query string parameters:
 * - `lang` (optional, default `"en"`) — locale code passed to `homeQuery` as `$lang`.
 *
 * Cache behaviour:
 * - Browser: `max-age=60` (1 minute)
 * - CDN / Nitro SWR: `s-maxage=86400, stale-while-revalidate=86400` (24 hours)
 * - Nitro cache key: `home:<lang>`
 *
 * Cache is invalidated via the Sanity webhook (`/api/cache/revalidate`)
 * or manually via `POST /api/cache/purge`.
 */
export default defineCachedEventHandler(
  async (event) => {
    const query = getQuery(event);
    const locale = typeof query.lang === "string" ? query.lang : "en";

    setHeader(
      event,
      "Cache-Control",
      `public, max-age=${browserMaxAge}, s-maxage=${cdnMaxAge}, stale-while-revalidate=${cdnMaxAge}`,
    );

    const sanity = useSanity();
    return sanity.fetch<HomeQueryResult>(
      homeQuery,
      { lang: locale },
      { stega: false },
    );
  },
  {
    maxAge: cdnMaxAge,
    getKey: (event) => {
      const query = getQuery(event);
      const locale = typeof query.lang === "string" ? query.lang : "en";
      return `home:${locale}`;
    },
  },
);
