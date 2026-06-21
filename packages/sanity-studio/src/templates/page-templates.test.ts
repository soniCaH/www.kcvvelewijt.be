import {describe, expect, it} from 'vitest'

import {pageTemplates} from './page-templates'
import {isLauncherTemplate} from './types'

describe('pageTemplates (#1508)', () => {
  it('exports a single zero-prefill page-new card', () => {
    expect(pageTemplates.map((t) => t.id)).toEqual(['page-new'])
    expect(pageTemplates[0].value).toEqual({})
  })

  it('targets the page schema type', () => {
    expect(pageTemplates[0].schemaType).toBe('page')
  })

  it('is launcher-eligible under the Pages group with a ≤100-char description', () => {
    const t = pageTemplates[0]
    expect(isLauncherTemplate(t)).toBe(true)
    expect(t.ui.group).toBe('Pages')
    expect(t.ui.description.trim().length).toBeGreaterThan(0)
    expect(t.ui.description.length).toBeLessThanOrEqual(100)
  })
})
