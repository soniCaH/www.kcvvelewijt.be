/** Fields that belong to the Sanity document system — not user data. */
const SYSTEM_FIELDS = new Set(['_id', '_type', '_rev', '_createdAt', '_updatedAt'])

interface StaffMemberDoc {
  _id: string
  _type: 'staffMember'
  [key: string]: unknown
}

interface SanityDoc {
  _id: string
  _type: string
  [key: string]: unknown
}

export interface LinkToPsdInput {
  oldDoc: StaffMemberDoc
  psdId: string
  referencingDocs: SanityDoc[]
}

interface CreateMutation {
  create: Record<string, unknown>
}

interface CreateOrReplaceMutation {
  createOrReplace: Record<string, unknown>
}

interface DeleteMutation {
  delete: {id: string}
}

export type Mutation = CreateMutation | CreateOrReplaceMutation | DeleteMutation

/** Recursively replace all `_ref` values matching `oldId` with `newId`. */
function deepReplaceRef(value: unknown, oldId: string, newId: string): unknown {
  if (value === null || value === undefined || typeof value !== 'object') {
    return value
  }

  if (Array.isArray(value)) {
    return value.map((item) => deepReplaceRef(item, oldId, newId))
  }

  const obj = value as Record<string, unknown>
  const result: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(obj)) {
    if (key === '_ref' && val === oldId) {
      result[key] = newId
    } else {
      result[key] = deepReplaceRef(val, oldId, newId)
    }
  }
  return result
}

export function buildLinkToPsdMutations({oldDoc, psdId, referencingDocs}: LinkToPsdInput): Mutation[] {
  const oldId = oldDoc._id
  const newId = `staffMember-psd-${psdId}`

  const userFields: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(oldDoc)) {
    if (!SYSTEM_FIELDS.has(key)) {
      userFields[key] = value
    }
  }

  const mutations: Mutation[] = [
    {
      create: {
        ...userFields,
        _id: newId,
        _type: 'staffMember',
        psdId,
      },
    },
  ]

  // Relink referencing documents. Replace refs to both the published ID and
  // its draft variant. Uses createOrReplace for simplicity — concurrent edits
  // between fetch and commit would be overwritten, but this is acceptable for
  // a rare, manual migration action.
  const draftOldId = `drafts.${oldId}`
  for (const refDoc of referencingDocs) {
    let updated = deepReplaceRef(refDoc, oldId, newId) as SanityDoc
    updated = deepReplaceRef(updated, draftOldId, newId) as SanityDoc
    mutations.push({createOrReplace: updated})
  }

  // Delete both the published document and its draft (Sanity stores drafts
  // as separate documents with ID `drafts.{publishedId}`).
  mutations.push({delete: {id: oldId}})
  mutations.push({delete: {id: `drafts.${oldId}`}})

  return mutations
}
