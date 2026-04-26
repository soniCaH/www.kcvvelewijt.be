import {at, set} from 'sanity/migrate'
import {describe, expect, it} from 'vitest'
import {
  type EventDoc,
  migrateBackfillEventSlug,
  slugifyTitle,
} from './backfill-event-slug'

describe('slugifyTitle', () => {
  it('lowercases and dasherises ASCII titles', () => {
    expect(slugifyTitle('Spaghetti Avond 2026')).toBe('spaghetti-avond-2026')
  })

  it('strips diacritics', () => {
    expect(slugifyTitle('Café-feest élève')).toBe('cafe-feest-eleve')
  })

  it('expands ampersand to the Dutch conjunction', () => {
    expect(slugifyTitle('BBQ & Tombola')).toBe('bbq-en-tombola')
  })

  it('collapses runs of non-alphanumeric characters into one dash', () => {
    expect(slugifyTitle('Hello, world!  --  goodbye?')).toBe(
      'hello-world-goodbye',
    )
  })

  it('trims leading and trailing dashes', () => {
    expect(slugifyTitle('  --hello world--  ')).toBe('hello-world')
  })

  it('truncates to maxLength without trailing dash', () => {
    const long = 'a'.repeat(50) + '-' + 'b'.repeat(50)
    const slug = slugifyTitle(long, 51)
    expect(slug.length).toBeLessThanOrEqual(51)
    expect(slug.endsWith('-')).toBe(false)
  })

  it('returns an empty string for purely non-alphanumeric titles', () => {
    expect(slugifyTitle('!!! ??? ---')).toBe('')
  })
})

describe('migrateBackfillEventSlug', () => {
  it('skips events that already have a non-empty slug', () => {
    const doc: EventDoc = {
      _id: 'evt-1',
      title: 'Spaghetti-avond',
      slug: {_type: 'slug', current: 'existing-slug'},
    }
    expect(migrateBackfillEventSlug(doc)).toBeUndefined()
  })

  it('records existing slugs into the seen-set so later events do not collide with them', () => {
    const seen = new Set<string>()
    migrateBackfillEventSlug(
      {
        _id: 'evt-existing',
        title: 'Spaghetti-avond',
        slug: {_type: 'slug', current: 'spaghetti-avond'},
      },
      seen,
    )
    expect(
      migrateBackfillEventSlug(
        {_id: 'evt-new', title: 'Spaghetti-avond'},
        seen,
      ),
    ).toEqual([at('slug', set({_type: 'slug', current: 'spaghetti-avond-2'}))])
  })

  it('skips events without a title', () => {
    const doc: EventDoc = {_id: 'evt-2'}
    expect(migrateBackfillEventSlug(doc)).toBeUndefined()
  })

  it('skips events whose title slugifies to an empty string', () => {
    const doc: EventDoc = {_id: 'evt-3', title: '!!!'}
    expect(migrateBackfillEventSlug(doc)).toBeUndefined()
  })

  it('treats an existing slug with empty current as missing and backfills', () => {
    const doc: EventDoc = {
      _id: 'evt-4',
      title: 'Seizoensopener 2026',
      slug: {_type: 'slug', current: ''},
    }
    expect(migrateBackfillEventSlug(doc)).toEqual([
      at('slug', set({_type: 'slug', current: 'seizoensopener-2026'})),
    ])
  })

  it('emits a slug patch when title is set and slug is missing', () => {
    const doc: EventDoc = {_id: 'evt-5', title: 'Café-feest 2026'}
    expect(migrateBackfillEventSlug(doc)).toEqual([
      at('slug', set({_type: 'slug', current: 'cafe-feest-2026'})),
    ])
  })

  it('does not regenerate when the same doc already has the slug we would have allocated', () => {
    const seen = new Set<string>()
    expect(
      migrateBackfillEventSlug({_id: 'first', title: 'Spaghetti-avond'}, seen),
    ).toEqual([at('slug', set({_type: 'slug', current: 'spaghetti-avond'}))])
    expect(
      migrateBackfillEventSlug(
        {
          _id: 'second',
          title: 'Spaghetti-avond',
          slug: {_type: 'slug', current: 'spaghetti-avond'},
        },
        seen,
      ),
    ).toBeUndefined()
  })

  it('appends -2, -3 suffixes for repeat titles within a single run', () => {
    const seen = new Set<string>()
    expect(
      migrateBackfillEventSlug({_id: 'a', title: 'Spaghetti-avond'}, seen),
    ).toEqual([at('slug', set({_type: 'slug', current: 'spaghetti-avond'}))])
    expect(
      migrateBackfillEventSlug({_id: 'b', title: 'Spaghetti-avond'}, seen),
    ).toEqual([at('slug', set({_type: 'slug', current: 'spaghetti-avond-2'}))])
    expect(
      migrateBackfillEventSlug({_id: 'c', title: 'Spaghetti-avond'}, seen),
    ).toEqual([at('slug', set({_type: 'slug', current: 'spaghetti-avond-3'}))])
  })
})
