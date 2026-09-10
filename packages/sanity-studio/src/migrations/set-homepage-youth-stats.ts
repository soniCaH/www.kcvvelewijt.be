import {at, defineMigration, set} from 'sanity/migrate'

/**
 * Sets the jeugd-band stat line's two numbers on the `homePage` singleton
 * (#2401 item 4 / review finding 3).
 *
 * `youthPlayerCount`/`youthTeamCount` replaced a hardcoded
 * "220+ spelers · 16 ploegen" literal in `<YouthSection>` — the section now
 * renders the stat line only when BOTH fields are set, and omits it
 * entirely otherwise (Writer Rule: never a half-claim). Neither field has
 * ever been written on the existing `homePage` singleton in either
 * dataset, so without this migration the homepage silently loses the stat
 * line the moment the schema change deploys — precisely the failure this
 * ticket exists to stop from happening to a different fact.
 *
 * Seeds each missing field with the exact value the old literal rendered,
 * so the visible page is unchanged by the migration itself — only its data
 * source moves from code to Sanity. An editor can update either number
 * afterwards without this migration touching it again.
 *
 * Idempotent, per field: a document that already has a given field set
 * (by an editor, or by a prior run) keeps that value — only a genuinely
 * empty field gets the default. Re-running after every field is set
 * produces zero patches.
 *
 * Logic + tests live here so synthetic documents can exercise the
 * branching without a Sanity dataset; the CLI entry points re-export
 * `setHomepageYouthStatsMigration`.
 */
export const YOUTH_PLAYER_COUNT_DEFAULT = '220+'
export const YOUTH_TEAM_COUNT_DEFAULT = '16'

export interface HomePageWithYouthStatsDoc {
  _id?: string
  _type?: string
  youthPlayerCount?: string
  youthTeamCount?: string
}

type Patch = ReturnType<typeof at>

function isSet(value: string | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

export function migrateSetHomepageYouthStats(
  doc: HomePageWithYouthStatsDoc,
): Patch[] | undefined {
  const patches: Patch[] = []
  if (!isSet(doc.youthPlayerCount)) {
    patches.push(at('youthPlayerCount', set(YOUTH_PLAYER_COUNT_DEFAULT)))
  }
  if (!isSet(doc.youthTeamCount)) {
    patches.push(at('youthTeamCount', set(YOUTH_TEAM_COUNT_DEFAULT)))
  }
  return patches.length > 0 ? patches : undefined
}

export default defineMigration({
  title: 'Set homePage youth stats: youthPlayerCount/youthTeamCount (#2401)',
  documentTypes: ['homePage'],

  migrate: {
    document(doc) {
      return migrateSetHomepageYouthStats(doc as HomePageWithYouthStatsDoc)
    },
  },
})
