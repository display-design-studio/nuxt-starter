import { setResponseHeader } from 'h3'

export function useCacheTag(tag: string | string[]) {
  if (!import.meta.server)
    return

  const event = useRequestEvent()
  if (!event)
    return

  const value = Array.isArray(tag) ? tag.join(',') : tag

  setResponseHeader(event, 'Netlify-Cache-Tag', value)
}
