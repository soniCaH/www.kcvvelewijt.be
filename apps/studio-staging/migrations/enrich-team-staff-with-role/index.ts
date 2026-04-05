import {defineMigration, at, set} from 'sanity/migrate'

/**
 * Convert team.staff from plain references to objects with { member, role }.
 * Part of #1225 — enrich team.staff with editorial role.
 *
 * Before: staff: [{ _type: "reference", _ref: "staffMember-psd-123", _key: "123" }]
 * After:  staff: [{ _type: "object", _key: "123", member: { _type: "reference", _ref: "staffMember-psd-123" } }]
 *
 * Run with:
 *   npx sanity@latest migration run enrich-team-staff-with-role --project vhb33jaz --dataset staging
 *   npx sanity@latest migration run enrich-team-staff-with-role --project vhb33jaz --dataset production
 */
export default defineMigration({
  title: 'Convert team.staff from plain refs to objects with member + role',
  documentTypes: ['team'],

  migrate: {
    document(doc) {
      const staff = doc.staff as
        | Array<{_type?: string; _ref?: string; _key?: string; member?: unknown}>
        | undefined

      if (!staff || !Array.isArray(staff) || staff.length === 0) {
        return undefined
      }

      // Check if any entry needs migration (legacy plain ref without member sub-object)
      const needsMigration = staff.some((entry) => entry._ref && entry.member === undefined)
      if (!needsMigration) {
        return undefined
      }

      const migrated = staff.map((entry) => {
        // Already-migrated entries (has member sub-object) — preserve as-is including role
        if (entry.member !== undefined) {
          return entry
        }
        // Legacy plain ref — convert to object shape
        return {
          _type: 'object' as const,
          _key: entry._key ?? entry._ref?.replace('staffMember-psd-', '') ?? String(Math.random()),
          member: {
            _type: 'reference' as const,
            _ref: entry._ref!,
          },
        }
      })

      return [at('staff', set(migrated))]
    },
  },
})
