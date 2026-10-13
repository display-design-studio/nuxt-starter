/**
 * Single source of truth for the active locales.
 *
 * @remarks
 * Consumed by `nuxt.config.ts` (i18n), by the Sanity param validation and by
 * the sitemap. To enable a locale add it here and add `i18n/locales/<code>.json`.
 */
export const LOCALES: Array<{ code: string, name: string }> = [
  { code: 'en', name: 'English' },
  // { code: 'it', name: 'Italian' },
]

export const DEFAULT_LOCALE = 'en'

export const SUPPORTED_LOCALES: readonly string[] = LOCALES.map(locale => locale.code)

/** Path for a slug in a locale, following the `prefix_except_default` strategy. */
export function localizedPath(locale: string, slug: string) {
  return locale === DEFAULT_LOCALE ? `/${slug}` : `/${locale}/${slug}`
}
