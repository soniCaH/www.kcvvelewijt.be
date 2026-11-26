import {at, defineMigration, unset} from 'sanity/migrate'

/**
 * Migration: unset the unused team `season` field (#2567).
 *
 * `season` was declared `readOnly: true` on the `team` schema but never had a
 * writer: it is absent from `PsdTeam` and never written by
 * `psd-sanity-sync.ts`. Measured 2026-08-17: 0 of 26 production team
 * documents (0 of 23 staging) carry a value. The field is dropped from the
 * schema; this migration `unset`s it on any document where it is somehow
 * present so the dataset matches the new schema.
 *
 * Idempotent: docs that have already had the field removed produce zero
 * patches and are left alone.
 *
 * Exported separately from `defineMigration` so unit tests can exercise the
 * branching against synthetic documents without a Sanity dataset.
 *
 * Note: the Sanity CLI defaults `migration run` to dry mode even *without*
 * `--dry-run` — pass `--no-dry-run` (and `--no-confirm` for a
 * non-interactive run) to actually commit. See the production/staging
 * wrapper facades (`apps/studio/migrations/drop-team-season/`,
 * `apps/studio-staging/migrations/drop-team-season/`) for the commands.
 */
export interface TeamWithSeasonDoc {
  _id?: string
  _type?: string
  season?: unknown
}

type Patch = ReturnType<typeof at>

export const migrateDropTeamSeason = (doc: TeamWithSeasonDoc): Patch[] | undefined => {
  if (doc.season === undefined) return undefined
  return [at('season', unset())]
}

export default defineMigration({
  title: 'Drop unused team field: season (#2567)',
  documentTypes: ['team'],

  migrate: {
    document(doc) {
      return migrateDropTeamSeason(doc as TeamWithSeasonDoc)
    },
  },
})
