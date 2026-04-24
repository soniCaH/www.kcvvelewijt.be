import {describe, expect, it} from 'vitest'
import {validateRespondentKey} from './respondent-key'

describe('validateRespondentKey', () => {
  const interviewDoc = (subjectKeys: string[]) => ({
    articleType: 'interview',
    subjects: subjectKeys.map((_key) => ({_key})),
  })

  it('skips enforcement on standard tag', () => {
    expect(
      validateRespondentKey(undefined, {
        parent: {tag: 'standard'},
        document: interviewDoc(['a', 'b']),
      }),
    ).toBe(true)
  })

  it('skips enforcement on rapid-fire tag', () => {
    expect(
      validateRespondentKey(undefined, {
        parent: {tag: 'rapid-fire'},
        document: interviewDoc(['a', 'b']),
      }),
    ).toBe(true)
  })

  it('skips enforcement on non-interview articles', () => {
    expect(
      validateRespondentKey(undefined, {
        parent: {tag: 'key'},
        document: {articleType: 'announcement'},
      }),
    ).toBe(true)
  })

  it('skips enforcement on single-subject interviews', () => {
    expect(
      validateRespondentKey(undefined, {
        parent: {tag: 'key'},
        document: interviewDoc(['only']),
      }),
    ).toBe(true)
    expect(
      validateRespondentKey(undefined, {
        parent: {tag: 'quote'},
        document: interviewDoc(['only']),
      }),
    ).toBe(true)
  })

  it('requires respondentKey on key pairs when N>=2', () => {
    expect(
      validateRespondentKey(undefined, {
        parent: {tag: 'key'},
        document: interviewDoc(['a', 'b']),
      }),
    ).toBe('Kies wie dit gezegd heeft')
    expect(
      validateRespondentKey('', {
        parent: {tag: 'key'},
        document: interviewDoc(['a', 'b']),
      }),
    ).toBe('Kies wie dit gezegd heeft')
  })

  it('requires respondentKey on quote pairs when N>=2', () => {
    expect(
      validateRespondentKey(undefined, {
        parent: {tag: 'quote'},
        document: interviewDoc(['a', 'b', 'c']),
      }),
    ).toBe('Kies wie dit gezegd heeft')
  })

  it('accepts respondentKey that matches a subject _key', () => {
    expect(
      validateRespondentKey('b', {
        parent: {tag: 'key'},
        document: interviewDoc(['a', 'b', 'c']),
      }),
    ).toBe(true)
  })

  it('rejects respondentKey that does not match any subject', () => {
    expect(
      validateRespondentKey('missing', {
        parent: {tag: 'key'},
        document: interviewDoc(['a', 'b']),
      }),
    ).toBe('Deze respondent staat niet meer in de lijst van subjects')
  })

  it('treats missing tag as standard (skips)', () => {
    expect(
      validateRespondentKey(undefined, {
        parent: {},
        document: interviewDoc(['a', 'b']),
      }),
    ).toBe(true)
  })

  it('tolerates missing parent/context', () => {
    expect(validateRespondentKey(undefined, {})).toBe(true)
  })
})
