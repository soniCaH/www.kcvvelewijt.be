import {at, defineMigration, unset} from 'sanity/migrate'

/**
 * Migration: unset the deleted team `trainingSchedule` field (#2582).
 *
 * `trainingSchedule` (and its `trainingSession` object type) was removed
 * from the schema — training times live in PSD and members are sent there
 * (#2476 rule 10). Measured 2026-09-07: 0 of 26 production team documents
 * carry the field, but 1 of the staging dataset's does (2 sessions). This
 * migration `unset`s it on any document where it is somehow present so
 * the dataset matches the schema.
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
 * wrapper facades (`apps/studio/migrations/drop-team-training-schedule/`,
 * `apps/studio-staging/migrations/drop-team-training-schedule/`) for the
 * commands.
 */
export interface TeamWithTrainingScheduleDoc {
  _id?: string
  _type?: string
  trainingSchedule?: unknown
}

type Patch = ReturnType<typeof at>

export const migrateDropTeamTrainingSchedule = (
  doc: TeamWithTrainingScheduleDoc,): Patch[] | undefined => {
  if (doc.trainingSchedule === undefined) return undefined
  return [at('trainingSchedule', unset())]
};

export default defineMigration({
  title: 'Drop deleted team field: trainingSchedule (#2582)',
  documentTypes: ['team'],

  migrate: {
    document(doc) {
      return migrateDropTeamTrainingSchedule(doc as TeamWithTrainingScheduleDoc)
    },
  },
})
