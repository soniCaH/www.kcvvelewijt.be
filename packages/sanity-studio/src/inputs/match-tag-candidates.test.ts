import {describe, expect, it} from 'vitest'
import {canonicalizeTagInput, matchTagCandidates} from './match-tag-candidates'

describe('matchTagCandidates', () => {
  it('returns case-insensitive prefix matches from canonical tags', () => {
    const canonical = ['Jeugd', 'Eerste ploeg', 'Dames', 'Juniors']
    expect(matchTagCandidates('je', canonical)).toEqual(['Jeugd'])
  })

  it('is case-insensitive — lowercase input matches title-cased canonical', () => {
    const canonical = ['Jeugd', 'Dames']
    expect(matchTagCandidates('jeugd', canonical)).toEqual(['Jeugd'])
  })

  it('returns canonical (original-cased) strings, not the input', () => {
    const canonical = ['Jeugd']
    expect(matchTagCandidates('JEU', canonical)).toEqual(['Jeugd'])
  })

  it('returns empty array when no candidate matches', () => {
    expect(matchTagCandidates('foo', ['Jeugd', 'Dames'])).toEqual([])
  })

  it('returns all canonical tags sorted when input is empty', () => {
    expect(matchTagCandidates('', ['Zwart', 'Aalst', 'Mechelen'])).toEqual([
      'Aalst',
      'Mechelen',
      'Zwart',
    ])
  })

  it('trims whitespace from the input before matching', () => {
    expect(matchTagCandidates('  jeu  ', ['Jeugd'])).toEqual(['Jeugd'])
  })

  it('de-duplicates canonical tags while preserving the first-seen casing', () => {
    expect(matchTagCandidates('', ['Jeugd', 'jeugd', 'JEUGD'])).toEqual(['Jeugd'])
  })

  it('ignores non-string entries defensively', () => {
    const canonical = ['Jeugd', null, undefined, 42, 'Dames'] as unknown as string[]
    expect(matchTagCandidates('', canonical)).toEqual(['Dames', 'Jeugd'])
  })
})

describe('canonicalizeTagInput', () => {
  it('returns the canonical casing when a case-insensitive match exists', () => {
    expect(canonicalizeTagInput('jeugd', ['Jeugd', 'Dames'])).toBe('Jeugd')
  })

  it('returns the trimmed input unchanged when no canonical match exists', () => {
    expect(canonicalizeTagInput('  Nieuw  ', ['Jeugd'])).toBe('Nieuw')
  })

  it('prefers the first canonical occurrence when duplicates exist', () => {
    expect(canonicalizeTagInput('jeugd', ['Jeugd', 'jeugd'])).toBe('Jeugd')
  })
})
