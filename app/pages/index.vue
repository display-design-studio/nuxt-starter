<script setup lang="ts">
const { data } = await useFetch("/api/home");
</script>

<template>
  <div>
    <h1>Data:</h1>
    <pre>{{ data }}</pre>
  </div>
</template>
