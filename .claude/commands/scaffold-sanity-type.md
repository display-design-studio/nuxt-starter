Scaffold the full 4-file pattern for a new Sanity document type.

**Always respond in English. Be token-efficient: no explanations, no options — just create the files.**

## Step 0: Check the schema

Before generating files, try to read `studio/schemaTypes/documents/<camelCase>.ts`:

- **If found**: extract all field names and types. Use them in the generated query projection instead of `// add your fields here`. Note the slug type (`localeSlug` → use `slug[$lang].current`; plain `slug` → use `slug.current`).
- **If not found**: proceed with `// add your fields here` placeholder and note in the output that the schema wasn't found.

## Input format

The user passes a PascalCase type name, optionally followed by `singleton`:
- `MagazineArticle` → slug-based
- `Magazine singleton` → singleton (no slug filter)

Derive camelCase and kebab-case from the PascalCase name.

## Two patterns

### Singleton (model: `home`)

Used when the type has no slug (e.g. a settings page, magazine index).

**`shared/utils/<camelCase>Query.ts`**
```ts
import { defineQuery } from 'groq'

/**
 * GROQ query to fetch the <camelCase> document.
 *
 * @remarks
 * Used by `server/api/sanity/<camelCase>.get.ts` via `useSanity().fetch()`.
 * Returns the first document of type `<camelCase>` with its `_id`.
 *
 * @returns `<TypeName>QueryResult` — single document or `null` if not found.
 */
export const <camelCase>Query = defineQuery(`*[_type == "<camelCase>"][0]{
  _id,
  // add your fields here
}`)
```

**`server/api/sanity/<camelCase>.get.ts`**
```ts
import type { <TypeName>QueryResult } from '#sanity-types'
import type { SanityQueryParams } from '~/shared/utils/queryParams'
import { createError, getQuery, setHeader } from 'h3'

const browserMaxAge = 3600
const cdnMaxAge = 86400

/**
 * Cached endpoint to fetch the Sanity <camelCase> document.
 * GET /api/sanity/<camelCase>
 *
 * @remarks
 * Query string parameters:
 * - `lang` (optional, default `"en"`) — locale code passed to `<camelCase>Query` as `$lang`.
 *
 * Cache behaviour:
 * - Browser: `max-age=3600` (1 hour)
 * - CDN / Nitro SWR: `s-maxage=86400, stale-while-revalidate=86400` (24 hours)
 * - Nitro cache key: `<camelCase>:<lang>`
 *
 * Cache is invalidated via the Sanity webhook (`/api/cache/revalidate`)
 * or manually via `POST /api/cache/purge`.
 */
export default defineCachedEventHandler(
  async (event) => {
    const { lang: locale = 'en' } = getQuery<Pick<SanityQueryParams, 'lang'>>(event)

    setHeader(
      event,
      'Cache-Control',
      `public, max-age=${browserMaxAge}, s-maxage=${cdnMaxAge}, stale-while-revalidate=${cdnMaxAge}`,
    )

    const sanity = useSanity()
    const result = await sanity.fetch<<TypeName>QueryResult>(
      <camelCase>Query,
      { lang: locale },
      { stega: false },
    )

    if (!result) throw createError({ statusCode: 404, statusMessage: 'Not Found' })
    return result
  },
  {
    maxAge: cdnMaxAge,
    shouldBypassCache: () => import.meta.dev,
    getKey: (event) => {
      const { lang: locale = 'en' } = getQuery<Pick<SanityQueryParams, 'lang'>>(event)
      return `<camelCase>:${locale}`
    },
  },
)
```

**`app/composables/useSanity<TypeName>.ts`**
```ts
import type { <TypeName>QueryResult } from '#sanity-types'
import { type MaybeRef, toValue } from 'vue'

export const useSanity<TypeName> = (params: MaybeRef<Pick<SanityQueryParams, 'lang'>>) => {
  const visualEditingState = useSanityVisualEditingState()
  const isPreview = computed(() => Boolean(visualEditingState?.enabled))

  if (isPreview.value) {
    return useSanityQuery<<TypeName>QueryResult>(<camelCase>Query, toValue(params))
  }

  return useFetch<<TypeName>QueryResult>('/api/sanity/<camelCase>', {
    query: () => toValue(params),
  })
}
```

