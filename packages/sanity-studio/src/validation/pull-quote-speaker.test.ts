import {describe, expect, it} from 'vitest'
import {
  validatePullQuoteSpeakerReference,
  validatePullQuoteExternalRoleOrSource,
  validatePullQuoteExternalName,
} from '@kcvv/sanity-schemas'

describe('validatePullQuoteSpeakerReference', () => {
  it('passes when neither a reference nor an external name is set', () => {
    expect(validatePullQuoteSpeakerReference(undefined, {parent: {}})).toBe(true)
    expect(validatePullQuoteSpeakerReference(null, {parent: {externalName: ''}})).toBe(true)
  })

  it('passes a reference alone', () => {
    expect(
      validatePullQuoteSpeakerReference(
        {_type: 'reference', _ref: 'player-1'},
        {parent: {}},
      ),
    ).toBe(true)
  })

  it('passes an external name alone (no reference)', () => {
    expect(
      validatePullQuoteSpeakerReference(undefined, {parent: {externalName: 'Coach'}}),
    ).toBe(true)
  })

  it('refuses a reference together with an external name', () => {
    expect(
      validatePullQuoteSpeakerReference(
        {_type: 'reference', _ref: 'player-1'},
        {parent: {externalName: 'Coach'}},
      ),
    ).toBe(
      'Kies één spreker: een verwijzing naar een spelers- of stafprofiel óf een externe naam — niet beide.',
    )
  })

  it('treats a whitespace-only external name as absent', () => {
    expect(
      validatePullQuoteSpeakerReference(
        {_type: 'reference', _ref: 'player-1'},
        {parent: {externalName: '   '}},
      ),
    ).toBe(true)
  })
})

describe('validatePullQuoteExternalRoleOrSource', () => {
  it('passes an empty value regardless of the speaker reference', () => {
    expect(validatePullQuoteExternalRoleOrSource(undefined, {parent: {}})).toBe(true)
    expect(
      validatePullQuoteExternalRoleOrSource('', {
        parent: {speaker: {_type: 'reference', _ref: 'player-1'}},
      }),
    ).toBe(true)
  })

  it('passes a filled value when no reference is set (the external-speaker path)', () => {
    expect(
      validatePullQuoteExternalRoleOrSource('Journalist', {parent: {}}),
    ).toBe(true)
  })

  it('refuses a filled value once a speaker reference is set — its own message, not "needs a name"', () => {
    expect(
      validatePullQuoteExternalRoleOrSource('Journalist', {
        parent: {speaker: {_type: 'reference', _ref: 'player-1'}},
      }),
    ).toBe('Rol en bron horen alleen bij een externe spreker — maak ze leeg.')
  })

  it('treats a whitespace-only value as empty even with a reference set', () => {
    expect(
      validatePullQuoteExternalRoleOrSource('   ', {
        parent: {speaker: {_type: 'reference', _ref: 'player-1'}},
      }),
    ).toBe(true)
  })
})

describe('validatePullQuoteExternalName', () => {
  it('passes when nothing is filled in', () => {
    expect(validatePullQuoteExternalName(undefined, {parent: {}})).toBe(true)
    expect(validatePullQuoteExternalName('', {parent: {}})).toBe(true)
  })

  it('passes when the name is filled in', () => {
    expect(
      validatePullQuoteExternalName('Het Nieuwsblad', {
        parent: {externalRole: 'Journalist', externalSource: '23 mei 2026'},
      }),
    ).toBe(true)
  })

  it('errors when a role is set without a name', () => {
    expect(
      validatePullQuoteExternalName(undefined, {parent: {externalRole: 'Journalist'}}),
    ).toBe('Vul een naam in voor de externe spreker — een rol of bron alleen is niet genoeg.')
  })

  it('errors when a source is set without a name', () => {
    expect(
      validatePullQuoteExternalName('', {parent: {externalSource: 'Het Nieuwsblad'}}),
    ).toBe('Vul een naam in voor de externe spreker — een rol of bron alleen is niet genoeg.')
  })

  it('treats a whitespace-only name as absent', () => {
    expect(
      validatePullQuoteExternalName('   ', {parent: {externalRole: 'Journalist'}}),
    ).toBe('Vul een naam in voor de externe spreker — een rol of bron alleen is niet genoeg.')
  })

  it('stays silent once a speaker reference is set — rule 2 owns role/source without a name in that case, not this validator (#2517 review — the "loop")', () => {
    expect(
      validatePullQuoteExternalName(undefined, {
        parent: {
          externalRole: 'Journalist',
          speaker: {_type: 'reference', _ref: 'player-1'},
        },
      }),
    ).toBe(true)
    expect(
      validatePullQuoteExternalName('', {
        parent: {
          externalSource: 'Het Nieuwsblad',
          speaker: {_type: 'reference', _ref: 'player-1'},
        },
      }),
    ).toBe(true)
  })
})
