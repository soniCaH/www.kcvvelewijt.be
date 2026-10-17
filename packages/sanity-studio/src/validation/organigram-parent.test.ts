import {ConcreteRuleClass} from 'sanity'
import {describe, expect, it, vi} from 'vitest'
import {
  collectOrganigramExcludedIds,
  normalizeOrganigramId,
  organigramNode,
  organigramParentFilter,
} from '@kcvv/sanity-schemas'

type Row = {_id: string; parent?: string}

/** A client whose `fetch` answers every query with the given rows. */
function clientWith(rows: Row[]) {
  return {fetch: vi.fn().mockResolvedValue(rows)}
}

function field() {
  const f = organigramNode.fields.find((x) => x.name === 'parentNode')
  if (!f) throw new Error('organigramNode.parentNode field not found')
  return f as unknown as {
    validation: (rule: InstanceType<typeof ConcreteRuleClass>) => InstanceType<typeof ConcreteRuleClass>
    options: {filter: (ctx: unknown) => Promise<{filter: string; params: {excluded: string[]}}>}
  }
}

async function validateParent(selfId: string, parentRef: string | undefined, rows: Row[]) {
  const rule = field().validation(new ConcreteRuleClass())
  const context = {
    document: {_id: selfId, _type: 'organigramNode'},
    getClient: () => clientWith(rows),
    i18n: {t: (key: string) => key},
    schema: {},
    type: {},
    environment: 'test',
    path: ['parentNode'],
  }
  const value = parentRef ? {_type: 'reference', _ref: parentRef} : undefined
  return rule.validate(value, context as never)
}

describe('normalizeOrganigramId', () => {
  it('strips drafts. and versions.<release>. prefixes', () => {
    expect(normalizeOrganigramId('abc')).toBe('abc')
    expect(normalizeOrganigramId('drafts.abc')).toBe('abc')
    expect(normalizeOrganigramId('versions.rSpring.abc')).toBe('abc')
  })
})

describe('organigramNode.parentNode validation (rule level)', () => {
  const published: Row[] = [
    {_id: 'root'},
    {_id: 'A', parent: 'root'},
    {_id: 'B', parent: 'A'},
    {_id: 'C', parent: 'B'},
  ]

  it('accepts a parent outside the node’s own subtree', async () => {
    expect(await validateParent('B', 'root', published)).toHaveLength(0)
    expect(await validateParent('C', 'A', published)).toHaveLength(0)
  })

  it('accepts clearing the parent', async () => {
    expect(await validateParent('A', undefined, published)).toHaveLength(0)
  })

  it('rejects A → A, also through the draft twin id', async () => {
    expect(await validateParent('A', 'A', published)).toHaveLength(1)
    expect(await validateParent('drafts.A', 'A', published)).toHaveLength(1)
    expect(await validateParent('A', 'drafts.A', published)).toHaveLength(1)
  })

  it('rejects A → B → A (B already reports to A)', async () => {
    const markers = await validateParent('A', 'B', published)
    expect(markers).toHaveLength(1)
    expect(markers[0].level).toBe('error')
  })

  it('rejects longer cycles (A → C, with C → B → A published)', async () => {
    expect(await validateParent('A', 'C', published)).toHaveLength(1)
  })

  it('strips versions. prefixes on the node and the stored parent ref', async () => {
    expect(await validateParent('versions.rSpring.A', 'C', published)).toHaveLength(1)
    const withVersionRef: Row[] = [{_id: 'A', parent: 'root'}, {_id: 'B', parent: 'versions.rSpring.A'}]
    expect(await validateParent('A', 'B', withVersionRef)).toHaveLength(1)
  })

  it('passes when the chain runs into an existing loop that does not include the node', async () => {
    // C → D → C already exists; A picks X, and X reports to C. Not this save's doing.
    const rows: Row[] = [{_id: 'A'}, {_id: 'C', parent: 'D'}, {_id: 'D', parent: 'C'}, {_id: 'X', parent: 'C'}]
    expect(await validateParent('A', 'X', rows)).toHaveLength(0)
    expect(await validateParent('A', 'C', rows)).toHaveLength(0)
  })

  it('still rejects when the chain reaches the node before looping', async () => {
    const rows: Row[] = [{_id: 'A', parent: 'D'}, {_id: 'C', parent: 'A'}, {_id: 'D', parent: 'C'}]
    expect(await validateParent('A', 'C', rows)).toHaveLength(1)
  })

  it('only reads published nodes', async () => {
    const client = clientWith(published)
    const rule = field().validation(new ConcreteRuleClass())
    await rule.validate({_type: 'reference', _ref: 'root'}, {
      document: {_id: 'A'},
      getClient: () => client,
      i18n: {t: (k: string) => k},
      schema: {},
      type: {},
      environment: 'test',
      path: [],
    } as never)
    expect(client.fetch.mock.calls[0][0]).toContain('drafts.**')
  })
})

describe('collectOrganigramExcludedIds', () => {
  const nodes: Row[] = [
    {_id: 'root'},
    {_id: 'A', parent: 'root'},
    {_id: 'B', parent: 'A'},
    {_id: 'C', parent: 'B'},
    {_id: 'D', parent: 'root'},
  ]

  it('excludes the node, its draft twin and every descendant (both id forms)', () => {
    const excluded = collectOrganigramExcludedIds('drafts.A', nodes)
    for (const id of ['A', 'B', 'C']) {
      expect(excluded).toContain(id)
      expect(excluded).toContain(`drafts.${id}`)
    }
    expect(excluded).not.toContain('root')
    expect(excluded).not.toContain('D')
    expect(excluded).not.toContain('drafts.D')
  })

  it('terminates on a cycle in the stored data', () => {
    const cyc: Row[] = [{_id: 'A', parent: 'B'}, {_id: 'B', parent: 'A'}]
    expect(collectOrganigramExcludedIds('A', cyc).sort()).toEqual(['A', 'B', 'drafts.A', 'drafts.B'])
  })

  it('lets an unpublished draft re-parenting win over the published parent', () => {
    // published: B reports to root; draft of B reports to A
    const rows: Row[] = [{_id: 'A', parent: 'root'}, {_id: 'B', parent: 'root'}, {_id: 'drafts.B', parent: 'A'}]
    expect(collectOrganigramExcludedIds('A', rows)).toContain('B')
  })
})

describe('organigramNode.parentNode picker filter', () => {
  it('hides the node, its draft twin and its descendants', async () => {
    const rows: Row[] = [{_id: 'A', parent: 'root'}, {_id: 'B', parent: 'A'}, {_id: 'D', parent: 'root'}]
    const result = await organigramParentFilter({
      document: {_id: 'drafts.A'},
      getClient: () => clientWith(rows),
    } as never)
    expect(result.filter).toContain('!(_id in $excluded)')
    expect(result.params.excluded).toEqual(expect.arrayContaining(['A', 'drafts.A', 'B', 'drafts.B']))
    expect(result.params.excluded).not.toContain('D')
  })

  it('is wired into the field options', () => {
    expect(field().options.filter).toBe(organigramParentFilter)
  })
})
