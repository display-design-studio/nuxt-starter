import type { PageQueryResult } from "#build/types/sanity-typegen";

export const useSanityPage = (params: { lang: string; slug: string }) => {
  const visualEditingState = useSanityVisualEditingState();
  const isPreview = computed(() => Boolean(visualEditingState?.enabled));

  if (isPreview.value) {
    return useSanityQuery<PageQueryResult>(pageQuery, params);
  }

  return useFetch<PageQueryResult>("/api/sanity/page", {
    query: params,
  });
};
