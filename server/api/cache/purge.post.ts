import { purgeCache } from "@netlify/functions";

/**
 * Manual cache invalidation endpoint.
 * POST /api/cache/purge
 *
 * @remarks
 * Alternative to the Sanity webhook (`/api/cache/revalidate`).
 * Useful for deploy scripts or emergency cache resets.
 *
 * Authentication: `x-purge-secret` header must match `NUXT_PURGE_SECRET`.
 *
 * Optional body: `{ _id?: string }` — if provided, performs a granular
 * Netlify CDN tag purge for that document ID. If omitted, purges the
 * entire CDN cache. In both cases the Nitro storage cache is also cleared.
 *
 * @returns 202 response with plain-text body `"Purged successfully!"`
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  if (event.headers.get("x-purge-secret") !== config.purgeSecret) {
    throw createError({ statusCode: 401 });
  }

  const body = await readBody(event).catch(() => ({}));

  if (body?._id) {
    await purgeCache({ tags: [body._id] });
    await useStorage("cache").clear();
  } else {
    await purgeCache();
    const storage = useStorage("cache");
    await storage.clear();
  }

  return new Response("Purged successfully!", { status: 202 });
});
