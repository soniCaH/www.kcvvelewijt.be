import {describe, expect, it} from 'vitest'
import {auditCoverImageRequired} from './audit-coverimage-required'

describe('auditCoverImageRequired', () => {
  it('reports nothing when the cover image carries an asset', () => {
    expect(
      auditCoverImageRequired({
        coverImage: {asset: {_ref: 'image-1'}},
        slug: {current: 'a'},
      }),
    ).toBeUndefined()
  })

  it('reports an article without a cover image, with a string title', () => {
    expect(auditCoverImageRequired({title: 'Zege', slug: {current: 'zege'}})).toBe(
      '[coverImage missing] zege — "Zege"',
    )
  })

  it('reports a cover image object without an asset', () => {
    expect(
      auditCoverImageRequired({
        coverImage: {},
        title: 'X',
        slug: {current: 'x'},
      }),
    ).toBe('[coverImage missing] x — "X"')
  })

  it('flattens a Portable Text title', () => {
    expect(
      auditCoverImageRequired({
        title: [{children: [{text: 'Grote '}, {text: 'zege'}]}],
        slug: {current: 'zege'},
      }),
    ).toBe('[coverImage missing] zege — "Grote zege"')
  })

  it('falls back when title and slug are missing', () => {
    expect(auditCoverImageRequired({coverImage: null})).toBe(
      '[coverImage missing] (geen slug) — "(geen titel)"',
    )
  })
})
