import {at, set} from 'sanity/migrate'
import {describe, expect, it} from 'vitest'
import {
  type HomePageWithYouthStatsDoc,
  migrateSetHomepageYouthStats,
  YOUTH_PLAYER_COUNT_DEFAULT,
  YOUTH_TEAM_COUNT_DEFAULT,
} from './set-homepage-youth-stats'

describe('migrateSetHomepageYouthStats', () => {
  it('sets both fields when neither is present (the current production/staging state)', () => {
    const doc: HomePageWithYouthStatsDoc = {_id: 'homePage', _type: 'homePage'}
    expect(migrateSetHomepageYouthStats(doc)).toEqual([
      at('youthPlayerCount', set(YOUTH_PLAYER_COUNT_DEFAULT)),
      at('youthTeamCount', set(YOUTH_TEAM_COUNT_DEFAULT)),
    ])
  })

  it('is a no-op when both fields already have a value (never overwrites an editor)', () => {
    const doc: HomePageWithYouthStatsDoc = {
      _id: 'homePage',
      _type: 'homePage',
      youthPlayerCount: '250+',
      youthTeamCount: '18',
    }
    expect(migrateSetHomepageYouthStats(doc)).toBeUndefined()
  })

  it('sets only the missing field when one is already present', () => {
    const doc: HomePageWithYouthStatsDoc = {
      _id: 'homePage',
      _type: 'homePage',
      youthPlayerCount: '250+',
    }
    expect(migrateSetHomepageYouthStats(doc)).toEqual([
      at('youthTeamCount', set(YOUTH_TEAM_COUNT_DEFAULT)),
    ])
  })

  it('treats an empty-string field as unset, not as a real value', () => {
    const doc: HomePageWithYouthStatsDoc = {
      _id: 'homePage',
      _type: 'homePage',
      youthPlayerCount: '   ',
      youthTeamCount: '16',
    }
    expect(migrateSetHomepageYouthStats(doc)).toEqual([
      at('youthPlayerCount', set(YOUTH_PLAYER_COUNT_DEFAULT)),
    ])
  })

  it('is idempotent — running twice produces patches only the first time', () => {
    const doc: HomePageWithYouthStatsDoc = {_id: 'homePage', _type: 'homePage'}
    expect(migrateSetHomepageYouthStats(doc)).toBeDefined()

    // Simulate the patched document after the first run committed.
    const patched: HomePageWithYouthStatsDoc = {
      ...doc,
      youthPlayerCount: YOUTH_PLAYER_COUNT_DEFAULT,
      youthTeamCount: YOUTH_TEAM_COUNT_DEFAULT,
    }
    expect(migrateSetHomepageYouthStats(patched)).toBeUndefined()
  })
})
