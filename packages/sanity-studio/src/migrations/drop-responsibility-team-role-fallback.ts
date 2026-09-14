import {at, defineMigration, unset} from 'sanity/migrate'

/**
 * Migration: unset the unreachable `teamRoleFallback` field on `responsibility`
 * documents (#2952).
 *
 * `teamRoleFallback` is dropped from the schema — it is dead by construction,
 * not just currently unused: `packages/sanity-schemas/src/validation/contact-fields.ts`
 * makes `teamRole` required whenever `contactType === 'team-role'`, so
 * `contact.teamRole ?? contact.teamRoleFallback` in `resolveContact.ts` can
 * never take the fallback branch on a document saved through Studio.
 *
 * Measured 2026-09-14 against the public dataset: 2 of production's
 * `responsibility` documents carry `primaryContact.teamRoleFallback`
 * (`responsibility-afgelasting`, `responsibility-trainingsuren-kalender`,
 * both `teamRole: "afgevaardigde"` / `teamRoleFallback: "trainer"`); 0 of
 * staging's do. Nested `steps[].contact.teamRoleFallback` is 0 on both
 * datasets today, but this migration unsets it wherever it appears anyway —
 * a migration that only handles the shape currently measured is a migration
 * that misses the next document.
 *
 * Idempotent: docs (and step contacts) that have already had the field
 * removed produce zero patches and are left alone.
 *
 * Exported separately from `defineMigration` so unit tests can exercise the
 * branching against synthetic documents without a Sanity dataset.
 *
 * Note: the Sanity CLI defaults `migration run` to dry mode even *without*
 * `--dry-run` — pass `--no-dry-run` (and `--no-confirm` for a
 * non-interactive run) to actually commit. See the production/staging
 * wrapper facades (`apps/studio/migrations/drop-responsibility-team-role-fallback/`,
 * `apps/studio-staging/migrations/drop-responsibility-team-role-fallback/`)
 * for the commands.
 */
export interface ResponsibilityStepContactLike {
  teamRoleFallback?: unknown
}

export interface ResponsibilityStepLike {
  _key?: string
  contact?: ResponsibilityStepContactLike
}

export interface ResponsibilityWithTeamRoleFallbackDoc {
  _id?: string
  _type?: string
  primaryContact?: {
    teamRoleFallback?: unknown
  }
  steps?: ResponsibilityStepLike[]
}

type Patch = ReturnType<typeof at>

export function migrateDropResponsibilityTeamRoleFallback(
  doc: ResponsibilityWithTeamRoleFallbackDoc,
): Patch[] | undefined {
  const patches: Patch[] = []

  if (doc.primaryContact?.teamRoleFallback !== undefined) {
    patches.push(at('primaryContact.teamRoleFallback', unset()))
  }

  const steps = Array.isArray(doc.steps) ? doc.steps : []
  steps.forEach((step, index) => {
    if (step?.contact?.teamRoleFallback === undefined) return
    if (!step._key) {
      // Can't build a stable patch path without a _key — same guard as the
      // peer `qa-pair-respondents.ts`. Unmeasured on both datasets today
      // (0 step-level occurrences), but stay loud about it rather than
      // silently leaving the orphan field in place forever.
      console.warn(
        `[drop-responsibility-team-role-fallback] doc ${doc._id ?? '(unknown id)'}: steps[${index}].contact.teamRoleFallback is set but the step has no _key — skipping, field left in place`,
      )
      return
    }
    patches.push(at(`steps[_key=="${step._key}"].contact.teamRoleFallback`, unset()))
  })

  return patches.length > 0 ? patches : undefined
}

export default defineMigration({
  title: 'Drop unreachable responsibility field: teamRoleFallback (#2952)',
  documentTypes: ['responsibility'],

  migrate: {
    document(doc) {
      return migrateDropResponsibilityTeamRoleFallback(
        doc as ResponsibilityWithTeamRoleFallbackDoc,
      )
    },
  },
})
