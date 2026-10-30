import { getRequestURL, send, setResponseHeaders, setResponseStatus } from 'h3'
import { defineNitroErrorHandler } from 'nitropack/runtime'
import { setNoStore } from './utils/cdnCache'

// Keep Nuxt's HTML error renderer; finalize API errors without its 404 no-cache override.
export default defineNitroErrorHandler(async (error, event, { defaultHandler }) => {
  if (!getRequestURL(event).pathname.startsWith('/api/'))
    return

  const response = await defaultHandler(error, event, { json: true })
  setResponseHeaders(event, response.headers)
  setResponseStatus(event, response.status, response.statusText)
  setNoStore(event)
  return send(event, JSON.stringify(response.body))
})
