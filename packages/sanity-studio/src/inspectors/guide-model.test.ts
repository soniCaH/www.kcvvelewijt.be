import {describe, expect, it} from 'vitest'
import type {ValidationMarker} from 'sanity'
import {buildGuideModel, isDocEmpty, resolveGuideVerdict, type GuideEntry} from './guide-model'

const entry: GuideEntry = {
  intro: 'waarom dit telt',
  placement: 'verschijnt hier',
  tips: ['tip één'],
}
const markers = (m: Partial<ValidationMarker>[]) => m as ValidationMarker[]

describe('buildGuideModel', () => {
  it('lists only error-level markers as outstanding, in order', () => {
    const model = buildGuideModel(
      markers([
        {level: 'error', message: 'Titel verplicht', path: ['title']},
        {level: 'warning', message: 'Erg lang', path: ['body']},
        {level: 'error', message: 'Slug verplicht', path: ['slug', 'current']},
      ]),
      entry,
    )
    expect(model.outstanding).toEqual([
      {path: 'title', message: 'Titel verplicht'},
      {path: 'slug.current', message: 'Slug verplicht'},
    ])
  })

  it('passes the static guidance fields through unchanged', () => {
    const model = buildGuideModel(markers([]), entry)
    expect(model.intro).toBe('waarom dit telt')
    expect(model.placement).toBe('verschijnt hier')
    expect(model.tips).toEqual(['tip één'])
  })

  it('is empty (publish-ready) when there are no error markers', () => {
    const model = buildGuideModel(
      markers([{level: 'warning', message: 'x', path: ['a']}]),
      entry,
    )
    expect(model.outstanding).toEqual([])
  })

  it('tolerates a marker with no path', () => {
    const model = buildGuideModel(markers([{level: 'error', message: 'Ongeldig'}]), entry)
    expect(model.outstanding).toEqual([{path: '', message: 'Ongeldig'}])
  })
})

describe('isDocEmpty', () => {
  it('treats null/undefined and system-only docs as empty', () => {
    expect(isDocEmpty(null)).toBe(true)
    expect(isDocEmpty(undefined)).toBe(true)
    expect(isDocEmpty({_id: 'drafts.x', _type: 'responsibility', _rev: 'a'})).toBe(true)
  })

  it('treats a doc with any content field as non-empty', () => {
    expect(isDocEmpty({_id: 'x', _type: 'responsibility', title: 'AED'})).toBe(false)
  })
})

describe('resolveGuideVerdict', () => {
  it('is incomplete whenever there are outstanding errors', () => {
    expect(resolveGuideVerdict({outstandingCount: 2, empty: false, isValidating: false})).toBe('incomplete')
    // outstanding errors win even mid-validation
    expect(resolveGuideVerdict({outstandingCount: 1, empty: false, isValidating: true})).toBe('incomplete')
  })

  it('shows empty prompt for an untouched doc', () => {
    expect(resolveGuideVerdict({outstandingCount: 0, empty: true, isValidating: false})).toBe('empty')
  })

  it('does NOT report ready while validation is still settling on a non-empty doc', () => {
    // Regression: empty markers mid-validation must not read as publish-ready.
    expect(resolveGuideVerdict({outstandingCount: 0, empty: false, isValidating: true})).toBe('validating')
  })

  it('is ready only for a settled, non-empty, error-free doc', () => {
    expect(resolveGuideVerdict({outstandingCount: 0, empty: false, isValidating: false})).toBe('ready')
  })
})
