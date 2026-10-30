/** Matches boolean ISR in the Netlify preset; this is not eternal storage. */
export const publicContentMaxAge = 365 * 24 * 60 * 60

export const publicContentCacheHeaders = {
  'Cache-Control': 'public, max-age=0, must-revalidate',
  'Netlify-CDN-Cache-Control': `public, durable, max-age=${publicContentMaxAge}, must-revalidate`,
} as const

/** Headers that disable both browser and Netlify CDN caching. Shared by app and server. */
export const noStoreHeaders = {
  'Cache-Control': 'no-store',
  'Netlify-CDN-Cache-Control': 'no-store',
} as const
