import { setResponseHeader } from 'h3'

export function useNoStore() {
  if (!import.meta.server)
    return

  const event = useRequestEvent()
  if (!event)
    return

  for (const [name, value] of Object.entries(noStoreHeaders))
    setResponseHeader(event, name, value)
}
