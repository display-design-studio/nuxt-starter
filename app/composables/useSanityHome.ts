import type { MaybeRef } from 'vue'
import type { HomeQueryResult } from '#sanity-types'
import { reactive, toValue } from 'vue'

export function useSanityHome(params: MaybeRef<Pick<SanityQueryParams, 'lang'>>) {
  const visualEditingState = useSanityVisualEditingState()
  const isPreview = computed(() => Boolean(visualEditingState?.enabled))
  const previewParams = reactive({
    get lang() {
      return toValue(params).lang
    },
  })

  if (isPreview.value) {
    return useSanityQuery<HomeQueryResult>(homeQuery, previewParams)
  }

  return useFetch<HomeQueryResult>('/api/sanity/home', {
    query: () => toValue(params),
  })
}
