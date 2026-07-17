/**
 * Nitro's `defineCachedEventHandler` composes its storage key as
 * `[base, group, name, escapeKey(customKey) + '.json'].join(':')`, with
 * `escapeKey = (k) => k.replace(/\W/g, '')` (see
 * nitropack/dist/runtime/internal/cache.mjs). That composition is an
 * internal implementation detail, not a public API — pinning `base`/`group`/
 * `name` here (instead of relying on Nitro's defaults) lets `revalidate.ts`
 * reconstruct the exact same storage key to purge on webhook events. Re-check
 * this if Nitro's cache internals change on upgrade.
 */
const CACHE_BASE = '/cache'
const CACHE_GROUP = 'sanity'
const CACHE_NAME = 'sanity'

export const sanityCacheOpts = {
  base: CACHE_BASE,
  group: CACHE_GROUP,
  name: CACHE_NAME,
}

/** Mirror `i18n.locales` in `nuxt.config.ts` — add `'it'` here if it's re-enabled there. */
export const SUPPORTED_LOCALES = ['en'] as const

function toStorageKey(key: string) {
  return [CACHE_BASE, CACHE_GROUP, CACHE_NAME, `${key.replace(/\W/g, '')}.json`].join(':')
}

export async function purgeSanityCacheKeys(keys: string[]) {
  const storage = useStorage()
  await Promise.all(keys.map(key => storage.removeItem(toStorageKey(key))))
}
