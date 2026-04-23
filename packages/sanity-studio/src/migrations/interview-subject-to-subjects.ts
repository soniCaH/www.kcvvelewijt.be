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
  const hasSubjectsArray = Array.isArray(doc.subjects)
  const legacySubject =
    doc.subject && typeof doc.subject === 'object' ? (doc.subject as Record<string, unknown>) : null

  // Already migrated — clean up legacy field if it stuck around.
  if (hasSubjectsArray) {
    if (legacySubject !== null) return [at('subject', unset())]
    return undefined
  }

  // Fresh migration: wrap the legacy object into an array with a _key.
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
