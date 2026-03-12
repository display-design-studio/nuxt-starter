import type { PageQueryResult } from "#sanity-types";
import { type MaybeRef, toValue } from "vue";

export const useSanityPage = (
  params: MaybeRef<{ lang: string; slug: string }>,
) => {
  const visualEditingState = useSanityVisualEditingState();
  const isPreview = computed(() => Boolean(visualEditingState?.enabled));

  if (isPreview.value) {
    return useSanityQuery<PageQueryResult>(pageQuery, toValue(params));
  }

  return useFetch<PageQueryResult>("/api/sanity/page", {
    query: () => toValue(params),
  });
};
