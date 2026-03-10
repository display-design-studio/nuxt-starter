<script setup lang="ts">
const { locale } = useI18n();
const { data: home } = await useSanityHome({ lang: locale.value });

if (home.value?._id) {
  useCacheTag(`${home.value._id}`);
}
</script>

<template>
  <div>
    <h1>Data:</h1>
    <pre>{{ home }}</pre>
  </div>
</template>
