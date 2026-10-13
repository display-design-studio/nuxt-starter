<script setup lang="ts">
defineProps<{
  error: {
    statusCode: number
    statusMessage?: string
    message?: string
  }
}>()

const { t } = useI18n()
const localePath = useLocalePath()

const handleError = () => clearError({ redirect: localePath('/') })
</script>

<template>
  <div>
    <h1>{{ error.statusCode }}</h1>
    <p>
      {{ error.statusCode === 404 ? t('error.notFound') : t('error.generic') }}
    </p>
    <button @click="handleError">
      {{ t('error.goHome') }}
    </button>
  </div>
</template>
