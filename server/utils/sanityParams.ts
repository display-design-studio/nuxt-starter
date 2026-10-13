import type { H3Event } from 'h3'
import { createError, getQuery } from 'h3'
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '../../shared/utils/locales'

function requireSingleValue(value: unknown, name: string, maxLength: number) {
  if (typeof value !== 'string' || value.length === 0 || value.length > maxLength) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid ${name}`,
    })
  }

  return value
}

export function validateSanityLocale(value: unknown) {
  const locale = requireSingleValue(value, 'lang', 16)

  if (!SUPPORTED_LOCALES.includes(locale))
    throw createError({ statusCode: 400, statusMessage: 'Unsupported lang' })

  return locale
}

export function validateSanitySlug(slug: unknown) {
  const value = requireSingleValue(slug, 'slug', 200)

  if ([...value].some(character => character === '/' || character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127))
    throw createError({ statusCode: 400, statusMessage: 'Invalid slug' })

  return value
}

export function getSanityLocale(event: H3Event) {
  const { lang = DEFAULT_LOCALE } = getQuery(event)
  return validateSanityLocale(lang)
}

export function getSanitySlug(event: H3Event) {
  const { slug } = getQuery(event)
  return validateSanitySlug(slug)
}
