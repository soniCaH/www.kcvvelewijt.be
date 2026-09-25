import {describe, expect, it} from 'vitest'
import {
  validateCallToActionRequiredField,
  validateCallToActionEmphasis,
  validateCallToActionLink,
} from '@kcvv/sanity-schemas'

describe('validateCallToActionRequiredField', () => {
  it('passes an entirely empty call-to-action (the default — no band)', () => {
    expect(validateCallToActionRequiredField(undefined, '', 'Verplicht')).toBe(true)
    expect(validateCallToActionRequiredField({}, undefined, 'Verplicht')).toBe(true)
  })

  it('errors with the Dutch message once a sibling field is filled in (partial object)', () => {
    expect(
      validateCallToActionRequiredField({buttonLabel: 'Schrijf je in'}, '', 'Verplicht'),
    ).toBe('Verplicht')
    expect(
      validateCallToActionRequiredField(
        {buttonLabel: 'Schrijf je in'},
        undefined,
        'Verplicht',
      ),
    ).toBe('Verplicht')
  })

  it('treats whitespace-only as missing', () => {
    expect(
      validateCallToActionRequiredField({buttonLabel: 'Schrijf je in'}, '   ', 'Verplicht'),
    ).toBe('Verplicht')
  })

  it('passes once the field itself is filled in', () => {
    expect(
      validateCallToActionRequiredField(
        {buttonLabel: 'Schrijf je in'},
        'Kom eens gratis meetrainen?',
        'Verplicht',
      ),
    ).toBe(true)
  })
})

describe('validateCallToActionEmphasis', () => {
  it('passes an empty emphasis regardless of the object state', () => {
    expect(validateCallToActionEmphasis(undefined, '')).toBe(true)
    expect(validateCallToActionEmphasis({question: 'Kom je?'}, undefined)).toBe(true)
  })

  it('passes when the emphasis is a literal substring of the question', () => {
    expect(
      validateCallToActionEmphasis(
        {question: 'Kom eens gratis meetrainen?'},
        'gratis meetrainen',
      ),
    ).toBe(true)
  })

  it('errors with a Dutch message when the emphasis is not in the question', () => {
    expect(
      validateCallToActionEmphasis({question: 'Kom je langs?'}, 'gratis meetrainen'),
    ).toBe('Het accentwoord moet letterlijk voorkomen in de vraag.')
  })

  it('trims both sides before comparing', () => {
    expect(
      validateCallToActionEmphasis(
        {question: '  Kom eens gratis meetrainen?  '},
        '  gratis meetrainen  ',
      ),
    ).toBe(true)
  })
})

describe('validateCallToActionLink', () => {
  it('passes an entirely empty call-to-action', () => {
    expect(validateCallToActionLink(undefined, 'reference')).toBe(true)
    expect(validateCallToActionLink({}, 'href')).toBe(true)
  })

  it('errors when both a reference and an href are set', () => {
    expect(
      validateCallToActionLink(
        {
          buttonLabel: 'Ga',
          reference: {_ref: 'team-1'},
          href: 'https://forms.gle/abc',
        },
        'reference',
      ),
    ).toBe('Kies één link: een interne verwijzing óf een URL — niet beide.')
    expect(
      validateCallToActionLink(
        {
          buttonLabel: 'Ga',
          reference: {_ref: 'team-1'},
          href: 'https://forms.gle/abc',
        },
        'href',
      ),
    ).toBe('Kies één link: een interne verwijzing óf een URL — niet beide.')
  })

  it('errors on both fields when neither a reference nor an href is set', () => {
    expect(
      validateCallToActionLink({buttonLabel: 'Ga'}, 'reference'),
    ).toBe(
      'Verplicht zodra je een oproep invult: kies een interne verwijzing of vul hieronder een URL in.',
    )
    expect(validateCallToActionLink({buttonLabel: 'Ga'}, 'href')).toBe(
      'Verplicht zodra je een oproep invult: vul een URL in, of kies hierboven een interne verwijzing.',
    )
  })

  it('passes with exactly one of reference / href set', () => {
    expect(
      validateCallToActionLink({reference: {_ref: 'team-1'}}, 'reference'),
    ).toBe(true)
    expect(
      validateCallToActionLink({href: 'https://forms.gle/abc'}, 'href'),
    ).toBe(true)
  })
})
