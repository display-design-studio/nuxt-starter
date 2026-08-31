import { decodeSignatureHeader } from '@sanity/webhook'
import { createError } from 'h3'

export interface RevalidateBody {
  _id: string
  _type: string
}

const maxSignatureAge = 5 * 60 * 1000
const sanityIdPattern = /^[\w.-]{1,256}$/
const sanityTypePattern = /^[\w-]{1,128}$/

export function parseRevalidateBody(rawBody: string): RevalidateBody {
  let value: unknown

  try {
    value = JSON.parse(rawBody)
  }
  catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid JSON body' })
  }

  if (
    !value
    || typeof value !== 'object'
    || !('_id' in value)
    || !('_type' in value)
    || typeof value._id !== 'string'
    || typeof value._type !== 'string'
    || !sanityIdPattern.test(value._id)
    || !sanityTypePattern.test(value._type)
  ) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid webhook payload' })
  }

  return { _id: value._id, _type: value._type }
}

export function hasFreshWebhookSignature(signature: string, now = Date.now()) {
  try {
    const { timestamp } = decodeSignatureHeader(signature)
    return Math.abs(now - timestamp) <= maxSignatureAge
  }
  catch {
    return false
  }
}
