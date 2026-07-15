import { purgeCache } from '@netlify/functions'
import { isValidSignature } from '@sanity/webhook'

/**
 * Sanity webhook handler for on-demand cache invalidation.
 * POST /api/cache/revalidate
 *
 * @remarks
 * Intended to be called by a Sanity webhook (GROQ-powered HTTP trigger).
 * Authentication: HMAC-SHA256 signature verified via `@sanity/webhook`.
 *
 * Expected body: `{ _id: string }` — the Sanity document ID that was updated.
 * Performs a granular Netlify CDN tag purge for that `_id` and `_type`.
 *
 * @returns 202 response with plain-text body `"Purged successfully!"`
 */
export default defineEventHandler(async (event) => {
  const rawBody = (await readRawBody(event)) ?? ''
  const signature = getHeader(event, 'sanity-webhook-signature') ?? ''
  const config = useRuntimeConfig()

  if (!config.sanityWebhookSecret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Sanity webhook secret is not configured',
    })
  }

  if (
    !(await isValidSignature(rawBody, signature, config.sanityWebhookSecret))
  ) {
    throw createError({ statusCode: 401 })
  }

  let body: { _id?: string, _type?: string }
  try {
    body = JSON.parse(rawBody)
  }
  catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid JSON body' })
  }

  const tags = [body?._id, body?._type].filter(Boolean)
  await purgeCache({ tags })
  return new Response('Purged successfully!', { status: 202 })
})
