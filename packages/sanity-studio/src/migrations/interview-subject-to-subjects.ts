import {at, defineMigration, set, unset} from 'sanity/migrate'

/**
 * Shape-detection + patch description for the `subject` → `subjects[]`
 * migration on interview articles (#1358).
 *
 * Rules:
 *
 * - `subjects[]` already an array → skip (idempotent re-run). If a legacy
 *   `subject` field also lingers, queue an unset to clean it up.
 * - `subject` present as an object → wrap into `subjects: [subject]` with a
 *   generated `_key` and unset the legacy field.
 * - Neither shape present → skip. Covers non-interview articles and
 *   partially-authored interviews where no subject was set yet.
 *
 * Exported separately from `defineMigration` so unit tests can exercise the
 * branching against synthetic documents without needing a Sanity dataset.
 */
export interface InterviewArticleDoc {
  _id?: string
  _type?: string
  subject?: unknown
  subjects?: unknown
}

type Patch = ReturnType<typeof at>

const DEFAULT_KEY_LENGTH = 12
const KEY_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'

export function defaultGenKey(): string {
  let out = ''
  for (let i = 0; i < DEFAULT_KEY_LENGTH; i += 1) {
    out += KEY_ALPHABET[Math.floor(Math.random() * KEY_ALPHABET.length)]
  }
  return out
}

export function migrateInterviewSubjectToSubjects(
  doc: InterviewArticleDoc,
  genKey: () => string = defaultGenKey,
): Patch[] | undefined {
  const subjectsArr = Array.isArray(doc.subjects) ? doc.subjects : null
  // Arrays are `typeof === 'object'` — exclude them explicitly so a malformed
  // `subject: [...]` doesn't get spread as a numeric-indexed object.
  const legacySubject =
    doc.subject && typeof doc.subject === 'object' && !Array.isArray(doc.subject)
      ? (doc.subject as Record<string, unknown>)
      : null

  // Already migrated with at least one entry — clean up lingering legacy field.
  if (subjectsArr !== null && subjectsArr.length > 0) {
    if (legacySubject !== null) return [at('subject', unset())]
    return undefined
  }

  // Empty subjects[] + legacy object → wrap the legacy (data preservation).
  // The partial-state (subjects field set but empty, while legacy subject
  // holds the authored data) has been observed after half-applied manual
  // edits; treat it the same as a fresh migration.
  if (legacySubject !== null) {
    const wrapped: Record<string, unknown> = {
      _key: genKey(),
      ...legacySubject,
    }
    return [at('subjects', set([wrapped])), at('subject', unset())]
  }

  // Nothing to migrate.
  return undefined
}

export default defineMigration({
  title: 'Migrate article.subject → article.subjects[] for multi-subject interview support (#1358)',
  documentTypes: ['article'],

  migrate: {
    document(doc) {
      return migrateInterviewSubjectToSubjects(doc as InterviewArticleDoc)
    },
  },
})
