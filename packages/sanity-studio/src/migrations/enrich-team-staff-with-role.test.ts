import {at, set} from 'sanity/migrate'
import {describe, expect, it} from 'vitest'
import {migrateEnrichTeamStaffWithRole} from './enrich-team-staff-with-role'

describe('migrateEnrichTeamStaffWithRole', () => {
  it('skips a team without staff', () => {
    expect(migrateEnrichTeamStaffWithRole({})).toBeUndefined()
    expect(migrateEnrichTeamStaffWithRole({staff: []})).toBeUndefined()
  })

  it('skips a team whose staff is already migrated', () => {
    expect(
      migrateEnrichTeamStaffWithRole({
        staff: [
          {
            _key: 'a',
            member: {_type: 'reference', _ref: 'staffMember-psd-1'},
            role: 'T1',
          },
        ],
      }),
    ).toBeUndefined()
  })

  it('wraps legacy refs and keeps migrated entries as they are', () => {
    const migrated = {
      _key: 'b',
      member: {_type: 'reference', _ref: 'staffMember-psd-2'},
      role: 'T2',
    }
    expect(
      migrateEnrichTeamStaffWithRole({
        staff: [
          {_type: 'reference', _ref: 'staffMember-psd-1', _key: 'k1'},
          migrated,
          {_type: 'reference', _ref: 'staffMember-psd-3'},
        ],
      }),
    ).toEqual([
      at(
        'staff',
        set([
          {
            _type: 'object',
            _key: 'k1',
            member: {_type: 'reference', _ref: 'staffMember-psd-1'},
          },
          migrated,
          {
            _type: 'object',
            _key: '3',
            member: {_type: 'reference', _ref: 'staffMember-psd-3'},
          },
        ]),
      ),
    ])
  })
})
