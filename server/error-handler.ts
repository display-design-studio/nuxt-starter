import { getRequestHeader, getRequestURL, send, setResponseHeaders, setResponseStatus } from 'h3'
import { defineNitroErrorHandler } from 'nitropack/runtime'
import { setNoStore } from './utils/cdnCache'

// Preserve Nuxt's HTML renderer while finalizing negotiated JSON errors as no-store.
export default defineNitroErrorHandler(async (error, event, { defaultHandler }) => {
  const path = getRequestURL(event).pathname
  const accept = (getRequestHeader(event, 'accept') ?? '').toLowerCase()
  const userAgent = (getRequestHeader(event, 'user-agent') ?? '').toLowerCase()
  // Match Nuxt's JSON error negotiation, including browser fetch and CLI requests.
  const jsonRequest = !accept.includes('text/html') && (
    accept.includes('application/json')
    || userAgent.includes('curl/')
    || userAgent.includes('httpie/')
    || getRequestHeader(event, 'sec-fetch-mode') === 'cors'
    || path.endsWith('.json')
  )
  if (!path.startsWith('/api/') && !jsonRequest)
    return

  const response = await defaultHandler(error, event, { json: true })
  setResponseHeaders(event, response.headers)
  setResponseStatus(event, response.status, response.statusText)
  setNoStore(event)
  return send(event, JSON.stringify(response.body))
})
