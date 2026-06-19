import {describe, expect, it} from 'vitest'

import {articleTemplates} from './article-templates'
import {isLauncherTemplate} from './types'

// One launcher card per editorial articleType an editor hand-creates.
// matchPreview/matchRecap are generated from match data, not launched here.
const EXPECTED: Record<string, string> = {
  'article-interview': 'interview',
  'article-announcement': 'announcement',
  'article-transfer': 'transfer',
  'article-event': 'event',
}

describe('articleTemplates (#1501)', () => {
  it('exports exactly the four hand-created article types in order', () => {
    expect(articleTemplates.map((t) => t.id)).toEqual(Object.keys(EXPECTED))
  })

  it('targets the article schema type', () => {
    for (const t of articleTemplates) {
      expect(t.schemaType, t.id).toBe('article')
    }
  })

  it('seeds ONLY articleType — no editorial-content prefill (per D6)', () => {
    for (const t of articleTemplates) {
      const value = t.value as Record<string, unknown>
      expect(Object.keys(value), t.id).toEqual(['articleType'])
      expect(value.articleType, t.id).toBe(EXPECTED[t.id])
    }
  })

  it('is launcher-eligible under the Articles group with a ≤100-char description', () => {
    for (const t of articleTemplates) {
      expect(isLauncherTemplate(t), t.id).toBe(true)
      expect(t.ui.group, t.id).toBe('Articles')
      expect(t.ui.description.trim().length, t.id).toBeGreaterThan(0)
      expect(t.ui.description.length, t.id).toBeLessThanOrEqual(100)
    }
  })
})
