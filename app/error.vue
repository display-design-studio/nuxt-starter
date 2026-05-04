<script setup lang="ts">
defineProps<{
  error: {
    statusCode: number
    statusMessage?: string
    message?: string
  }
}>()

const handleError = () => clearError({ redirect: '/' })
</script>

<template>
  <div>
    <h1>{{ error.statusCode }}</h1>
    <p>
      {{ error.statusCode === 404 ? "Page not found" : "An error occurred" }}
    </p>
    <button @click="handleError">
      Go home
    </button>
  </div>
</template>
