import {describe, expect, it, vi} from 'vitest'
import {validateOrganigramMember} from './organigram-members'

describe('validateOrganigramMember', () => {
  const makeContext = (doc: Record<string, unknown> | null) => ({
    getClient: () => ({
      fetch: vi.fn().mockResolvedValue(doc),
    }),
  })

  it('returns warning when referenced staffMember is archived', async () => {
    const ref = {_type: 'reference' as const, _ref: 'staffMember-psd-123'}
    const context = makeContext({_id: 'staffMember-psd-123', archived: true})
    const result = await validateOrganigramMember(ref, context as never)
    expect(result).toEqual({
      level: 'warning',
      message: 'Dit lid is gearchiveerd — controleer of deze positie nog actueel is',
    })
  })

  it('returns true when staffMember is not archived', async () => {
    const ref = {_type: 'reference' as const, _ref: 'staffMember-psd-123'}
    const context = makeContext({_id: 'staffMember-psd-123', archived: false})
    const result = await validateOrganigramMember(ref, context as never)
    expect(result).toBe(true)
  })

  it('returns true when staffMember has no archived field', async () => {
    const ref = {_type: 'reference' as const, _ref: 'staffMember-psd-123'}
    const context = makeContext({_id: 'staffMember-psd-123'})
    const result = await validateOrganigramMember(ref, context as never)
    expect(result).toBe(true)
  })

  it('returns true when document not found', async () => {
    const ref = {_type: 'reference' as const, _ref: 'staffMember-psd-123'}
    const context = makeContext(null)
    const result = await validateOrganigramMember(ref, context as never)
    expect(result).toBe(true)
  })

  it('returns true when ref is undefined', async () => {
    const context = makeContext(null)
    const result = await validateOrganigramMember(undefined, context as never)
    expect(result).toBe(true)
  })
})
