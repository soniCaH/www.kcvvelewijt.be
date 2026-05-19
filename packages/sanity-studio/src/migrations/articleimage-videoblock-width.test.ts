import {at, set, unset} from 'sanity/migrate'
import {describe, expect, it} from 'vitest'
import {
  type ArticleWithWidthBlocksDoc,
  migrateArticleImageVideoBlockWidth,
} from './articleimage-videoblock-width'

describe('migrateArticleImageVideoBlockWidth', () => {
  it('returns undefined when body is missing', () => {
    expect(migrateArticleImageVideoBlockWidth({_id: 'no-body'})).toBeUndefined()
  })

  it('returns undefined when body is explicitly null', () => {
    expect(
      migrateArticleImageVideoBlockWidth({
        _id: 'null-body',
        body: null,
      } as unknown as ArticleWithWidthBlocksDoc),
    ).toBeUndefined()
  })

  it('returns undefined when body has no articleImage/videoBlock entries', () => {
    const doc: ArticleWithWidthBlocksDoc = {
      _id: 'no-targets',
      body: [
        {_type: 'block', _key: 'b-1', children: []},
        {_type: 'qaBlock', _key: 'qb-1', pairs: []},
        {_type: 'transferFact', _key: 't-1'},
      ],
    }
    expect(migrateArticleImageVideoBlockWidth(doc)).toBeUndefined()
  })

  it('migrates an articleImage with fullBleed: true → width: bleed', () => {
    const doc: ArticleWithWidthBlocksDoc = {
      _id: 'img-bleed',
      body: [
        {
          _type: 'articleImage',
          _key: 'img-1',
          fullBleed: true,
        },
      ],
    }
    expect(migrateArticleImageVideoBlockWidth(doc)).toEqual([
      at('body[_key=="img-1"].width', set('bleed')),
      at('body[_key=="img-1"].fullBleed', unset()),
    ])
  })

  it('migrates an articleImage with fullBleed: false → width: prose', () => {
    const doc: ArticleWithWidthBlocksDoc = {
      _id: 'img-prose',
      body: [
        {
          _type: 'articleImage',
          _key: 'img-1',
          fullBleed: false,
        },
      ],
    }
    expect(migrateArticleImageVideoBlockWidth(doc)).toEqual([
      at('body[_key=="img-1"].width', set('prose')),
      at('body[_key=="img-1"].fullBleed', unset()),
    ])
  })

  it('migrates an articleImage with missing fullBleed → width: prose (still unsets the legacy field)', () => {
    const doc: ArticleWithWidthBlocksDoc = {
      _id: 'img-missing',
      body: [
        {
          _type: 'articleImage',
          _key: 'img-1',
          // fullBleed intentionally absent
        },
      ],
    }
    expect(migrateArticleImageVideoBlockWidth(doc)).toEqual([
      at('body[_key=="img-1"].width', set('prose')),
      // Always unset legacy field even when source had none — Sanity
      // stores `false`/`null` as real values distinct from "not set".
      at('body[_key=="img-1"].fullBleed', unset()),
    ])
  })

  it('migrates a videoBlock with fullBleed: true → width: bleed', () => {
    const doc: ArticleWithWidthBlocksDoc = {
      _id: 'vid-bleed',
      body: [
        {
          _type: 'videoBlock',
          _key: 'vid-1',
          fullBleed: true,
        },
      ],
    }
    expect(migrateArticleImageVideoBlockWidth(doc)).toEqual([
      at('body[_key=="vid-1"].width', set('bleed')),
      at('body[_key=="vid-1"].fullBleed', unset()),
    ])
  })

  it('migrates a videoBlock with missing fullBleed → width: prose', () => {
    const doc: ArticleWithWidthBlocksDoc = {
      _id: 'vid-missing',
      body: [
        {
          _type: 'videoBlock',
          _key: 'vid-1',
        },
      ],
    }
    expect(migrateArticleImageVideoBlockWidth(doc)).toEqual([
      at('body[_key=="vid-1"].width', set('prose')),
      at('body[_key=="vid-1"].fullBleed', unset()),
    ])
  })

  it('emits patches for a mix of articleImage and videoBlock in one article', () => {
    const doc: ArticleWithWidthBlocksDoc = {
      _id: 'mixed',
      body: [
        {_type: 'articleImage', _key: 'img-1', fullBleed: true},
        {_type: 'block', _key: 'para', children: []},
        {_type: 'videoBlock', _key: 'vid-1', fullBleed: false},
        {_type: 'articleImage', _key: 'img-2'},
      ],
    }
    expect(migrateArticleImageVideoBlockWidth(doc)).toEqual([
      at('body[_key=="img-1"].width', set('bleed')),
      at('body[_key=="img-1"].fullBleed', unset()),
      at('body[_key=="vid-1"].width', set('prose')),
      at('body[_key=="vid-1"].fullBleed', unset()),
      at('body[_key=="img-2"].width', set('prose')),
      at('body[_key=="img-2"].fullBleed', unset()),
    ])
  })

  it('is idempotent — skips blocks that already have width set, even if fullBleed lingers', () => {
    const doc: ArticleWithWidthBlocksDoc = {
      _id: 'already-migrated',
      body: [
        {_type: 'articleImage', _key: 'img-1', width: 'wide'},
        {_type: 'videoBlock', _key: 'vid-1', width: 'bleed', fullBleed: true},
      ],
    }
    expect(migrateArticleImageVideoBlockWidth(doc)).toBeUndefined()
  })

  it('skips target blocks that are missing their _key (no stable patch path)', () => {
    const doc: ArticleWithWidthBlocksDoc = {
      _id: 'no-key',
      body: [
        // _key intentionally absent — can't construct a stable patch path.
        {_type: 'articleImage', fullBleed: true} as {
          _type: 'articleImage'
          fullBleed: boolean
        },
      ],
    }
    expect(migrateArticleImageVideoBlockWidth(doc)).toBeUndefined()
  })

  it('ignores non-target block types entirely (qaBlock, transferFact, plain block)', () => {
    const doc: ArticleWithWidthBlocksDoc = {
      _id: 'ignore-non-targets',
      body: [
        {_type: 'qaBlock', _key: 'qb-1'},
        {_type: 'transferFact', _key: 't-1'},
        {_type: 'block', _key: 'b-1', children: []},
      ],
    }
    expect(migrateArticleImageVideoBlockWidth(doc)).toBeUndefined()
  })
})
