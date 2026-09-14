import {at, unset} from 'sanity/migrate'
import {describe, expect, it} from 'vitest'
import {
  migrateDropResponsibilityTeamRoleFallback,
  type ResponsibilityWithTeamRoleFallbackDoc,
} from './drop-responsibility-team-role-fallback'

describe('migrateDropResponsibilityTeamRoleFallback', () => {
  // Also covers idempotency — this doc's `teamRoleFallback` is already
  // absent, whether that's because it never had one or because a prior run
  // already unset it.
  it('returns undefined when no teamRoleFallback is present anywhere', () => {
    const doc: ResponsibilityWithTeamRoleFallbackDoc = {
      _id: 'r-1',
      _type: 'responsibility',
      primaryContact: {},
      steps: [{_key: 's-1', contact: {}}],
    }
    expect(migrateDropResponsibilityTeamRoleFallback(doc)).toBeUndefined()
  })

  it('returns undefined for a document with no primaryContact or steps', () => {
    const doc: ResponsibilityWithTeamRoleFallbackDoc = {_id: 'r-1', _type: 'responsibility'}
    expect(migrateDropResponsibilityTeamRoleFallback(doc)).toBeUndefined()
  })

  it('unsets primaryContact.teamRoleFallback when present', () => {
    const doc: ResponsibilityWithTeamRoleFallbackDoc = {
      _id: 'r-1',
      _type: 'responsibility',
      primaryContact: {teamRoleFallback: 'trainer'},
    }
    expect(migrateDropResponsibilityTeamRoleFallback(doc)).toEqual([
      at('primaryContact.teamRoleFallback', unset()),
    ])
  })

  it('unsets a stored null value (Sanity treats null as a real value)', () => {
    const doc: ResponsibilityWithTeamRoleFallbackDoc = {
      _id: 'r-1',
      _type: 'responsibility',
      primaryContact: {teamRoleFallback: null},
    }
    expect(migrateDropResponsibilityTeamRoleFallback(doc)).toEqual([
      at('primaryContact.teamRoleFallback', unset()),
    ])
  })

  it('unsets a step contact teamRoleFallback, keyed by the step _key', () => {
    const doc: ResponsibilityWithTeamRoleFallbackDoc = {
      _id: 'r-1',
      _type: 'responsibility',
      steps: [{_key: 's-1', contact: {teamRoleFallback: 'afgevaardigde'}}],
    }
    expect(migrateDropResponsibilityTeamRoleFallback(doc)).toEqual([
      at('steps[_key=="s-1"].contact.teamRoleFallback', unset()),
    ])
  })

  it('emits both patches when primaryContact and a step contact both carry the field', () => {
    const doc: ResponsibilityWithTeamRoleFallbackDoc = {
      _id: 'r-1',
      _type: 'responsibility',
      primaryContact: {teamRoleFallback: 'trainer'},
      steps: [{_key: 's-1', contact: {teamRoleFallback: 'afgevaardigde'}}],
    }
    expect(migrateDropResponsibilityTeamRoleFallback(doc)).toEqual([
      at('primaryContact.teamRoleFallback', unset()),
      at('steps[_key=="s-1"].contact.teamRoleFallback', unset()),
    ])
  })

  it('only patches the steps that carry the field, skipping the rest', () => {
    const doc: ResponsibilityWithTeamRoleFallbackDoc = {
      _id: 'r-1',
      _type: 'responsibility',
      steps: [
        {_key: 's-1', contact: {teamRoleFallback: 'trainer'}},
        {_key: 's-2', contact: {}},
        {_key: 's-3'},
      ],
    }
    expect(migrateDropResponsibilityTeamRoleFallback(doc)).toEqual([
      at('steps[_key=="s-1"].contact.teamRoleFallback', unset()),
    ])
  })

  it('skips a step contact carrying the field when the step has no _key', () => {
    const doc: ResponsibilityWithTeamRoleFallbackDoc = {
      _id: 'r-1',
      _type: 'responsibility',
      steps: [{contact: {teamRoleFallback: 'trainer'}}],
    }
    expect(migrateDropResponsibilityTeamRoleFallback(doc)).toBeUndefined()
  })
})
