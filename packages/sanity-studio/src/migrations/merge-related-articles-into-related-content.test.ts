import {at, set, unset} from 'sanity/migrate'
import {describe, expect, it} from 'vitest'
import {
  type ArticleDoc,
  migrateMergeRelatedArticlesIntoRelatedContent,
} from './merge-related-articles-into-related-content'

const stableKey = (() => {
  let n = 0
  return () => `key-${++n}`
})

describe('migrateMergeRelatedArticlesIntoRelatedContent', () => {
  it('skips documents with no relatedArticles', () => {
    const doc: ArticleDoc = {_id: 'no-legacy'}
    expect(
      migrateMergeRelatedArticlesIntoRelatedContent(doc, stableKey()),
    ).toBeUndefined()
  })

  it('skips documents with empty relatedArticles array (no legacy data to copy)', () => {
    const doc: ArticleDoc = {_id: 'empty-legacy', relatedArticles: []}
    expect(
      migrateMergeRelatedArticlesIntoRelatedContent(doc, stableKey()),
    ).toBeUndefined()
  })

  it('copies legacy relatedArticles into empty relatedContent and unsets the legacy field', () => {
    const doc: ArticleDoc = {
      _id: 'fresh-migration',
      relatedArticles: [
        {_type: 'reference', _ref: 'art-1', _key: 'old-1'},
        {_type: 'reference', _ref: 'art-2', _key: 'old-2'},
      ],
    }
    const patches = migrateMergeRelatedArticlesIntoRelatedContent(
      doc,
      stableKey(),
    )
    expect(patches).toEqual([
      at(
        'relatedContent',
        set([
          {_key: 'key-1', _type: 'reference', _ref: 'art-1'},
          {_key: 'key-2', _type: 'reference', _ref: 'art-2'},
        ]),
      ),
      at('relatedArticles', unset()),
    ])
  })

  it('preserves existing relatedContent and appends only new refs from relatedArticles', () => {
    const doc: ArticleDoc = {
      _id: 'partial-migration',
      relatedContent: [
        {_type: 'reference', _ref: 'player-1', _key: 'rc-1'},
        {_type: 'reference', _ref: 'art-shared', _key: 'rc-2'},
      ],
      relatedArticles: [
        {_type: 'reference', _ref: 'art-shared', _key: 'old-1'},
        {_type: 'reference', _ref: 'art-new', _key: 'old-2'},
      ],
    }
    const patches = migrateMergeRelatedArticlesIntoRelatedContent(
      doc,
      stableKey(),
    )
    expect(patches).toEqual([
      at(
        'relatedContent',
        set([
          {_type: 'reference', _ref: 'player-1', _key: 'rc-1'},
          {_type: 'reference', _ref: 'art-shared', _key: 'rc-2'},
          {_key: 'key-1', _type: 'reference', _ref: 'art-new'},
        ]),
      ),
      at('relatedArticles', unset()),
    ])
  })

  it('preserves the order of relatedArticles when copying', () => {
    const doc: ArticleDoc = {
      _id: 'order-preservation',
      relatedArticles: [
        {_type: 'reference', _ref: 'art-c'},
        {_type: 'reference', _ref: 'art-a'},
        {_type: 'reference', _ref: 'art-b'},
      ],
    }
    const patches = migrateMergeRelatedArticlesIntoRelatedContent(
      doc,
      stableKey(),
    )
    const setOp = patches?.[0]
    expect(setOp).toEqual(
      at(
        'relatedContent',
        set([
          {_key: 'key-1', _type: 'reference', _ref: 'art-c'},
          {_key: 'key-2', _type: 'reference', _ref: 'art-a'},
          {_key: 'key-3', _type: 'reference', _ref: 'art-b'},
        ]),
      ),
    )
  })

  it('ignores malformed entries (no _ref) without aborting the migration', () => {
    const doc: ArticleDoc = {
      _id: 'malformed-mixed',
      relatedArticles: [
        {_type: 'reference', _ref: 'art-good', _key: 'g'},
        null,
        {_type: 'reference'},
        'not-an-object',
        {_type: 'reference', _ref: '', _key: 'empty'},
      ],
    }
    const patches = migrateMergeRelatedArticlesIntoRelatedContent(
      doc,
      stableKey(),
    )
    expect(patches).toEqual([
      at(
        'relatedContent',
        set([{_key: 'key-1', _type: 'reference', _ref: 'art-good'}]),
      ),
      at('relatedArticles', unset()),
    ])
  })

  it('dedupes legacy refs against each other before merging (defends against malformed input)', () => {
    const doc: ArticleDoc = {
      _id: 'duplicate-legacy-refs',
      relatedArticles: [
        {_type: 'reference', _ref: 'art-1'},
        {_type: 'reference', _ref: 'art-1'},
        {_type: 'reference', _ref: 'art-2'},
      ],
    }
    const patches = migrateMergeRelatedArticlesIntoRelatedContent(
      doc,
      stableKey(),
    )
    expect(patches).toEqual([
      at(
        'relatedContent',
        set([
          {_key: 'key-1', _type: 'reference', _ref: 'art-1'},
          {_key: 'key-2', _type: 'reference', _ref: 'art-2'},
        ]),
      ),
      at('relatedArticles', unset()),
    ])
  })

  it('is idempotent: re-running on an already-migrated doc returns undefined', () => {
    const doc: ArticleDoc = {
      _id: 'already-migrated',
      relatedContent: [{_type: 'reference', _ref: 'art-1', _key: 'rc-1'}],
      // relatedArticles already unset — pretend the previous run completed.
    }
    expect(
      migrateMergeRelatedArticlesIntoRelatedContent(doc, stableKey()),
    ).toBeUndefined()
  })

  it('uses the injected genKey function (determinism for testing)', () => {
    const doc: ArticleDoc = {
      _id: 'key-test',
      relatedArticles: [{_type: 'reference', _ref: 'art-1'}],
    }
    let n = 0
    const patches = migrateMergeRelatedArticlesIntoRelatedContent(
      doc,
      () => `injected-${++n}`,
    )
    expect(patches?.[0]).toEqual(
      at(
        'relatedContent',
        set([{_key: 'injected-1', _type: 'reference', _ref: 'art-1'}]),
      ),
    )
  })
})
