import {describe, expect, it} from 'vitest'
import {prepareResponsibilityPreview} from './responsibility-preview'

describe('responsibility preview', () => {
  it('shows organigramNode title for position type', () => {
    const result = prepareResponsibilityPreview({
      title: 'Blessure – herstel',
      active: true,
      category: 'medisch',
      contactType: 'position',
      contactNodeTitle: 'Secretaris',
      contactRole: undefined,
    })
    expect(result.subtitle).toBe('medisch — Secretaris')
  })

  it('shows "Teamrol (dynamisch)" for team-role type', () => {
    const result = prepareResponsibilityPreview({
      title: 'Sportieve vraag',
      active: true,
      category: 'sportief',
      contactType: 'team-role',
      contactNodeTitle: undefined,
      contactRole: undefined,
    })
    expect(result.subtitle).toBe('sportief — Teamrol (dynamisch)')
  })

  it('shows role label for manual type', () => {
    const result = prepareResponsibilityPreview({
      title: 'Sponsoring',
      active: true,
      category: 'commercieel',
      contactType: 'manual',
      contactNodeTitle: undefined,
      contactRole: 'Sponsorverantwoordelijke',
    })
    expect(result.subtitle).toBe('commercieel — Sponsorverantwoordelijke')
  })

  it('shows "(geen contact)" when no contactType', () => {
    const result = prepareResponsibilityPreview({
      title: 'Test',
      active: true,
      category: 'algemeen',
      contactType: undefined,
      contactNodeTitle: undefined,
      contactRole: undefined,
    })
    expect(result.subtitle).toBe('algemeen — (geen contact)')
  })

  it('appends "— inactief" when inactive', () => {
    const result = prepareResponsibilityPreview({
      title: 'Old',
      active: false,
      category: 'sportief',
      contactType: 'position',
      contactNodeTitle: 'TVJO',
      contactRole: undefined,
    })
    expect(result.subtitle).toBe('sportief — TVJO — inactief')
  })
})
