import {describe, expect, it} from 'vitest'
import type {ValidationMarker} from 'sanity'
import {buildGuideModel, isDocEmpty, type GuideEntry} from './guide-model'

const entry: GuideEntry = {intro: 'waarom dit telt'}
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
    expect(model.intro).toBe('waarom dit telt')
    expect(model.outstanding).toEqual([
      {path: 'title', message: 'Titel verplicht'},
      {path: 'slug.current', message: 'Slug verplicht'},
    ])
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
