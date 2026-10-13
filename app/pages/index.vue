<script setup lang="ts">
const { locale } = useI18n()
const params = computed(() => ({ lang: locale.value }))
const { data: home, error } = await useSanityHome(params)

if (error.value || !home.value) {
  useNoStore()
  throw createError({
    statusCode: error.value ? 502 : 404,
    statusMessage: error.value ? 'Failed to load home content' : 'Home not found',
  })
}

useCacheTag([home.value._id, home.value._type])
</script>

<template>
  <div>
    <h1>{{ home.title }}</h1>
    <h2>
      Data:
    </h2>
    <pre>{{ home }} </pre>
  </div>
</template>
