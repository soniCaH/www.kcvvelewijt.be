import {at, defineMigration, set} from 'sanity/migrate'

/**
 * Migration: backfill `organigramNode.pillar` and seed the key-figure why-lines (#3525).
 *
 * `/hulp` groups the structuur by pillar, a field editors now choose in Studio.
 * This sets `pillar` from today's `roleCode` (table approved with prototype A7)
 * and seeds `description` on the 8 key boxes with the approved "why" line.
 *
 * Only fills gaps: a `pillar` or a non-blank `description` an editor already
 * wrote is never replaced, so a re-run — or a run after editors started on
 * Studio — is safe. A box whose role code is not in the table is left without
 * a pillar on purpose; it shows under "Overige functies" with a Studio warning.
 *
 * Exported separately from `defineMigration` so unit tests can exercise the
 * branching against synthetic documents without a Sanity dataset.
 *
 * Note: the Sanity CLI defaults `migration run` to dry mode even *without*
 * `--dry-run` — pass `--no-dry-run` (and `--no-confirm` for a non-interactive
 * run) to actually commit. See the production/staging wrapper facades
 * (`apps/studio/migrations/backfill-organigram-pillar/`,
 * `apps/studio-staging/migrations/backfill-organigram-pillar/`) for the commands.
 */
export interface OrganigramNodeDoc {
  _id?: string
  _type?: string
  roleCode?: string
  pillar?: string
  description?: string
}

type Patch = ReturnType<typeof at>

export const PILLAR_BY_ROLE_CODE: Readonly<Record<string, string>> = {
  VZ: 'bestuur',
  SEC: 'bestuur',
  PEN: 'bestuur',
  GC: 'bestuur',
  BST: 'bestuur',
  TD: 'sportief',
  'T1-A': 'sportief',
  'T2-A': 'sportief',
  'KT-F': 'sportief',
  'T1-B': 'sportief',
  'T2-B': 'sportief',
  'DS-B': 'sportief',
  POST: 'sportief',
  SCO: 'sportief',
  JVZ: 'jeugd-organisatie',
  JSEC: 'jeugd-organisatie',
  AFG: 'jeugd-organisatie',
  STA: 'jeugd-organisatie',
  REF: 'jeugd-organisatie',
  MAT: 'jeugd-organisatie',
  KAN: 'jeugd-organisatie',
  GDPR: 'jeugd-organisatie',
  JBL: 'jeugd-organisatie',
  TVJO: 'jeugd-opleiding',
  'JC-OB': 'jeugd-opleiding',
  'JC-MB': 'jeugd-opleiding',
  'JC-BB': 'jeugd-opleiding',
  'KT-J': 'jeugd-opleiding',
  VID: 'jeugd-opleiding',
  KIN: 'jeugd-opleiding',
  PSD: 'jeugd-opleiding',
  SPO: 'club',
  KLE: 'club',
  INF: 'club',
  'K&E': 'club',
  EVT: 'club',
  WEB: 'club',
  API: 'integriteit',
  EC: 'integriteit',
}

/** The 8 key boxes' "why" lines. Which boxes form the top row is design and lives in the web app. */
export const KEY_BOX_WHY_LINES: Readonly<Record<string, string>> = {
  VZ: 'Eindverantwoordelijke van de club',
  SEC: 'Post, verslagen, de vzw',
  PEN: 'Lidgeld, facturen, budget',
  TD: 'A- en B-elftal',
  JVZ: 'Alles rond de jeugdwerking',
  TVJO: 'Opleiding en trainers jeugd',
  GC: 'Officieel contact met de bond',
  API: 'Vertrouwenspersoon integriteit',
}

export function migrateBackfillOrganigramPillar(doc: OrganigramNodeDoc): Patch[] | undefined {
  const code = doc.roleCode
  if (!code) return undefined

  const patches: Patch[] = []

  const pillar = PILLAR_BY_ROLE_CODE[code]
  if (pillar && !doc.pillar) patches.push(at('pillar', set(pillar)))

  const why = KEY_BOX_WHY_LINES[code]
  if (why && !doc.description?.trim()) patches.push(at('description', set(why)))

  return patches.length > 0 ? patches : undefined
}

export default defineMigration({
  title: 'Backfill organigramNode.pillar and key-box why-lines (#3525)',
  documentTypes: ['organigramNode'],

  migrate: {
    document(doc) {
      return migrateBackfillOrganigramPillar(doc as OrganigramNodeDoc)
    },
  },
})
