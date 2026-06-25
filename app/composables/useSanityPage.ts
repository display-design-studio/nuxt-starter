import type { MaybeRef } from 'vue'
import type { PageQueryResult } from '#sanity-types'
import { toValue } from 'vue'

export function useSanityPage(params: MaybeRef<Required<SanityQueryParams>>) {
  const visualEditingState = useSanityVisualEditingState()
  const isPreview = computed(() => Boolean(visualEditingState?.enabled))

  if (isPreview.value) {
    const { data } = useSanityQuery<PageQueryResult>(
      pageQuery,
      toValue(params),
    )
    return { data }
  }

  return useFetch<PageQueryResult>('/api/sanity/page', {
    query: toValue(params),
  })
}
