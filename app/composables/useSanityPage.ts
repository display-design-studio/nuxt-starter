import type { PageQueryResult } from '#sanity-types'
import { type MaybeRef, toValue } from 'vue'

export const useSanityPage = (
  params: MaybeRef<Required<SanityQueryParams>>,
) => {
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
