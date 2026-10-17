import {at, set} from 'sanity/migrate'
import {describe, expect, it} from 'vitest'
import {
  KEY_BOX_WHY_LINES,
  PILLAR_BY_ROLE_CODE,
  migrateBackfillOrganigramPillar,
  type OrganigramNodeDoc,
} from './backfill-organigram-pillar'

const node = (over: Partial<OrganigramNodeDoc>): OrganigramNodeDoc => ({
  _id: 'n-1',
  _type: 'organigramNode',
  ...over,
})

describe('migrateBackfillOrganigramPillar', () => {
  it('sets the pillar from the role code', () => {
    expect(migrateBackfillOrganigramPillar(node({roleCode: 'T1-A'}))).toEqual([
      at('pillar', set('sportief')),
    ])
  })

  it('places every role code of the approved table in its pillar', () => {
    const expected: Record<string, string[]> = {
      bestuur: ['VZ', 'SEC', 'PEN', 'GC', 'BST'],
      sportief: ['TD', 'T1-A', 'T2-A', 'KT-F', 'T1-B', 'T2-B', 'DS-B', 'POST', 'SCO'],
      'jeugd-organisatie': ['JVZ', 'JSEC', 'AFG', 'STA', 'REF', 'MAT', 'KAN', 'GDPR', 'JBL'],
      'jeugd-opleiding': ['TVJO', 'JC-OB', 'JC-MB', 'JC-BB', 'KT-J', 'VID', 'KIN', 'PSD'],
      club: ['SPO', 'KLE', 'INF', 'K&E', 'EVT', 'WEB'],
      integriteit: ['API', 'EC'],
    }
    const flat = Object.entries(expected).flatMap(([pillar, codes]) =>
      codes.map((code) => [code, pillar] as const),
    )
    expect(Object.keys(PILLAR_BY_ROLE_CODE)).toHaveLength(flat.length)
    for (const [code, pillar] of flat) expect(PILLAR_BY_ROLE_CODE[code]).toBe(pillar)
  })

  it('leaves a pillar an editor already chose alone', () => {
    expect(migrateBackfillOrganigramPillar(node({roleCode: 'T1-A', pillar: 'club'}))).toBeUndefined()
  })

  it('leaves a box with an unknown or missing role code without a pillar', () => {
    expect(migrateBackfillOrganigramPillar(node({roleCode: 'XYZ'}))).toBeUndefined()
    expect(migrateBackfillOrganigramPillar(node({}))).toBeUndefined()
  })

  it('seeds the why-line on a key box with an empty description, next to its pillar', () => {
    expect(migrateBackfillOrganigramPillar(node({roleCode: 'SEC'}))).toEqual([
      at('pillar', set('bestuur')),
      at('description', set('Post, verslagen, de vzw')),
    ])
  })

  it('seeds every approved why-line', () => {
    expect(KEY_BOX_WHY_LINES).toEqual({
      VZ: 'Eindverantwoordelijke van de club',
      SEC: 'Post, verslagen, de vzw',
      PEN: 'Lidgeld, facturen, budget',
      TD: 'A- en B-elftal',
      JVZ: 'Alles rond de jeugdwerking',
      TVJO: 'Opleiding en trainers jeugd',
      GC: 'Officieel contact met de bond',
      API: 'Vertrouwenspersoon integriteit',
    })
  })

  it('treats a blank description as empty', () => {
    const patches = migrateBackfillOrganigramPillar(node({roleCode: 'PEN', pillar: 'bestuur', description: '  '}))
    expect(patches).toEqual([at('description', set('Lidgeld, facturen, budget'))])
  })

  it('never overwrites a why-line an editor wrote', () => {
    expect(
      migrateBackfillOrganigramPillar(node({roleCode: 'PEN', pillar: 'bestuur', description: 'Eigen tekst'})),
    ).toBeUndefined()
  })

  it('does not seed a description on a box outside the key row', () => {
    expect(migrateBackfillOrganigramPillar(node({roleCode: 'KLE'}))).toEqual([at('pillar', set('club'))])
  })

  it('is idempotent: a second run over a migrated box produces no patches', () => {
    expect(
      migrateBackfillOrganigramPillar(
        node({roleCode: 'SEC', pillar: 'bestuur', description: 'Post, verslagen, de vzw'}),
      ),
    ).toBeUndefined()
  })
})
