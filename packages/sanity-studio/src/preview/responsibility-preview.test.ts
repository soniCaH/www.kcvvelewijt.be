import {describe, expect, it} from 'vitest'
import {prepareResponsibilityPreview} from './responsibility-preview'

describe('responsibility preview', () => {
  it('shows staffMember name when linked', () => {
    const result = prepareResponsibilityPreview({
      title: 'Blessure – herstel',
      active: true,
      category: 'medisch',
      contactFirstName: 'Kevin',
      contactLastName: 'Schutijser',
      contactRole: undefined,
    })
    expect(result.subtitle).toBe('medisch — Kevin Schutijser')
  })

  it('falls back to role label when no staffMember', () => {
    const result = prepareResponsibilityPreview({
      title: 'Sponsoring',
      active: true,
      category: 'commercieel',
      contactFirstName: undefined,
      contactLastName: undefined,
      contactRole: 'Sponsorverantwoordelijke',
    })
    expect(result.subtitle).toBe('commercieel — Sponsorverantwoordelijke')
  })

  it('shows only category when no contact info', () => {
    const result = prepareResponsibilityPreview({
      title: 'Test',
      active: true,
      category: 'algemeen',
      contactFirstName: undefined,
      contactLastName: undefined,
      contactRole: undefined,
    })
    expect(result.subtitle).toBe('algemeen')
  })

  it('appends "— inactief" when inactive', () => {
    const result = prepareResponsibilityPreview({
      title: 'Old',
      active: false,
      category: 'sportief',
      contactFirstName: 'A',
      contactLastName: 'B',
      contactRole: undefined,
    })
    expect(result.subtitle).toBe('sportief — A B — inactief')
  })
})
