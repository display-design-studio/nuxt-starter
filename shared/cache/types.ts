export interface PublicHeadersInput {
  /** Query parameters the response depends on; all others must not fragment the CDN cache key. */
  queryParams?: readonly string[]
}

/**
 * Provider-specific, isomorphic part of the caching contract: header names and values only.
 * Everything else (tags, normalization, no-store stickiness, webhook rules) is provider-neutral.
 */
export interface CacheProviderAdapter {
  id: string
  /** Response header carrying the comma-separated dependency tags. */
  tagHeader: string
  /** Headers for a cacheable public response. */
  publicHeaders: (input?: PublicHeadersInput) => Record<string, string>
  /** Headers that disable browser and CDN caching. */
  noStoreHeaders: Readonly<Record<string, string>>
  /** Headers that keep preview-cookie requests from sharing the public cache entry. */
  previewVaryHeaders: (cookieName: string) => Record<string, string>
}
