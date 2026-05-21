import {at, defineMigration, unset} from 'sanity/migrate'

/**
 * Migration: unset three unused player fields (#1881).
 *
 * Phase 6.A redesign drops `nationality`, `height`, and `weight` from the
 * player schema. The fields exist on the document type today; removing the
 * `defineField` declarations leaves the values orphaned on existing docs.
 * This migration `unset`s those three fields so the dataset matches the new
 * schema.
 *
 * Idempotent: docs that have already had the fields removed produce zero
 * patches and are left alone.
 *
 * Exported separately from `defineMigration` so unit tests can exercise the
 * branching against synthetic documents without a Sanity dataset.
 */
export interface PlayerWithUnusedFieldsDoc {
  _id?: string
  _type?: string
  nationality?: unknown
  height?: unknown
  weight?: unknown
}

type Patch = ReturnType<typeof at>

const FIELDS = ['nationality', 'height', 'weight'] as const

export function migrateDropPlayerUnusedFields(
  doc: PlayerWithUnusedFieldsDoc,
): Patch[] | undefined {
  const patches: Patch[] = []
  for (const field of FIELDS) {
    if (doc[field] !== undefined) {
      patches.push(at(field, unset()))
    }
  }
  return patches.length > 0 ? patches : undefined
}

export default defineMigration({
  title: 'Drop unused player fields: nationality, height, weight (#1881)',
  documentTypes: ['player'],

  migrate: {
    document(doc) {
      return migrateDropPlayerUnusedFields(doc as PlayerWithUnusedFieldsDoc)
    },
  },
})
