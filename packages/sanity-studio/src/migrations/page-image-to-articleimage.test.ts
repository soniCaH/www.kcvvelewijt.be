import type {SanityDocument} from 'sanity'
import {at, set, unset} from 'sanity/migrate'
import {describe, expect, it} from 'vitest'
import {migrateImageToArticleImage} from './image-to-articleimage'
import pageImageToArticleImageMigration from './page-image-to-articleimage'

// Sanity's `migrate.document` callback is typed against a full `SanityDocument`
// — stamp the system fields every real document carries so the synthetic
// fixtures satisfy the signature without an `as never` escape hatch.
const SYSTEM_FIELDS = {
  _createdAt: '2026-01-01T00:00:00Z',
  _updatedAt: '2026-01-01T00:00:00Z',
  _rev: 'rev-1',
} satisfies Pick<SanityDocument, '_createdAt' | '_updatedAt' | '_rev'>

describe('pageImageToArticleImageMigration', () => {
  it('targets only `page` documents', () => {
    expect(pageImageToArticleImageMigration.documentTypes).toEqual(['page'])
  })

  it('references the issue in its title', () => {
    expect(pageImageToArticleImageMigration.title).toContain('#2122')
  })

  it('delegates to the shared `migrateImageToArticleImage` transform', () => {
    // The page body uses the identical `image` → `articleImage` rule as the
    // article backfill, so the wrapper must emit exactly what the shared pure
    // function does for the same document.
    const doc = {
      ...SYSTEM_FIELDS,
      _id: 'page-1',
      _type: 'page',
      body: [
        {
          _type: 'image',
          _key: 'img-1',
          asset: {_ref: 'image-abc123', _type: 'reference'},
          alt: 'Sportpark Elewijt',
        },
      ],
    }

    expect(pageImageToArticleImageMigration.migrate.document?.(doc)).toEqual([
      at('body[_key=="img-1"]._type', set('articleImage')),
      at(
        'body[_key=="img-1"].image',
        set({_type: 'image', asset: {_ref: 'image-abc123', _type: 'reference'}}),
      ),
      at('body[_key=="img-1"].alt', set('Sportpark Elewijt')),
      at('body[_key=="img-1"].width', set('prose')),
      at('body[_key=="img-1"].asset', unset()),
    ])
    // Sanity check: identical output to the shared transform.
    expect(pageImageToArticleImageMigration.migrate.document?.(doc)).toEqual(
      migrateImageToArticleImage(doc),
    )
  })

  it('emits no patches for an already-migrated page (idempotent)', () => {
    const doc = {
      ...SYSTEM_FIELDS,
      _id: 'page-migrated',
      _type: 'page',
      body: [
        {
          _type: 'articleImage',
          _key: 'img-1',
          image: {asset: {_ref: 'image-abc123', _type: 'reference'}},
          width: 'prose',
        },
      ],
    }
    expect(pageImageToArticleImageMigration.migrate.document?.(doc)).toBeUndefined()
  })
})
