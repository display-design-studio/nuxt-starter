import type { MaybeRef } from 'vue'
import type { PageQueryResult } from '#sanity-types'
import { reactive, toValue } from 'vue'

export function useSanityPage(params: MaybeRef<Required<SanityQueryParams>>) {
  const visualEditingState = useSanityVisualEditingState()
  const isPreview = computed(() => Boolean(visualEditingState?.enabled))
  const previewParams = reactive({
    get lang() {
      return toValue(params).lang
    },
    get slug() {
      return toValue(params).slug
    },
  })

  if (isPreview.value) {
    return useSanityQuery<PageQueryResult>(pageQuery, previewParams)
  }

  return useFetch<PageQueryResult>('/api/sanity/page', {
    query: () => toValue(params),
  })
}
