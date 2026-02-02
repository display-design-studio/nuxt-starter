<script setup lang="ts">
import type { HomeQueryResult } from "#build/types/sanity-typegen";

const homeQuery = groq`*[_type == "home"][0]{
  _id,
}`;

const { data } = await useSanityQuery<HomeQueryResult>(homeQuery);
</script>

<template>
  <div>
    <h1>Data:</h1>
    <pre>{{ data }}</pre>
  </div>
</template>
