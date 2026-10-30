import { decodeSignatureHeader } from '@sanity/webhook'
import { createError } from 'h3'
import { getDocumentCacheTags, isDraftDocumentId, isSanityDocumentId, isSanityDocumentType } from '../../shared/utils/cacheDependencies'

export type RevalidateOperation = 'create' | 'update' | 'delete'

export interface RevalidateBody {
  _id: string
  _type: string
  operation?: RevalidateOperation
  collectionChanged?: boolean
}

const maxSignatureAge = 5 * 60 * 1000

function isRevalidateOperation(value: unknown): value is RevalidateOperation {
  return value === 'create' || value === 'update' || value === 'delete'
}

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
    || !isSanityDocumentId(value._id)
    || !isSanityDocumentType(value._type)
  ) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid webhook payload' })
  }

  const operation = 'operation' in value ? value.operation : undefined
  const collectionChanged = 'collectionChanged' in value ? value.collectionChanged : undefined
  if (
    (operation !== undefined && !isRevalidateOperation(operation))
    || (collectionChanged !== undefined && typeof collectionChanged !== 'boolean')
  ) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid webhook metadata' })
  }

  return {
    _id: value._id,
    _type: value._type,
    ...(operation !== undefined ? { operation } : {}),
    ...(collectionChanged !== undefined ? { collectionChanged } : {}),
  }
}

export function getRevalidateCacheTags(body: RevalidateBody) {
  if (isDraftDocumentId(body._id))
    return []

  const contentOnly = body.operation === 'update' && body.collectionChanged === false
  return getDocumentCacheTags([{ _id: body._id }], contentOnly ? [] : [body._type])
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
