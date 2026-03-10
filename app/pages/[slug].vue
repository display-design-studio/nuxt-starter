<script setup lang="ts">
const route = useRoute();
const { locale } = useI18n();

const { data: page } = await useSanityPage({
  lang: locale.value,
  slug: route.params.slug as string,
});

if (page.value?._id) {
  useCacheTag(`${page.value._id}`);
}
</script>

<template>
  <div>
    <h1>Data:</h1>
    <pre>{{ page }}</pre>
  </div>
</template>
