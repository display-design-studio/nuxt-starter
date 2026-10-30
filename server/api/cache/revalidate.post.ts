import { purgeCache } from '@netlify/functions'
import { isValidSignature } from '@sanity/webhook'

/**
 * Sanity webhook handler for on-demand Netlify cache invalidation.
 * Body: `{ _id, _type, operation?, collectionChanged? }`, all covered by the signature.
 */
export default defineEventHandler(async (event) => {
  setNoStore(event)

  const rawBody = (await readRawBody(event)) ?? ''
  const signature = getHeader(event, 'sanity-webhook-signature') ?? ''
  const config = useRuntimeConfig(event)

  if (!config.sanityWebhookSecret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Sanity webhook secret is not configured',
    })
  }

  if (
    !hasFreshWebhookSignature(signature)
    || !(await isValidSignature(rawBody, signature, config.sanityWebhookSecret))
  ) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid webhook signature' })
  }

  const body = parseRevalidateBody(rawBody)
  const tags = getRevalidateCacheTags(body)
  if (tags.length === 0)
    return new Response('Ignored unpublished document', { status: 200 })

  try {
    await purgeCache({ tags })
  }
  catch {
    // The SDK throws on network errors and non-2xx responses, including 429.
    // Do not acknowledge success or expose provider errors/credentials to the caller.
    throw createError({ statusCode: 503, statusMessage: 'Cache invalidation failed' })
  }

  return new Response('Purged successfully!', { status: 202 })
})
