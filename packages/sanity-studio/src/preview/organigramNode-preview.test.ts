import {describe, expect, it} from 'vitest'
import {prepareOrganigramNodePreview} from './organigramNode-preview'

describe('organigramNode preview', () => {
  it('shows member names as subtitle when members exist', () => {
    const result = prepareOrganigramNodePreview({
      title: 'Voorzitter',
      roleCode: 'VP',
      member0FirstName: 'Kevin',
      member0LastName: 'Schutijser',
      member1FirstName: 'David',
      member1LastName: 'Symkens',
      member2FirstName: undefined,
      member2LastName: undefined,
    })
    expect(result.subtitle).toBe('Kevin Schutijser, David Symkens')
  })

  it('shows "Vacant" when no members', () => {
    const result = prepareOrganigramNodePreview({
      title: 'ATVJO',
      roleCode: undefined,
      member0FirstName: undefined,
      member0LastName: undefined,
      member1FirstName: undefined,
      member1LastName: undefined,
      member2FirstName: undefined,
      member2LastName: undefined,
    })
    expect(result.subtitle).toBe('Vacant')
  })

  it('shows single member name', () => {
    const result = prepareOrganigramNodePreview({
      title: 'Secretaris',
      roleCode: undefined,
      member0FirstName: 'Kevin',
      member0LastName: 'Van Ransbeeck',
      member1FirstName: undefined,
      member1LastName: undefined,
      member2FirstName: undefined,
      member2LastName: undefined,
    })
    expect(result.subtitle).toBe('Kevin Van Ransbeeck')
  })

  it('preserves roleCode in title', () => {
    const result = prepareOrganigramNodePreview({
      title: 'Voorzitter',
      roleCode: 'VP',
      member0FirstName: 'Rudy',
      member0LastName: 'Bautmans',
      member1FirstName: undefined,
      member1LastName: undefined,
      member2FirstName: undefined,
      member2LastName: undefined,
    })
    expect(result.title).toBe('[VP] Voorzitter')
  })

  it('handles three members', () => {
    const result = prepareOrganigramNodePreview({
      title: 'Lid',
      roleCode: undefined,
      member0FirstName: 'A',
      member0LastName: 'B',
      member1FirstName: 'C',
      member1LastName: 'D',
      member2FirstName: 'E',
      member2LastName: 'F',
    })
    expect(result.subtitle).toBe('A B, C D, E F')
  })
})
