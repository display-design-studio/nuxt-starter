import { addResponseCacheTags } from '~~/shared/utils/responseCache'

export function useCacheTag(tag: string | string[]) {
  if (!import.meta.server)
    return

  const event = useRequestEvent()
  if (!event)
    return

  addResponseCacheTags(event, Array.isArray(tag)
    ? tag
    : [tag])
}
