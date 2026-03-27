import {defineMigration, at, set, unset} from 'sanity/migrate'

/**
 * Rename positionTitle → roleLabel and positionShort → roleCode on staffMember documents.
 * Part of #909 — ubiquitous language alignment Phase 3.
 *
 * Deploy order: run migration first, then deploy code.
 *
 * Run with:
 *   npx sanity@latest migration run rename-staff-position-fields --project vhb33jaz --dataset production
 */
export default defineMigration({
  title: 'Rename staffMember positionTitle → roleLabel, positionShort → roleCode',
  documentTypes: ['staffMember'],

  migrate: {
    document(doc) {
      const ops = []

      if (doc.positionTitle !== undefined) {
        ops.push(at('roleLabel', set(doc.positionTitle)))
        ops.push(at('positionTitle', unset()))
      }

      if (doc.positionShort !== undefined) {
        ops.push(at('roleCode', set(doc.positionShort)))
        ops.push(at('positionShort', unset()))
      }

      return ops.length > 0 ? ops : undefined
    },
  },
})
