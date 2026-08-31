import { describe, expect, test } from 'bun:test'
import { validateSanityLocale, validateSanitySlug } from '../server/utils/sanityParams'

describe('Sanity query parameter validation', () => {
  test('accepts supported locales and normal slugs', () => {
    expect(validateSanityLocale('en')).toBe('en')
    expect(validateSanitySlug('about-us')).toBe('about-us')
    expect(validateSanitySlug('chi-siamo')).toBe('chi-siamo')
  })

  test('rejects unsupported, repeated, and empty locale values', () => {
    expect(() => validateSanityLocale('it')).toThrow()
    expect(() => validateSanityLocale(['en', 'it'])).toThrow()
    expect(() => validateSanityLocale('')).toThrow()
  })

  test('rejects unsafe or unbounded slugs', () => {
    expect(() => validateSanitySlug('nested/page')).toThrow()
    expect(() => validateSanitySlug('line\nbreak')).toThrow()
    expect(() => validateSanitySlug('a'.repeat(201))).toThrow()
    expect(() => validateSanitySlug(['page', 'other'])).toThrow()
  })
})
