import {describe, expect, it} from 'vitest'

import {sponsorTemplates} from './sponsor-templates'
import {isLauncherTemplate} from './types'

describe('sponsorTemplates (#1506)', () => {
  it('exports a single zero-prefill sponsor-new card', () => {
    expect(sponsorTemplates.map((t) => t.id)).toEqual(['sponsor-new'])
    expect(sponsorTemplates[0].value).toEqual({})
  })

  it('targets the sponsor schema type', () => {
    expect(sponsorTemplates[0].schemaType).toBe('sponsor')
  })

  it('is launcher-eligible under the Sponsors group with a ≤100-char description', () => {
    const t = sponsorTemplates[0]
    expect(isLauncherTemplate(t)).toBe(true)
    expect(t.ui.group).toBe('Sponsors')
    expect(t.ui.description.trim().length).toBeGreaterThan(0)
    expect(t.ui.description.length).toBeLessThanOrEqual(100)
  })
})
