import { disableResponseCache } from '~~/shared/utils/responseCache'

export function useNoStore() {
  if (!import.meta.server)
    return

  const event = useRequestEvent()
  if (!event)
    return

  disableResponseCache(event)
}
