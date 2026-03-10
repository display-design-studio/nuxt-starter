import type { HomeQueryResult } from "#build/types/sanity-typegen";

export const useSanityHome = (params: { lang: string }) => {
  const visualEditingState = useSanityVisualEditingState();
  const isPreview = computed(() => Boolean(visualEditingState?.enabled));

  if (isPreview.value) {
    return useSanityQuery<HomeQueryResult>(homeQuery, params);
  }

  return useFetch<HomeQueryResult>("/api/sanity/home", {
    query: params,
  });
};
