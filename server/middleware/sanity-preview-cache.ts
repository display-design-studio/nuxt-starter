import { getRequestURL, parseCookies, setResponseHeader } from 'h3'
import { cacheProvider } from '../../shared/cache/provider'

/**
 * Server middleware that disables caching for Sanity preview sessions.
 *
 * @remarks
 * Runs on every request before route handlers.
 *
 * Behaviour:
 * - Varies Netlify page caching only on the Sanity preview cookie.
 * - Validates the preview cookie value before bypassing page caching.
 * - Always disables caching for the module's preview/proxy routes.
 */
export default defineEventHandler((event) => {
  const cookies = parseCookies(event)
  const path = getRequestURL(event).pathname

  if (!isApiPath(path) && !isStaticAssetPath(path)) {
    for (const [name, value] of Object.entries(cacheProvider.previewVaryHeaders('sanity-preview-id')))
      setResponseHeader(event, name, value)
  }

  const config = useRuntimeConfig(event)
  // The module only augments this type when visual editing is configured
  // (token present), so read it through an explicit shape.
  const sanityConfig = config.sanity as { visualEditing?: { previewModeId?: string } } | undefined
  const previewModeId = sanityConfig?.visualEditing?.previewModeId
  const isPreview = Boolean(
    previewModeId && cookies['sanity-preview-id'] === previewModeId,
  )

  if (!isPreview && !isSanityInfrastructurePath(path))
    return

  setNoStore(event)
  event.context.nitro = event.context.nitro ?? {}
  event.context.nitro.noCache = true
})
