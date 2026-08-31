import { purgeCache } from '@netlify/functions'
import { isValidSignature } from '@sanity/webhook'

/**
 * Sanity webhook handler for on-demand Netlify cache invalidation.
 * Expected body: `{ _id, _type }`.
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
  await purgeCache({ tags: [body._id, body._type] })

  return new Response('Purged successfully!', { status: 202 })
})
