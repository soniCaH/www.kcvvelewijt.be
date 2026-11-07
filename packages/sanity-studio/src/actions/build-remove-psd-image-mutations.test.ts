import {describe, it, expect} from 'vitest'
import {
  buildRemovePsdImageMutations,
  collectPsdImageAssetIds,
  hasPsdImage,
} from './build-remove-psd-image-mutations'

const unset = ['psdImage', 'psdImageUrl']
const withImage = (ref: string) => ({psdImage: {_type: 'image', asset: {_ref: ref}}})

describe('buildRemovePsdImageMutations', () => {
  it('patches only the published document when there is no draft', () => {
    expect(buildRemovePsdImageMutations({id: 'player-psd-1', draft: null, published: {}})).toEqual([
      {patch: {id: 'player-psd-1', unset}},
    ])
  })

  it('patches only the draft when the document is unpublished', () => {
    expect(buildRemovePsdImageMutations({id: 'player-psd-1', draft: {}, published: null})).toEqual([
      {patch: {id: 'drafts.player-psd-1', unset}},
    ])
  })

  it('patches the published document and the open draft', () => {
    expect(buildRemovePsdImageMutations({id: 'player-psd-1', draft: {}, published: {}})).toEqual([
      {patch: {id: 'player-psd-1', unset}},
      {patch: {id: 'drafts.player-psd-1', unset}},
    ])
  })
})

describe('collectPsdImageAssetIds', () => {
  it('returns the distinct asset ids of draft and published', () => {
    expect(collectPsdImageAssetIds(withImage('image-a'), withImage('image-b'))).toEqual([
      'image-a',
      'image-b',
    ])
    expect(collectPsdImageAssetIds(withImage('image-a'), withImage('image-a'))).toEqual(['image-a'])
  })

  it('skips documents without a psdImage asset', () => {
    expect(collectPsdImageAssetIds(null, {psdImage: {_type: 'image'}})).toEqual([])
  })
})

describe('hasPsdImage', () => {
  it('is true when either document carries a psdImage asset', () => {
    expect(hasPsdImage(null, withImage('image-a'))).toBe(true)
    expect(hasPsdImage(withImage('image-a'), null)).toBe(true)
    expect(hasPsdImage({}, {})).toBe(false)
  })
})
