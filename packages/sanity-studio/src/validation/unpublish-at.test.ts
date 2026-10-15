import {describe, expect, it} from 'vitest'
import {validateUnpublishAt} from '@kcvv/sanity-schemas'

describe('validateUnpublishAt', () => {
  const publishedAt = '2026-10-20T10:00:00Z'
  const message =
    'Het offline-moment moet na het publicatiemoment liggen. Anders is het artikel nooit zichtbaar.'

  it('errors when unpublishAt is before publishedAt', () => {
    expect(validateUnpublishAt('2026-10-19T10:00:00Z', {document: {publishedAt}})).toBe(message)
  })

  it('errors when unpublishAt equals publishedAt', () => {
    expect(validateUnpublishAt(publishedAt, {document: {publishedAt}})).toBe(message)
  })

  it('passes when unpublishAt is after publishedAt', () => {
    expect(validateUnpublishAt('2026-10-21T10:00:00Z', {document: {publishedAt}})).toBe(true)
  })

  it('passes when either field is empty', () => {
    expect(validateUnpublishAt(undefined, {document: {publishedAt}})).toBe(true)
    expect(validateUnpublishAt('2026-10-19T10:00:00Z', {document: {}})).toBe(true)
    expect(validateUnpublishAt('2026-10-19T10:00:00Z', {})).toBe(true)
    expect(validateUnpublishAt(undefined, {})).toBe(true)
  })
})
