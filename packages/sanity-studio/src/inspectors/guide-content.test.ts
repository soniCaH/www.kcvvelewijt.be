import {describe, expect, it} from 'vitest'
import {guideContent} from './guide-content'

describe('guideContent', () => {
  it('every entry has a non-empty intro and placement', () => {
    for (const [type, entry] of Object.entries(guideContent)) {
      expect(entry.intro.trim().length, type).toBeGreaterThan(0)
      expect(entry.placement.trim().length, type).toBeGreaterThan(0)
    }
  })

  it('tips, when present, are non-empty strings', () => {
    for (const [type, entry] of Object.entries(guideContent)) {
      for (const tip of entry.tips ?? []) {
        expect(tip.trim().length, type).toBeGreaterThan(0)
      }
    }
  })
})
