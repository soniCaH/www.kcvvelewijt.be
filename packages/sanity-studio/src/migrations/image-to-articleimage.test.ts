import {at, set, unset} from 'sanity/migrate'
import {describe, expect, it} from 'vitest'
import {
  type ArticleWithImageBlocksDoc,
  migrateImageToArticleImage,
} from './image-to-articleimage'

describe('migrateImageToArticleImage', () => {
  it('returns undefined when body is missing', () => {
    expect(migrateImageToArticleImage({_id: 'no-body'})).toBeUndefined()
  })

  it('returns undefined when body is explicitly null', () => {
    expect(
      migrateImageToArticleImage({
        _id: 'null-body',
        body: null,
      } as unknown as ArticleWithImageBlocksDoc),
    ).toBeUndefined()
  })

  it('returns undefined when body has no `image` blocks', () => {
    const doc: ArticleWithImageBlocksDoc = {
      _id: 'no-images',
      body: [
        {_type: 'block', _key: 'b-1', children: []},
        {_type: 'qaBlock', _key: 'qb-1', pairs: []},
        {_type: 'transferFact', _key: 't-1'},
      ],
    }
    expect(migrateImageToArticleImage(doc)).toBeUndefined()
  })

  it('migrates a single legacy `image` block → articleImage with width: prose', () => {
    const doc: ArticleWithImageBlocksDoc = {
      _id: 'img-only',
      body: [
        {
          _type: 'image',
          _key: 'img-1',
          asset: {_ref: 'image-abc123', _type: 'reference'},
        },
      ],
    }
    expect(migrateImageToArticleImage(doc)).toEqual([
      at('body[_key=="img-1"]._type', set('articleImage')),
      at(
        'body[_key=="img-1"].image',
        set({
          _type: 'image',
          asset: {_ref: 'image-abc123', _type: 'reference'},
        }),
      ),
      at('body[_key=="img-1"].width', set('prose')),
      at('body[_key=="img-1"].asset', unset()),
    ])
  })

  it('preserves hotspot + crop when present and unsets the legacy root copies', () => {
    const doc: ArticleWithImageBlocksDoc = {
      _id: 'img-hotspot-crop',
      body: [
        {
          _type: 'image',
          _key: 'img-1',
          asset: {_ref: 'image-abc123', _type: 'reference'},
          hotspot: {x: 0.25, y: 0.4, height: 0.5, width: 0.5},
          crop: {top: 0.1, bottom: 0.1, left: 0.05, right: 0.05},
        },
      ],
    }
    expect(migrateImageToArticleImage(doc)).toEqual([
      at('body[_key=="img-1"]._type', set('articleImage')),
      at(
        'body[_key=="img-1"].image',
        set({
          _type: 'image',
          asset: {_ref: 'image-abc123', _type: 'reference'},
          hotspot: {x: 0.25, y: 0.4, height: 0.5, width: 0.5},
          crop: {top: 0.1, bottom: 0.1, left: 0.05, right: 0.05},
        }),
      ),
      at('body[_key=="img-1"].width', set('prose')),
      at('body[_key=="img-1"].asset', unset()),
      at('body[_key=="img-1"].hotspot', unset()),
      at('body[_key=="img-1"].crop', unset()),
    ])
  })

  it('preserves `alt` when present on the legacy block', () => {
    const doc: ArticleWithImageBlocksDoc = {
      _id: 'img-with-alt',
      body: [
        {
          _type: 'image',
          _key: 'img-1',
          asset: {_ref: 'image-abc123', _type: 'reference'},
          alt: 'Jonge spelers in actie',
        },
      ],
    }
    expect(migrateImageToArticleImage(doc)).toEqual([
      at('body[_key=="img-1"]._type', set('articleImage')),
      at(
        'body[_key=="img-1"].image',
        set({
          _type: 'image',
          asset: {_ref: 'image-abc123', _type: 'reference'},
        }),
      ),
      at('body[_key=="img-1"].alt', set('Jonge spelers in actie')),
      at('body[_key=="img-1"].width', set('prose')),
      at('body[_key=="img-1"].asset', unset()),
    ])
  })

  it('omits the alt patch when the legacy block has no alt', () => {
    const doc: ArticleWithImageBlocksDoc = {
      _id: 'img-no-alt',
      body: [
        {
          _type: 'image',
          _key: 'img-1',
          asset: {_ref: 'image-abc123', _type: 'reference'},
        },
      ],
    }
    const patches = migrateImageToArticleImage(doc)
    // No `.alt` set patch present at all (vs. setting an empty string).
    expect(patches).toBeDefined()
    expect(
      patches!.some((p) => JSON.stringify(p).includes('"path":"body[_key==\\"img-1\\"].alt"')),
    ).toBe(false)
  })

  it('migrates a mixed body — only `image` blocks are patched, articleImage and others are ignored', () => {
    const doc: ArticleWithImageBlocksDoc = {
      _id: 'mixed',
      body: [
        {_type: 'block', _key: 'para-1', children: []},
        {
          _type: 'image',
          _key: 'img-legacy',
          asset: {_ref: 'image-old', _type: 'reference'},
          alt: 'Legacy',
        },
        {
          _type: 'articleImage',
          _key: 'img-new',
          image: {asset: {_ref: 'image-new', _type: 'reference'}},
          width: 'wide',
        },
        {_type: 'qaBlock', _key: 'qb-1', pairs: []},
      ],
    }
    expect(migrateImageToArticleImage(doc)).toEqual([
      at('body[_key=="img-legacy"]._type', set('articleImage')),
      at(
        'body[_key=="img-legacy"].image',
        set({
          _type: 'image',
          asset: {_ref: 'image-old', _type: 'reference'},
        }),
      ),
      at('body[_key=="img-legacy"].alt', set('Legacy')),
      at('body[_key=="img-legacy"].width', set('prose')),
      at('body[_key=="img-legacy"].asset', unset()),
    ])
  })

  it('is idempotent — re-running on an already-migrated doc emits no patches', () => {
    const doc: ArticleWithImageBlocksDoc = {
      _id: 'already-migrated',
      body: [
        {
          _type: 'articleImage',
          _key: 'img-1',
          image: {asset: {_ref: 'image-abc123', _type: 'reference'}},
          alt: 'Already migrated',
          width: 'prose',
        },
      ],
    }
    expect(migrateImageToArticleImage(doc)).toBeUndefined()
  })

  it('skips legacy image blocks without a stable _key (no patch path)', () => {
    const doc: ArticleWithImageBlocksDoc = {
      _id: 'no-key',
      body: [
        // _key intentionally absent.
        {
          _type: 'image',
          asset: {_ref: 'image-abc123', _type: 'reference'},
        } as {
          _type: 'image'
          asset: {_ref: string; _type: string}
        },
      ],
    }
    expect(migrateImageToArticleImage(doc)).toBeUndefined()
  })

  it('handles multiple legacy image blocks in source order', () => {
    const doc: ArticleWithImageBlocksDoc = {
      _id: 'multi',
      body: [
        {_type: 'image', _key: 'img-1', asset: {_ref: 'image-1', _type: 'reference'}},
        {_type: 'block', _key: 'para', children: []},
        {_type: 'image', _key: 'img-2', asset: {_ref: 'image-2', _type: 'reference'}, alt: 'B'},
      ],
    }
    const patches = migrateImageToArticleImage(doc)
    expect(patches).toBeDefined()
    // The two image blocks each emit their patch set in source order.
    const stringified = patches!.map((p) => JSON.stringify(p)).join('\n')
    const idx1 = stringified.indexOf('img-1')
    const idx2 = stringified.indexOf('img-2')
    expect(idx1).toBeGreaterThanOrEqual(0)
    expect(idx2).toBeGreaterThan(idx1)
  })
})
