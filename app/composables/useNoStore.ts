import { setResponseHeader } from 'h3'

export function useNoStore() {
  if (!import.meta.server)
    return

  const event = useRequestEvent()
  if (!event)
    return

  setResponseHeader(event, 'Cache-Control', 'no-store')
  setResponseHeader(event, 'Netlify-CDN-Cache-Control', 'no-store')
}
