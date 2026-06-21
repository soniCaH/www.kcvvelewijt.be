import {describe, expect, it} from 'vitest'
import {launcherTemplates, responsibilityTemplates, articleTemplates, isLauncherTemplate} from './index'

describe('launcherTemplates aggregate', () => {
  it('contains every per-schema manifest so both studios register templates with one spread', () => {
    expect(launcherTemplates).toEqual([...responsibilityTemplates, ...articleTemplates])
  })

  it('exposes only launcher-eligible templates', () => {
    expect(launcherTemplates.length).toBeGreaterThan(0)
    expect(launcherTemplates.every(isLauncherTemplate)).toBe(true)
  })

  it('has unique template ids', () => {
    const ids = launcherTemplates.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
