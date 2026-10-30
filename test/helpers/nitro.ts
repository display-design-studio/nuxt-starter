import { IncomingMessage, ServerResponse } from 'node:http'
import { Socket } from 'node:net'
import { createEvent } from 'h3'

export function createTestEvent(url: string) {
  const req = new IncomingMessage(new Socket())
  req.url = url
  const res = new ServerResponse(req)
  return { event: createEvent(req, res), req, res }
}

/** Restore every binding, including previously absent ones, even if a test throws. */
export async function withTestGlobals<T>(bindings: Record<string, unknown>, run: () => Promise<T>) {
  const originals = Object.keys(bindings).map(name => [
    name,
    Object.getOwnPropertyDescriptor(globalThis, name),
  ] as const)

  try {
    for (const [name, value] of Object.entries(bindings))
      Object.defineProperty(globalThis, name, { configurable: true, writable: true, value })

    return await run()
  }
  finally {
    for (const [name, descriptor] of originals) {
      if (descriptor)
        Object.defineProperty(globalThis, name, descriptor)
      else
        Reflect.deleteProperty(globalThis, name)
    }
  }
}
