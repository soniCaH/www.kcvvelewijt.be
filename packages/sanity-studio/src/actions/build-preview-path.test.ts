import {describe, it, expect} from 'vitest'
import {buildPreviewPath} from './build-preview-path'

describe('buildPreviewPath', () => {
  it.each([
    ['article', 'mijn-artikel', '/nieuws/mijn-artikel'],
    ['event', 'jeugdkamp', '/evenementen/jeugdkamp'],
    ['page', 'sponsors', '/club/sponsors'],
    ['photoGallery', 'kerstfeest', '/galerij/kerstfeest'],
  ])('maps %s to its public path', (type, slug, path) => {
    expect(buildPreviewPath(type, slug)).toBe(path)
  })

  it.each([
    ['a missing slug', 'article', undefined],
    ['a blank slug', 'article', '  '],
    ['an unsupported type', 'team', 'eerste-ploeg'],
  ])('returns nothing for %s', (_label, type, slug) => {
    expect(buildPreviewPath(type, slug)).toBeUndefined()
  })

  it('escapes characters that would change the path', () => {
    expect(buildPreviewPath('article', 'a/b?c')).toBe('/nieuws/a%2Fb%3Fc')
  })
})
