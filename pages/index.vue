<script setup>
definePageMeta({
  pageTransition,
});
</script>

<template>
  <main class="flex h-screen items-center justify-center bg-black">
    <NuxtLink to="/about">
      <span
        class="absolute top-1/2 h-[20px] w-[20px] -translate-x-1/2 -translate-y-1/2 animate-pulse bg-white"
      />
    </NuxtLink>
  </main>
</template>
