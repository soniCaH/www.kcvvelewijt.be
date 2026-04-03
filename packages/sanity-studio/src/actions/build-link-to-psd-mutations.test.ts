import {describe, it, expect} from 'vitest'
import {buildLinkToPsdMutations} from './build-link-to-psd-mutations'

const oldDoc = {
  _id: 'staff-board-dcb0e9e6',
  _type: 'staffMember' as const,
  _rev: 'abc123',
  _createdAt: '2024-01-01T00:00:00Z',
  _updatedAt: '2024-06-01T00:00:00Z',
  firstName: 'Tom',
  lastName: 'Bautmans',
  photo: {
    _type: 'image' as const,
    asset: {_ref: 'image-abc123-200x200-png', _type: 'reference' as const},
  },
  bio: [{_type: 'block', children: [{_type: 'span', text: 'Keeperstrainer'}]}],
}

describe('buildLinkToPsdMutations', () => {
  it('creates a new document with psdId and all fields copied from the old doc', () => {
    const mutations = buildLinkToPsdMutations({oldDoc, psdId: '252', referencingDocs: []})

    const creates = mutations.filter((m) => 'createOrReplace' in m)
    expect(creates).toHaveLength(1)

    const newDoc = creates[0].createOrReplace
    expect(newDoc._id).toBe('staffMember-psd-252')
    expect(newDoc._type).toBe('staffMember')
    expect(newDoc.firstName).toBe('Tom')
    expect(newDoc.lastName).toBe('Bautmans')
    expect(newDoc.photo).toEqual(oldDoc.photo)
    expect(newDoc.bio).toEqual(oldDoc.bio)
    expect(newDoc.psdId).toBe('252')
  })

  it('does not copy system fields (_rev, _createdAt, _updatedAt) to the new document', () => {
    const mutations = buildLinkToPsdMutations({oldDoc, psdId: '252', referencingDocs: []})
    const newDoc = mutations.find((m) => 'createOrReplace' in m)!.createOrReplace
    expect(newDoc._rev).toBeUndefined()
    expect(newDoc._createdAt).toBeUndefined()
    expect(newDoc._updatedAt).toBeUndefined()
  })

  it('patches referencing documents to replace old _ref with new ID', () => {
    const referencingDocs = [
      {
        _id: 'organigramNode-123',
        _type: 'organigramNode',
        _rev: 'rev1',
        title: 'Keeperstrainer',
        members: [
          {_ref: 'staff-board-dcb0e9e6', _type: 'reference', _key: 'k1'},
          {_ref: 'staffMember-psd-999', _type: 'reference', _key: 'k2'},
        ],
      },
      {
        _id: 'team-bestuur',
        _type: 'team',
        _rev: 'rev2',
        name: 'Bestuur',
        staff: [{_ref: 'staff-board-dcb0e9e6', _type: 'reference', _key: 'k3'}],
      },
    ]

    const mutations = buildLinkToPsdMutations({oldDoc, psdId: '252', referencingDocs})

    // Should have: 1 createOrReplace (new doc) + 2 createOrReplace (relinked refs) + 2 deletes
    const creates = mutations.filter((m) => 'createOrReplace' in m)
    expect(creates).toHaveLength(3)

    const organigramMutation = creates.find(
      (m) => m.createOrReplace._id === 'organigramNode-123',
    )!
    const orgNode = organigramMutation.createOrReplace as Record<string, unknown>
    const members = orgNode.members as Array<{_ref: string}>
    expect(members[0]._ref).toBe('staffMember-psd-252')
    expect(members[1]._ref).toBe('staffMember-psd-999') // unchanged

    const teamMutation = creates.find((m) => m.createOrReplace._id === 'team-bestuur')!
    const teamDoc = teamMutation.createOrReplace as Record<string, unknown>
    const staff = teamDoc.staff as Array<{_ref: string}>
    expect(staff[0]._ref).toBe('staffMember-psd-252')
  })

  it('deletes both the published document and its draft', () => {
    const mutations = buildLinkToPsdMutations({oldDoc, psdId: '252', referencingDocs: []})
    const deletes = mutations.filter((m) => 'delete' in m)
    expect(deletes).toHaveLength(2)
    expect(deletes[0].delete.id).toBe('staff-board-dcb0e9e6')
    expect(deletes[1].delete.id).toBe('drafts.staff-board-dcb0e9e6')
  })
})
