import {describe, expect, it} from 'vitest'

import {organigramNodeTemplates} from './organigramNode-templates'
import {isLauncherTemplate} from './types'

describe('organigramNodeTemplates (#2181)', () => {
  it('exports a single zero-prefill organigramNode-new card', () => {
    expect(organigramNodeTemplates.map((t) => t.id)).toEqual(['organigramNode-new'])
    expect(organigramNodeTemplates[0].value).toEqual({})
  })

  it('targets the organigramNode schema type', () => {
    expect(organigramNodeTemplates[0].schemaType).toBe('organigramNode')
  })

  it('is launcher-eligible under the Organigram group with a ≤100-char description', () => {
    const t = organigramNodeTemplates[0]
    expect(isLauncherTemplate(t)).toBe(true)
    expect(t.ui.group).toBe('Organigram')
    expect(t.ui.description.trim().length).toBeGreaterThan(0)
    expect(t.ui.description.length).toBeLessThanOrEqual(100)
  })
})
