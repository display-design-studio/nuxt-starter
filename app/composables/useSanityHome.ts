import type { MaybeRef } from 'vue'
import type { HomeQueryResult } from '#sanity-types'
import { toValue } from 'vue'

export function useSanityHome(params: MaybeRef<Pick<SanityQueryParams, 'lang'>>) {
  const visualEditingState = useSanityVisualEditingState()
  const isPreview = computed(() => Boolean(visualEditingState?.enabled))

  if (isPreview.value) {
    return useSanityQuery<HomeQueryResult>(homeQuery, toValue(params))
  }

  return useFetch<HomeQueryResult>('/api/sanity/home', {
    query: () => toValue(params),
  })
}
