<script setup lang="ts">
const route = useRoute()
const { locale } = useI18n()

const params = computed(() => ({
  lang: locale.value,
  slug: route.params.slug as string,
}))

const { data: page, error } = await useSanityPage(params)

if (error.value || !page.value) {
  useNoStore()
  const statusCode = error.value
    && typeof error.value === 'object'
    && 'statusCode' in error.value
    ? Number(error.value.statusCode)
    : 404

  throw createError({
    statusCode,
    statusMessage: statusCode === 404 ? 'Page not found' : 'Failed to load page content',
  })
}

useCacheTag([page.value._id, page.value._type])
</script>

<template>
  <div>
    <h1>Data:</h1>
    <pre>{{ page }}</pre>
  </div>
</template>
