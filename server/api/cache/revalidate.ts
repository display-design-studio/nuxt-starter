import { purgeCache } from "@netlify/functions";

/**
 * Sanity webhook handler for on-demand cache invalidation.
 * POST /api/cache/revalidate
 *
 * @remarks
 * Intended to be called by a Sanity webhook (GROQ-powered HTTP trigger).
 * Authentication: `X-Sanity-Webhook-Secret` header must match `NUXT_SANITY_WEBHOOK_SECRET`.
 *
 * Expected body: `{ _id: string }` — the Sanity document ID that was updated.
 * Performs a granular Netlify CDN tag purge for that `_id`, then clears the
 * Nitro storage cache layer.
 *
 * For manual/emergency cache purges, use `POST /api/cache/purge` instead.
 *
 * @returns 202 response with plain-text body `"Purged successfully!"`
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const config = useRuntimeConfig();
  if (
    event.headers.get("X-Sanity-Webhook-Secret") !== config.sanityWebhookSecret
  ) {
    throw createError({ statusCode: 401 });
  }

  await purgeCache({ tags: [body?._id] });
  const storage = useStorage("cache");
  await storage.clear();
  return new Response("Purged successfully!", { status: 202 });
});
