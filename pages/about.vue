<script setup>
const { transitionState } = usePageTransition();
const spanRef = ref(null);

definePageMeta({
  pageTransition,
});

watch(transitionState, (newValue) => {
  if (newValue.transitionComplete) {
    gsap.to(spanRef.value, {
      rotateZ: 360,
      duration: 1,
    });
  }
});
</script>

<template>
  <main class="flex h-screen items-center justify-start bg-white">
    <NuxtLink to="/">
      <span
        ref="spanRef"
        class="absolute left-1/2 top-1/2 h-[20px] w-[20px] -translate-x-1/2 -translate-y-1/2 animate-pulse bg-black"
      />
    </NuxtLink>
  </main>
</template>
