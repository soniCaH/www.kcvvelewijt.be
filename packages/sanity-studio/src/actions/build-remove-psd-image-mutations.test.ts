import {describe, it, expect} from 'vitest'
import {
  buildRemovePsdImageMutations,
  collectPsdImageAssetIds,
  hasPsdImage,
  isRemovePsdImageVisible,
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

describe('isRemovePsdImageVisible', () => {
  const base = {type: 'player', dialogOpen: false, draft: null, published: withImage('image-a')}

  it('is visible on player and staffMember with a psdImage', () => {
    expect(isRemovePsdImageVisible(base)).toBe(true)
    expect(isRemovePsdImageVisible({...base, type: 'staffMember'})).toBe(true)
  })

  it('is hidden without a psdImage or on other document types', () => {
    expect(isRemovePsdImageVisible({...base, published: {}})).toBe(false)
    expect(isRemovePsdImageVisible({...base, type: 'article'})).toBe(false)
  })

  it('stays visible while the dialog is open after the psdImage is gone', () => {
    expect(isRemovePsdImageVisible({...base, published: {}, dialogOpen: true})).toBe(true)
  })

  it('stays hidden on other document types even with the dialog open', () => {
    expect(isRemovePsdImageVisible({...base, type: 'article', dialogOpen: true})).toBe(false)
  })
})
