import type { HomeQueryResult } from '#sanity-types'
import { type MaybeRef, toValue } from 'vue'

export const useSanityHome = (params: MaybeRef<Pick<SanityQueryParams, 'lang'>>) => {
  const visualEditingState = useSanityVisualEditingState()
  const isPreview = computed(() => Boolean(visualEditingState?.enabled))

  if (isPreview.value) {
    return useSanityQuery<HomeQueryResult>(homeQuery, toValue(params))
  }

  return useFetch<HomeQueryResult>('/api/sanity/home', {
    query: () => toValue(params),
  })
}
