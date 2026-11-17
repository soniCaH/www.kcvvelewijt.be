import {describe, it, expect} from 'vitest'
import {buildPreviewPath, hasPreviewPath} from './build-preview-path'

// One row per supported type, plus a missing slug and an unsupported type (#3660).
// `path` is `undefined` where the action must stay disabled or hidden.
const ROWS: ReadonlyArray<{
  label: string
  type: string
  slug: string | undefined
  path: string | undefined
}> = [
  {label: 'article', type: 'article', slug: 'mijn-artikel', path: '/nieuws/mijn-artikel'},
  {label: 'event', type: 'event', slug: 'jeugdkamp', path: '/evenementen/jeugdkamp'},
  {label: 'page', type: 'page', slug: 'sponsors', path: '/club/sponsors'},
  {label: 'photo gallery', type: 'photoGallery', slug: 'kerstfeest', path: '/galerij/kerstfeest'},
  {label: 'a missing slug', type: 'article', slug: undefined, path: undefined},
  {label: 'a blank slug', type: 'event', slug: '  ', path: undefined},
  {label: 'an unsupported type', type: 'team', slug: 'eerste-ploeg', path: undefined},
]

describe('buildPreviewPath', () => {
  it.each(ROWS)('$label: $type + $slug', ({type, slug, path}) => {
    expect(buildPreviewPath(type, slug)).toBe(path)
  })

  it('escapes characters that would change the path', () => {
    expect(buildPreviewPath('page', 'a/b?c')).toBe('/club/a%2Fb%3Fc')
  })
})

describe('hasPreviewPath', () => {
  it.each(['article', 'event', 'page', 'photoGallery'])('offers the action on %s', (type) => {
    expect(hasPreviewPath(type)).toBe(true)
  })

  it.each(['team', 'player', 'banner', 'homePage', 'toString'])(
    'does not offer the action on %s',
    (type) => {
      expect(hasPreviewPath(type)).toBe(false)
    },
  )
})
