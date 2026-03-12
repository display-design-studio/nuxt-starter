import type { HomeQueryResult } from "#sanity-types";
import { type MaybeRef, toValue } from "vue";

export const useSanityHome = (params: MaybeRef<{ lang: string }>) => {
  const visualEditingState = useSanityVisualEditingState();
  const isPreview = computed(() => Boolean(visualEditingState?.enabled));

  if (isPreview.value) {
    return useSanityQuery<HomeQueryResult>(homeQuery, params);
  }

  return useFetch<HomeQueryResult>("/api/sanity/home", {
    query: computed(() => toValue(params)),
  });
};
