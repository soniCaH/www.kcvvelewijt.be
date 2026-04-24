import {describe, expect, it} from 'vitest'
import {validateSubjectsCount} from './subjects-count'

describe('validateSubjectsCount', () => {
  const interviewDoc = {articleType: 'interview'} as const

  it('skips non-interview articles', () => {
    expect(validateSubjectsCount([], {document: {articleType: 'announcement'}})).toBe(true)
    expect(validateSubjectsCount(undefined, {document: {articleType: 'transfer'}})).toBe(true)
    expect(validateSubjectsCount(undefined, {})).toBe(true)
  })

  it('rejects empty or missing subjects on interview articles', () => {
    expect(validateSubjectsCount(undefined, {document: interviewDoc})).toBe(
      'Interview articles need at least one subject.',
    )
    expect(validateSubjectsCount([], {document: interviewDoc})).toBe(
      'Interview articles need at least one subject.',
    )
    expect(validateSubjectsCount(null, {document: interviewDoc})).toBe(
      'Interview articles need at least one subject.',
    )
  })

  it('accepts 1–4 subjects on interview articles', () => {
    expect(validateSubjectsCount([{}], {document: interviewDoc})).toBe(true)
    expect(validateSubjectsCount([{}, {}], {document: interviewDoc})).toBe(true)
    expect(validateSubjectsCount([{}, {}, {}], {document: interviewDoc})).toBe(true)
    expect(validateSubjectsCount([{}, {}, {}, {}], {document: interviewDoc})).toBe(true)
  })

  it('rejects 5 or more subjects on interview articles', () => {
    const five = Array.from({length: 5}, () => ({}))
    expect(validateSubjectsCount(five, {document: interviewDoc})).toBe(
      'Maximum 4 subjects per interview. Lift the cap via a dedicated design pass — not inline.',
    )
  })
})
