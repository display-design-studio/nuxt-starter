export const DEFAULT_CACHE_PROVIDER = 'netlify'

/** Providers with an implemented adapter. Add an entry when its adapter lands. */
const providers: Record<string, { preset: string, presetPattern: RegExp }> = {
  netlify: { preset: 'netlify', presetPattern: /^netlify/ },
}

export const supportedCacheProviders = Object.keys(providers)

export interface CacheProviderSelection {
  id: string
  /** Set only when the provider is chosen explicitly; otherwise Nitro's own preset detection is untouched. */
  preset?: string
}

/**
 * Resolve the build-time provider from `NUXT_CACHE_PROVIDER` (default `netlify`).
 * Throws on unknown providers and on an explicit `NITRO_PRESET` that contradicts the provider.
 */
export function resolveCacheProvider(env: Record<string, string | undefined>): CacheProviderSelection {
  const requested = env.NUXT_CACHE_PROVIDER?.trim()
  const explicit = Boolean(requested)
  const id = requested || DEFAULT_CACHE_PROVIDER
  const provider = Object.hasOwn(providers, id)
    ? providers[id]
    : undefined

  if (!provider) {
    throw new Error(
      `Unsupported NUXT_CACHE_PROVIDER "${id}". Supported providers: ${supportedCacheProviders.join(', ')}.`,
    )
  }

  const nitroPreset = env.NITRO_PRESET?.trim()
  if (explicit && nitroPreset && !provider.presetPattern.test(nitroPreset)) {
    throw new Error(
      `NUXT_CACHE_PROVIDER "${id}" conflicts with NITRO_PRESET "${nitroPreset}". Unset NITRO_PRESET or choose a matching provider.`,
    )
  }

  return explicit
    ? { id, preset: nitroPreset || provider.preset }
    : { id }
}
