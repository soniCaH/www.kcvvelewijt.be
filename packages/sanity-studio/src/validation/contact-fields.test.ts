import {describe, expect, it} from 'vitest'
import {validateContactFields} from '@kcvv/sanity-schemas'

describe('validateContactFields', () => {
  describe('missing contactType', () => {
    it('errors when required (primaryContact)', () => {
      expect(validateContactFields({}, true)).toBe('Kies een type contact')
    })

    it('passes when optional (solutionStep.contact)', () => {
      expect(validateContactFields({}, false)).toBe(true)
    })

    it('treats an undefined contact as a missing contactType', () => {
      expect(validateContactFields(undefined, true)).toBe('Kies een type contact')
      expect(validateContactFields(undefined, false)).toBe(true)
    })
  })

  describe('position', () => {
    it('passes when an organigramNode is picked', () => {
      expect(
        validateContactFields(
          {contactType: 'position', organigramNode: {_ref: 'node-1'}},
          true,
        ),
      ).toBe(true)
    })

    it('errors when no organigramNode is picked', () => {
      expect(
        validateContactFields({contactType: 'position'}, true),
      ).toBe('Kies een organigram-positie')
    })
  })

  describe('team-role', () => {
    it('passes when a teamRole is picked', () => {
      expect(
        validateContactFields({contactType: 'team-role', teamRole: 'trainer'}, true),
      ).toBe(true)
    })

    it('errors when no teamRole is picked', () => {
      expect(
        validateContactFields({contactType: 'team-role'}, true),
      ).toBe('Kies een teamrol')
    })
  })

  describe('manual', () => {
    it.each(['role', 'email', 'phone', 'department'])(
      'passes when only %s is filled',
      (field) => {
        expect(
          validateContactFields({contactType: 'manual', [field]: 'x'}, true),
        ).toBe(true)
      },
    )

    it('errors when every manual field is empty', () => {
      expect(
        validateContactFields({contactType: 'manual'}, true),
      ).toBe('Vul minstens één van: rol, email, telefoon, afdeling in')
    })

    it('treats whitespace-only values as empty', () => {
      expect(
        validateContactFields(
          {contactType: 'manual', email: '   ', role: ''},
          true,
        ),
      ).toBe('Vul minstens één van: rol, email, telefoon, afdeling in')
    })
  })

  it('errors on an unrecognised contactType', () => {
    expect(
      validateContactFields({contactType: 'bogus'}, true),
    ).toBe('Ongeldig type contact')
  })
})
