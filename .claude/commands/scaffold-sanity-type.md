Scaffold the full 4-file pattern for a new Sanity document type in this project.

The user will pass a PascalCase type name as the argument (e.g. `Article`, `Project`, `BlogPost`). Derive the camelCase and kebab-case variants from it.

## Files to create

Use the existing `page` type as the reference pattern. All 4 files must exactly follow these conventions:

### 1. `shared/utils/<camelCase>Query.ts`

Model: `shared/utils/pageQuery.ts`

```ts
import { defineQuery } from 'groq'

export const <camelCase>Query = defineQuery(`*[_type == "<camelCase>" && slug.current == $slug && language == $lang][0]{
  _id,
  _type,
  // add your fields here
}`)
```

If the type has no slug (e.g. a singleton), omit the `slug.current == $slug` filter and use `[0]`.

### 2. `server/api/sanity/<camelCase>.get.ts`

Model: `server/api/sanity/page.get.ts`

- Import `<TypeName>QueryResult` from `#sanity-types`
- Import `SanityQueryParams` from `~/shared/utils/queryParams`
- Import `createError, getQuery, setHeader` from `h3`
- Use `getQuery<SanityQueryParams>(event)` — destructure `lang` and `slug` with defaults
- Set `Cache-Control` header with `browserMaxAge` / `cdnMaxAge` constants
- Fetch with `useSanity().fetch<TypeNameQueryResult>(<camelCase>Query, { lang, slug }, { stega: false })`
- Throw `createError({ statusCode: 404, statusMessage: 'Not Found' })` if result is null
- `getKey` returns `` `<camelCase>:${lang}:${slug}` ``

### 3. `app/composables/useSanity<TypeName>.ts`

Model: `app/composables/useSanityPage.ts`

- Import `<TypeName>QueryResult` from `#sanity-types`
- Import `SanityQueryParams` from `~/shared/utils/queryParams`
- Param type: `MaybeRef<Required<SanityQueryParams>>` (or `Pick<SanityQueryParams, 'lang'>` for singletons)
- Preview branch: `useSanityQuery<TypeNameQueryResult>(<camelCase>Query, toValue(params))`
- Production branch: `useFetch<TypeNameQueryResult>('/api/sanity/<camelCase>', { query: toValue(params) })`

### 4. `app/pages/<kebab-case>.vue` (ask the user if they want this)

If yes:
```vue
<script setup lang="ts">
const route = useRoute()
const { locale } = useI18n()

const params = computed(() => ({
  lang: locale.value,
  slug: route.params.slug as string,
}))

const { data: <camelCase> } = await useSanity<TypeName>(params)

if (<camelCase>.value?._id) {
  useCacheTag(`${<camelCase>.value._id}`)
}

if (!<camelCase>.value) {
  throw createError({ statusCode: 404 })
}
</script>

<template>
  <div>
    <pre>{{ <camelCase> }}</pre>
  </div>
</template>
```

## After creating files

Remind the user to:
1. Add the corresponding Sanity schema type and run `bun run typegen` to generate `<TypeName>QueryResult` in `studio/types/sanity.types.ts`
2. Register the new page route in the sitemap endpoint (`server/api/__sitemap__/urls.ts`) if the type should appear in the sitemap
