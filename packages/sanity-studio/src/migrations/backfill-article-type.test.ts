import {at, set} from 'sanity/migrate'
import {describe, expect, it} from 'vitest'
import {migrateBackfillArticleType} from './backfill-article-type'

describe('migrateBackfillArticleType', () => {
  it('skips an article that already has a type', () => {
    expect(migrateBackfillArticleType({articleType: 'interview'})).toBeUndefined()
  })

  it('backfills announcement when the type is missing', () => {
    expect(migrateBackfillArticleType({})).toEqual([at('articleType', set('announcement'))])
  })

  it('backfills announcement when the type is an empty string', () => {
    expect(migrateBackfillArticleType({articleType: ''})).toEqual([
      at('articleType', set('announcement')),
    ])
  })
})
