import {at, defineMigration, set, unset} from 'sanity/migrate'

/**
 * Shape-detection + patch description for the qaPair multi-respondent
 * migration (5.B.int). The legacy qaPair shape was:
 *
 *   { question, answer, tag, respondentKey }
 *
 * The new shape is:
 *
 *   { question, tag, respondents: [{ respondentKey, answer }] }
 *
 * Existing single-respondent pairs migrate into a 1-element `respondents`
 * array. The legacy `answer` + `respondentKey` fields are unset after the
 * migration runs so the schema (which no longer declares them) stays
 * authoritative.
 *
 * Idempotent: if `respondents` is already populated, the pair is left
 * alone. Useful for re-runs after partial application or when the
 * staging dataset is migrated before production.
 *
 * Exported separately from `defineMigration` so unit tests can exercise
 * the branching against synthetic documents without a Sanity dataset.
 */
export interface QaPairLike {
  _key?: string
  _type?: string
  answer?: unknown
  respondentKey?: unknown
  respondents?: unknown
}

export interface QaBlockLike {
  _key?: string
  _type?: string
  pairs?: unknown
}

export interface ArticleWithQaDoc {
  _id?: string
  _type?: string
  body?: unknown
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

function isQaBlock(value: unknown): value is QaBlockLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as {_type?: string})._type === 'qaBlock'
  )
}

function asQaPair(value: unknown): QaPairLike | null {
  if (typeof value !== 'object' || value === null) return null
  return value as QaPairLike
}

export function migrateQaPairRespondents(
  doc: ArticleWithQaDoc,
  genKey: () => string = defaultGenKey,
): Patch[] | undefined {
  const body = Array.isArray(doc.body) ? doc.body : null
  if (!body) return undefined

  const patches: Patch[] = []

  for (const blockRaw of body) {
    if (!isQaBlock(blockRaw)) continue
    const block = blockRaw
    const blockKey = block._key
    if (!blockKey) continue
    const pairs = Array.isArray(block.pairs) ? block.pairs : null
    if (!pairs) continue

    for (const pairRaw of pairs) {
      const pair = asQaPair(pairRaw)
      if (!pair?._key) continue

      const respondents = Array.isArray(pair.respondents) ? pair.respondents : null
      // Already migrated — skip. Idempotent re-run support.
      //
      // "Mixed-state" edge case (documented in PRD §11): a pair with
      // BOTH a populated `respondents[]` AND stale legacy `answer` /
      // `respondentKey` fields is treated as already migrated and the
      // orphan legacy fields are NOT unset by this script. They will
      // not render (the schema no longer declares them) but linger in
      // the document. Acceptable for the 4-document staging dataset
      // this targets; revisit if the migration ever runs at scale.
      if (respondents !== null && respondents.length > 0) continue

      // Legacy pair with an authored answer. Wrap into the new shape.
      // Empty/missing `answer` is treated as "nothing to migrate" and
      // skipped — schema validation will flag those when the editor
      // next opens the doc.
      const answer = pair.answer
      if (!Array.isArray(answer) || answer.length === 0) continue

      const respondentKey =
        typeof pair.respondentKey === 'string' && pair.respondentKey.length > 0
          ? pair.respondentKey
          : undefined

      const newEntry: Record<string, unknown> = {
        _type: 'qaPairRespondent',
        _key: genKey(),
        answer,
      }
      if (respondentKey) newEntry.respondentKey = respondentKey

      const pathRoot = `body[_key=="${blockKey}"].pairs[_key=="${pair._key}"]`
      patches.push(at(`${pathRoot}.respondents`, set([newEntry])))
      patches.push(at(`${pathRoot}.answer`, unset()))
      if (respondentKey) {
        patches.push(at(`${pathRoot}.respondentKey`, unset()))
      }
    }
  }

  return patches.length > 0 ? patches : undefined
}

export default defineMigration({
  title:
    'Migrate qaPair.{answer,respondentKey} → qaPair.respondents[] for multi-respondent support (#1795)',
  documentTypes: ['article'],

  migrate: {
    document(doc) {
      return migrateQaPairRespondents(doc as ArticleWithQaDoc)
    },
  },
})
