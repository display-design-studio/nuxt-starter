<script setup>
  const observerRef = ref(null);
  let observer = null;
  let target = null;
  const options = {
    rootMargin: '0px 0px',
    threshold: 0.5,
  };

  const initObserver = () => {
    observer = new IntersectionObserver(onTargetEnter, options);
    target.forEach((el) => observer.observe(el));
  };

  const onTargetEnter = (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        console.log('ciao');

        switch (entry.target.dataset.animation) {
          case "observer":
            // showObserver(entry.target).animate();

            break;

          default:
            break;
        }
      }
    });
  };

  onMounted(() => {
    target = Array.from(observerRef.value.querySelectorAll("[data-animation]"));
    initObserver();
  });

  onUnmounted(() => {
    target = null
    observer.disconnect()
  })
</script>

<template>
  <div ref="observerRef">
    <slot />
  </div>
</template>
