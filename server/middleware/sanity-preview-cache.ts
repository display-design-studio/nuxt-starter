import { getRequestURL, parseCookies, setResponseHeader } from 'h3'

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
  const isApiRoute = path.startsWith('/api/')
  const isStaticAsset = /\.(?:js|css|woff2?|ico|png|svg)$/.test(path)
  const isSanityInfrastructure
    = path.startsWith('/preview/') || path.startsWith('/_sanity/')

  if (!isApiRoute && !isStaticAsset) {
    setResponseHeader(event, 'Netlify-Vary', 'cookie=sanity-preview-id')
  }

  const config = useRuntimeConfig(event)
  const previewModeId = config.sanity?.visualEditing?.previewModeId
  const isPreview = Boolean(
    previewModeId && cookies['sanity-preview-id'] === previewModeId,
  )

  if (!isPreview && !isSanityInfrastructure)
    return

  setNoStore(event)
  event.context.nitro = event.context.nitro ?? {}
  event.context.nitro.noCache = true
})
