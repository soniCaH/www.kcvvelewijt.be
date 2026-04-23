import {at, set, unset} from 'sanity/migrate'
import {describe, expect, it} from 'vitest'
import {
  type InterviewArticleDoc,
  migrateInterviewSubjectToSubjects,
} from './interview-subject-to-subjects'

const stableKey = () => 'fixed-migration-key'

describe('migrateInterviewSubjectToSubjects', () => {
  it('skips documents with no subject and no subjects', () => {
    const doc: InterviewArticleDoc = {_id: 'no-subject'}
    expect(migrateInterviewSubjectToSubjects(doc, stableKey)).toBeUndefined()
  })

  it('skips documents already migrated (subjects[] set, no legacy subject)', () => {
    const doc: InterviewArticleDoc = {
      _id: 'already-migrated',
      subjects: [{_key: 'a', kind: 'player', playerRef: {_ref: 'p-1'}}],
    }
    expect(migrateInterviewSubjectToSubjects(doc, stableKey)).toBeUndefined()
  })

  it('cleans up a dangling legacy subject when subjects[] already exists', () => {
    const doc: InterviewArticleDoc = {
      _id: 'dangling-legacy',
      subjects: [{_key: 'a', kind: 'player', playerRef: {_ref: 'p-1'}}],
      subject: {kind: 'player', playerRef: {_ref: 'p-legacy'}},
    }
    const patches = migrateInterviewSubjectToSubjects(doc, stableKey)
    expect(patches).toEqual([at('subject', unset())])
  })

  it('wraps a legacy player subject into subjects[] with a generated _key', () => {
    const legacy = {kind: 'player', playerRef: {_ref: 'p-1'}}
    const doc: InterviewArticleDoc = {_id: 'needs-migration', subject: legacy}
    const patches = migrateInterviewSubjectToSubjects(doc, stableKey)
    expect(patches).toEqual([
      at('subjects', set([{_key: 'fixed-migration-key', kind: 'player', playerRef: {_ref: 'p-1'}}])),
      at('subject', unset()),
    ])
  })

  it('wraps a legacy custom subject preserving customName/photo/role fields', () => {
    const legacy = {
      kind: 'custom',
      customName: 'Coach X',
      customRole: 'Trainer',
      customPhoto: {_type: 'image', asset: {_ref: 'image-asset'}},
    }
    const doc: InterviewArticleDoc = {_id: 'custom-legacy', subject: legacy}
    const patches = migrateInterviewSubjectToSubjects(doc, stableKey)
    expect(patches).toEqual([
      at(
        'subjects',
        set([
          {
            _key: 'fixed-migration-key',
            kind: 'custom',
            customName: 'Coach X',
            customRole: 'Trainer',
            customPhoto: {_type: 'image', asset: {_ref: 'image-asset'}},
          },
        ]),
      ),
      at('subject', unset()),
    ])
  })

  it('ignores a non-object legacy subject (malformed data — log + skip)', () => {
    const doc: InterviewArticleDoc = {_id: 'malformed', subject: 'not-an-object'}
    expect(migrateInterviewSubjectToSubjects(doc, stableKey)).toBeUndefined()
  })

  it('ignores a null legacy subject', () => {
    const doc: InterviewArticleDoc = {_id: 'null-subject', subject: null}
    expect(migrateInterviewSubjectToSubjects(doc, stableKey)).toBeUndefined()
  })

  it('uses the injected genKey function (determinism for testing)', () => {
    const legacy = {kind: 'player', playerRef: {_ref: 'p-1'}}
    const doc: InterviewArticleDoc = {_id: 'key-test', subject: legacy}
    const patches = migrateInterviewSubjectToSubjects(doc, () => 'custom-key-1234')
    expect(patches?.[0]).toEqual(
      at('subjects', set([{_key: 'custom-key-1234', kind: 'player', playerRef: {_ref: 'p-1'}}])),
    )
  })
})
