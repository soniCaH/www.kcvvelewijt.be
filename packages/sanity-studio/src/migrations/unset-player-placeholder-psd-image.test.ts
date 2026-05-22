import {at, unset} from 'sanity/migrate'
import {describe, expect, it} from 'vitest'
import {
  PSD_PLACEHOLDER_ASSET_REF,
  migrateUnsetPlayerPlaceholderPsdImage,
  type PlayerWithPsdImageDoc,
} from './unset-player-placeholder-psd-image'

describe('migrateUnsetPlayerPlaceholderPsdImage', () => {
  it('returns undefined when psdImage is missing entirely', () => {
    const doc: PlayerWithPsdImageDoc = {_id: 'p-1', _type: 'player'}
    expect(migrateUnsetPlayerPlaceholderPsdImage(doc)).toBeUndefined()
  })

  it('returns undefined when psdImage.asset._ref does not match the placeholder', () => {
    const doc: PlayerWithPsdImageDoc = {
      _id: 'p-1',
      _type: 'player',
      psdImage: {
        _type: 'image',
        asset: {_type: 'reference', _ref: 'image-deadbeef-350x350-jpg'},
      },
    }
    expect(migrateUnsetPlayerPlaceholderPsdImage(doc)).toBeUndefined()
  })

  it('unsets psdImage when the asset ref matches the placeholder', () => {
    const doc: PlayerWithPsdImageDoc = {
      _id: 'p-1',
      _type: 'player',
      psdImage: {
        _type: 'image',
        asset: {_type: 'reference', _ref: PSD_PLACEHOLDER_ASSET_REF},
      },
    }
    expect(migrateUnsetPlayerPlaceholderPsdImage(doc)).toEqual([
      at('psdImage', unset()),
    ])
  })

  it('also unsets the sibling psdImageUrl when it exists', () => {
    const doc: PlayerWithPsdImageDoc = {
      _id: 'p-1',
      _type: 'player',
      psdImage: {
        _type: 'image',
        asset: {_type: 'reference', _ref: PSD_PLACEHOLDER_ASSET_REF},
      },
      psdImageUrl: 'https://kcvv.prosoccerdata.com/img/placeholder.jpg?v=1',
    }
    expect(migrateUnsetPlayerPlaceholderPsdImage(doc)).toEqual([
      at('psdImage', unset()),
      at('psdImageUrl', unset()),
    ])
  })

  it('is idempotent — re-running on an already-unset doc is a no-op', () => {
    const original: PlayerWithPsdImageDoc = {
      _id: 'p-1',
      _type: 'player',
      psdImage: {
        _type: 'image',
        asset: {_type: 'reference', _ref: PSD_PLACEHOLDER_ASSET_REF},
      },
    }
    const patches = migrateUnsetPlayerPlaceholderPsdImage(original)
    expect(patches).toBeDefined()

    // Simulate post-migration state: psdImage gone.
    const after: PlayerWithPsdImageDoc = {_id: 'p-1', _type: 'player'}
    expect(migrateUnsetPlayerPlaceholderPsdImage(after)).toBeUndefined()
  })
})
