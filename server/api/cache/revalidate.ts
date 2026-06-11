import { purgeCache } from "@netlify/functions";
import { isValidSignature } from "@sanity/webhook";

/**
 * Sanity webhook handler for on-demand cache invalidation.
 * POST /api/cache/revalidate
 *
 * @remarks
 * Intended to be called by a Sanity webhook (GROQ-powered HTTP trigger).
 * Authentication: HMAC-SHA256 signature verified via `@sanity/webhook`.
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
  const rawBody = (await readRawBody(event)) ?? "";
  const signature = getHeader(event, "sanity-webhook-signature") ?? "";
  const config = useRuntimeConfig();

  if (!config.sanityWebhookSecret) {
    throw createError({
      statusCode: 500,
      statusMessage: "Sanity webhook secret is not configured",
    });
  }

  if (
    !(await isValidSignature(rawBody, signature, config.sanityWebhookSecret))
  ) {
    throw createError({ statusCode: 401 });
  }

  const body = JSON.parse(rawBody);
  const tags = [body?._id, body?._type].filter(Boolean);
  await purgeCache({ tags });
  await useStorage("cache").clear();
  return new Response("Purged successfully!", { status: 202 });
});
