<script setup lang="ts">
const route = useRoute();
const { locale } = useI18n();

const params = computed(() => ({
  lang: locale.value,
  slug: route.params.slug as string,
}));

const { data: page } = await useSanityPage(params);

if (page?.value?._id) {
  useCacheTag(`${page?.value?._id}`);
}

if (!page.value) {
  throw createError({ statusCode: 404 });
}
</script>

<template>
  <div>
    <h1>Data:</h1>
    <pre>{{ page }}</pre>
  </div>
</template>
