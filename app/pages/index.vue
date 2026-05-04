<script setup lang="ts">
const { locale } = useI18n()
const params = computed(() => ({ lang: locale.value }))
const { data: home } = await useSanityHome(params)

if (home?.value?._id) {
  useCacheTag(`${home?.value?._id}`)
}
</script>

<template>
  <div>
    <h1>Data:</h1>
    <pre>{{ home }}</pre>
  </div>
</template>
