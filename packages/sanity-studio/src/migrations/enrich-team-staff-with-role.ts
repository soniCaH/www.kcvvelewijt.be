import {at, defineMigration, set} from 'sanity/migrate'

/**
 * Convert team.staff from plain references to objects with { member, role }
 * (#1225).
 *
 * Before: staff: [{ _type: "reference", _ref: "staffMember-psd-123", _key: "123" }]
 * After:  staff: [{ _type: "object", _key: "123", member: { _type: "reference", _ref: "staffMember-psd-123" } }]
 *
 * Already-migrated entries (with a `member` sub-object) are kept as-is,
 * including their role. A team with no legacy entry produces no patch.
 */
export interface StaffEntryLike {
  _type?: string
  _ref?: string
  _key?: string
  member?: unknown
  role?: string
}

export interface TeamWithStaffDoc {
  staff?: StaffEntryLike[]
}

type Patch = ReturnType<typeof at>

export function migrateEnrichTeamStaffWithRole(doc: TeamWithStaffDoc): Patch[] | undefined {
  const {staff} = doc
  if (!Array.isArray(staff) || staff.length === 0) return undefined
  if (!staff.some((entry) => entry._ref && entry.member === undefined)) return undefined

  const migrated = staff.map((entry) =>
    entry.member !== undefined
      ? entry
      : {
          _type: 'object' as const,
          _key: entry._key ?? entry._ref?.replace('staffMember-psd-', '') ?? String(Math.random()),
          member: {_type: 'reference' as const, _ref: entry._ref!},
        },
  )
  return [at('staff', set(migrated))]
}

export default defineMigration({
  title: 'Convert team.staff from plain refs to objects with member + role',
  documentTypes: ['team'],

  migrate: {
    document(doc) {
      return migrateEnrichTeamStaffWithRole(doc as TeamWithStaffDoc)
    },
  },
})
