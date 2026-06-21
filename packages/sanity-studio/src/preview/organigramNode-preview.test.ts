import {describe, expect, it} from 'vitest'
import {prepareOrganigramNodePreview} from '@kcvv/sanity-schemas'

// `members` items are opaque to the prepare (it only counts them); stub refs suffice.
const refs = (n: number) => Array.from({length: n}, (_, i) => ({_ref: `m${i}`}))

describe('organigramNode preview', () => {
  it('shows member count as subtitle when members exist', () => {
    const result = prepareOrganigramNodePreview({
      title: 'Voorzitter',
      roleCode: 'VP',
      members: refs(2),
    })
    expect(result.subtitle).toBe('2 leden')
  })

  it('shows "Vacant" when no members', () => {
    const result = prepareOrganigramNodePreview({
      title: 'ATVJO',
      roleCode: undefined,
      members: [],
    })
    expect(result.subtitle).toBe('Vacant')
  })

  it('shows "Vacant" when members is undefined', () => {
    const result = prepareOrganigramNodePreview({title: 'ATVJO'})
    expect(result.subtitle).toBe('Vacant')
  })

  it('uses singular "lid" for a single member', () => {
    const result = prepareOrganigramNodePreview({
      title: 'Secretaris',
      members: refs(1),
    })
    expect(result.subtitle).toBe('1 lid')
  })

  it('preserves roleCode in title', () => {
    const result = prepareOrganigramNodePreview({
      title: 'Voorzitter',
      roleCode: 'VP',
      members: refs(1),
    })
    expect(result.title).toBe('[VP] Voorzitter')
  })

  it('counts three members', () => {
    const result = prepareOrganigramNodePreview({
      title: 'Lid',
      members: refs(3),
    })
    expect(result.subtitle).toBe('3 leden')
  })
})
