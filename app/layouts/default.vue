<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <div>
    <NuxtLinkLocale to="/">
      {{ t('nav.home') }}
    </NuxtLinkLocale>
    <NuxtLinkLocale to="/hello-world">
      {{ t('nav.example') }}
    </NuxtLinkLocale>
    <div>
      <slot />
    </div>
  </div>
</template>
