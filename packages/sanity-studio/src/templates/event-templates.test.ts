import {describe, expect, it} from 'vitest'

import {eventTemplates} from './event-templates'
import {isLauncherTemplate} from './types'

// One launcher card per eventType an editor hand-creates. A card per type is
// required because the curated + Create menu hides the bare default once event
// has launcher templates.
const EXPECTED: Record<string, string> = {
  'event-clubevent': 'Clubevent',
  'event-supportersactiviteit': 'Supportersactiviteit',
  'event-jeugdwerking': 'Jeugdwerking',
  'event-andere': 'Andere',
}

describe('eventTemplates (#1507)', () => {
  it('exports exactly one card per eventType, in order', () => {
    expect(eventTemplates.map((t) => t.id)).toEqual(Object.keys(EXPECTED))
  })

  it('targets the event schema type', () => {
    for (const t of eventTemplates) {
      expect(t.schemaType, t.id).toBe('event')
    }
  })

  it('seeds ONLY eventType — no editorial-content prefill (per D6)', () => {
    for (const t of eventTemplates) {
      const value = t.value as Record<string, unknown>
      expect(Object.keys(value), t.id).toEqual(['eventType'])
      expect(value.eventType, t.id).toBe(EXPECTED[t.id])
    }
  })

  it('is launcher-eligible under the Events group with a ≤100-char description', () => {
    for (const t of eventTemplates) {
      expect(isLauncherTemplate(t), t.id).toBe(true)
      expect(t.ui.group, t.id).toBe('Events')
      expect(t.ui.description.trim().length, t.id).toBeGreaterThan(0)
      expect(t.ui.description.length, t.id).toBeLessThanOrEqual(100)
    }
  })
})
