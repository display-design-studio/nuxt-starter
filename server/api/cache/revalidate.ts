import { purgeCache } from '@netlify/functions'
import { isValidSignature } from '@sanity/webhook'

interface RevalidateBody {
  _id?: string
  _type?: string
  slug?: string
}

/**
 * Maps a webhook payload to the raw Nitro cache keys (see `sanityCache.ts`)
 * backing the `/api/sanity/*` endpoint that reads that document type. When a
 * new document type is added (see `arch-extension-pattern.md`), add its
 * cache key(s) here too — otherwise it inherits the same stale-cache bug
 * this handler exists to prevent.
 */
function resolveNitroCacheKeys(body: RevalidateBody): string[] {
  const { _type, slug } = body

  switch (_type) {
    case 'home':
      return SUPPORTED_LOCALES.map(lang => `home:${lang}`)
    case 'page':
      return slug ? SUPPORTED_LOCALES.map(lang => `page:${lang}:${slug}`) : []
    default:
      return []
  }
}

/**
 * Sanity webhook handler for on-demand cache invalidation.
 * POST /api/cache/revalidate
 *
 * @remarks
 * Intended to be called by a Sanity webhook (GROQ-powered HTTP trigger).
 * Authentication: HMAC-SHA256 signature verified via `@sanity/webhook`.
 *
 * Expected body: `{ _id, _type, slug? }` — the webhook projection must
 * include these fields (see `resolveNitroCacheKeys`).
 * Purges both the Netlify CDN tag for that `_id`/`_type` AND the Nitro-level
 * cache entries backing the corresponding `/api/sanity/*` endpoint(s), since
 * those are two independent caches (see `sanityCache.ts`).
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

  let body: RevalidateBody
  try {
    body = JSON.parse(rawBody)
  }
  catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid JSON body' })
  }

  const tags = [body?._id, body?._type].filter((tag): tag is string => Boolean(tag))

  await Promise.all([
    purgeCache({ tags }),
    purgeSanityCacheKeys(resolveNitroCacheKeys(body)),
  ])

  return new Response('Purged successfully!', { status: 202 })
})
