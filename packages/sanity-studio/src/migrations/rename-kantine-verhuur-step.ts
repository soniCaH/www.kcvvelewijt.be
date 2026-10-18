import {at, defineMigration, set} from 'sanity/migrate'

/**
 * Migration: the hulp question "Terrein of kantine huren" names the box
 * "Kantineverhuur" instead of "Kantine & Evenementen" in its step text (#3525).
 *
 * The organigram box was split on 2026-10-17 (Kantineverhuur and the new
 * Evenementen box). Only this one question is rewritten, matched on its
 * internal title; other questions that mention "Kantine & Evenementen" still
 * point at the old combined box and are not part of this change.
 *
 * Idempotent: once the text is renamed the step no longer matches and no patch
 * is produced.
 *
 * Note: the Sanity CLI defaults `migration run` to dry mode even *without*
 * `--dry-run` — pass `--no-dry-run` (and `--no-confirm` for a non-interactive
 * run) to actually commit. See the production/staging wrapper facades
 * (`apps/studio/migrations/rename-kantine-verhuur-step/`,
 * `apps/studio-staging/migrations/rename-kantine-verhuur-step/`) for the commands.
 */
export interface KantineVerhuurResponsibilityDoc {
  _id?: string
  _type?: string
  title?: string
  steps?: Array<{_key?: string; description?: string}>
}

type Patch = ReturnType<typeof at>

const QUESTION_TITLE = 'Terrein of kantine huren'
const OLD_NAME = 'Kantine & Evenementen'
const NEW_NAME = 'Kantineverhuur'

export function migrateRenameKantineVerhuurStep(doc: KantineVerhuurResponsibilityDoc): Patch[] | undefined {
  if (doc.title !== QUESTION_TITLE) return undefined

  const patches = (doc.steps ?? []).flatMap((step) =>
    step._key && step.description?.includes(OLD_NAME)
      ? [at(`steps[_key=="${step._key}"].description`, set(step.description.split(OLD_NAME).join(NEW_NAME)))]
      : [],
  )
  return patches.length > 0 ? patches : undefined
}

export default defineMigration({
  title: 'Rename "Kantine & Evenementen" to "Kantineverhuur" in the huren question (#3525)',
  documentTypes: ['responsibility'],

  migrate: {
    document(doc) {
      return migrateRenameKantineVerhuurStep(doc as KantineVerhuurResponsibilityDoc)
    },
  },
})
