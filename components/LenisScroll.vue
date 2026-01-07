<script setup>
import Lenis from "lenis";
let lenis = null;
const lenisRef = ref(null);

onMounted(() => {
  lenis = new Lenis();

  const raf = (time) => {
    lenis.raf(time);
    requestAnimationFrame(raf);
  };

  lenis.on("scroll", ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);
});

onUnmounted(() => {
  lenis.destroy();
});
</script>

<template>
  <div ref="lenisRef" id="lenis">
    <slot />
  </div>
</template>

<style>
html.lenis,
html.lenis body {
  height: auto;
}

.lenis.lenis-smooth [data-lenis-prevent] {
  overscroll-behavior: contain;
}

.lenis.lenis-stopped {
  overflow: clip;
}

.lenis.lenis-smooth iframe {
  pointer-events: none;
}
</style>