**`app/pages/<kebab-case>.vue`**
```vue
<script setup lang="ts">
const { locale } = useI18n()
const params = computed(() => ({ lang: locale.value }))
const { data: <camelCase> } = await useSanity<TypeName>(params)

if (<camelCase>?.value?._id) {
  useCacheTag(`${<camelCase>.value._id}`)
}
</script>

<template>
  <div>
    <pre>{{ <camelCase> }}</pre>
  </div>
</template>
```

---

### Slug-based (model: `page`)

Used when the type is resolved by slug (articles, projects, etc.).

**`shared/utils/<camelCase>Query.ts`**
```ts
import { defineQuery } from 'groq'

/**
 * GROQ query to fetch a single <camelCase> document by slug and language.
 *
 * @remarks
 * Used by `server/api/sanity/<camelCase>.get.ts` via `useSanity().fetch()`.
 * Requires two GROQ parameters:
 * - `$slug` — the document slug (matches `slug[$lang].current`)
 * - `$lang` — the locale code (matches `language`)
 *
 * @returns `<TypeName>QueryResult` — full document or `null` if not found.
 */
export const <camelCase>Query = defineQuery(`*[_type == "<camelCase>" && slug[$lang].current == $slug && language == $lang][0]{
  _id,
  _type,
  // add your fields here
}`)
```

**`server/api/sanity/<camelCase>.get.ts`**
```ts
import type { <TypeName>QueryResult } from '#sanity-types'
import type { SanityQueryParams } from '~/shared/utils/queryParams'
import { createError, getQuery, setHeader } from 'h3'

const browserMaxAge = 3600
const cdnMaxAge = 86400

/**
 * Cached endpoint to fetch a Sanity <camelCase> document by slug and language.
 * GET /api/sanity/<camelCase>
 *
 * @remarks
 * Query string parameters:
 * - `slug` (optional, default `""`) — document slug passed to `<camelCase>Query` as `$slug`.
 * - `lang` (optional, default `"en"`) — locale code passed to `<camelCase>Query` as `$lang`.
 *
 * Cache behaviour:
 * - Browser: `max-age=3600` (1 hour)
 * - CDN / Nitro SWR: `s-maxage=86400, stale-while-revalidate=86400` (24 hours)
 * - Nitro cache key: `<camelCase>:<lang>:<slug>`
 *
 * Cache is invalidated via the Sanity webhook (`/api/cache/revalidate`)
 * or manually via `POST /api/cache/purge`.
 */
export default defineCachedEventHandler(
  async (event) => {
    const { lang: locale = 'en', slug = '' } = getQuery<SanityQueryParams>(event)

    setHeader(
      event,
      'Cache-Control',
      `public, max-age=${browserMaxAge}, s-maxage=${cdnMaxAge}, stale-while-revalidate=${cdnMaxAge}`,
    )

    const sanity = useSanity()
    const result = await sanity.fetch<<TypeName>QueryResult>(
      <camelCase>Query,
      { lang: locale, slug },
      { stega: false },
    )

    if (!result) throw createError({ statusCode: 404, statusMessage: 'Not Found' })
    return result
  },
  {
    maxAge: cdnMaxAge,
    shouldBypassCache: () => import.meta.dev,
    getKey: (event) => {
      const { lang = 'en', slug = '' } = getQuery<SanityQueryParams>(event)
      return `<camelCase>:${lang}:${slug}`
    },
  },
)
```

**`app/composables/useSanity<TypeName>.ts`**
```ts
import type { <TypeName>QueryResult } from '#sanity-types'
import { type MaybeRef, toValue } from 'vue'

export const useSanity<TypeName> = (
  params: MaybeRef<Required<SanityQueryParams>>,
) => {
  const visualEditingState = useSanityVisualEditingState()
  const isPreview = computed(() => Boolean(visualEditingState?.enabled))

  if (isPreview.value) {
    const { data } = useSanityQuery<<TypeName>QueryResult>(
      <camelCase>Query,
      toValue(params),
    )
    return { data }
  }

  return useFetch<<TypeName>QueryResult>('/api/sanity/<camelCase>', {
    query: toValue(params),
  })
}
```

**`app/pages/<kebab-case>/[slug].vue`** (or `app/pages/<kebab-case>.vue` if top-level)
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
1. Add the Sanity schema type and run `bun run typegen` to generate `<TypeName>QueryResult`
2. Register the route in `server/api/__sitemap__/urls.ts` if it should appear in the sitemap
