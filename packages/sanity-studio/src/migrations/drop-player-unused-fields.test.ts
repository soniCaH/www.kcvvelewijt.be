import {at, unset} from 'sanity/migrate'
import {describe, expect, it} from 'vitest'
import {
  migrateDropPlayerUnusedFields,
  type PlayerWithUnusedFieldsDoc,
} from './drop-player-unused-fields'

describe('migrateDropPlayerUnusedFields', () => {
  it('returns undefined when none of the three legacy fields are present', () => {
    const doc: PlayerWithUnusedFieldsDoc = {_id: 'p-1', _type: 'player'}
    expect(migrateDropPlayerUnusedFields(doc)).toBeUndefined()
  })

  it('unsets nationality when present', () => {
    const doc: PlayerWithUnusedFieldsDoc = {
      _id: 'p-1',
      _type: 'player',
      nationality: 'Belgium',
    }
    expect(migrateDropPlayerUnusedFields(doc)).toEqual([
      at('nationality', unset()),
    ])
  })

  it('unsets height when present', () => {
    const doc: PlayerWithUnusedFieldsDoc = {
      _id: 'p-1',
      _type: 'player',
      height: 180,
    }
    expect(migrateDropPlayerUnusedFields(doc)).toEqual([at('height', unset())])
  })

  it('unsets weight when present', () => {
    const doc: PlayerWithUnusedFieldsDoc = {
      _id: 'p-1',
      _type: 'player',
      weight: 75,
    }
    expect(migrateDropPlayerUnusedFields(doc)).toEqual([at('weight', unset())])
  })

  it('unsets all three fields when all are present', () => {
    const doc: PlayerWithUnusedFieldsDoc = {
      _id: 'p-1',
      _type: 'player',
      nationality: 'Belgium',
      height: 180,
      weight: 75,
    }
    expect(migrateDropPlayerUnusedFields(doc)).toEqual([
      at('nationality', unset()),
      at('height', unset()),
      at('weight', unset()),
    ])
  })

  it('unsets stored null values (Sanity treats null as a real value)', () => {
    const doc: PlayerWithUnusedFieldsDoc = {
      _id: 'p-1',
      _type: 'player',
      nationality: null,
      height: null,
    }
    expect(migrateDropPlayerUnusedFields(doc)).toEqual([
      at('nationality', unset()),
      at('height', unset()),
    ])
  })

  it('is idempotent — re-running on an already-migrated doc is a no-op', () => {
    const doc: PlayerWithUnusedFieldsDoc = {
      _id: 'p-1',
      _type: 'player',
      // All legacy fields already unset upstream.
    }
    expect(migrateDropPlayerUnusedFields(doc)).toBeUndefined()
  })
})
