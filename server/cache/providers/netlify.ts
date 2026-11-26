import { purgeCache } from '@netlify/functions'

export async function purgeNetlifyTags(tags: readonly string[]) {
  await purgeCache({
    tags: [...tags],
  })
}
