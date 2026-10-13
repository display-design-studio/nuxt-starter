/** Headers that disable both browser and Netlify CDN caching. Shared by app and server. */
export const noStoreHeaders = {
  'Cache-Control': 'no-store',
  'Netlify-CDN-Cache-Control': 'no-store',
} as const
