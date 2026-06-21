import {describe, expect, it} from 'vitest'
import type {NewDocumentOptionsContext, TemplateItem} from 'sanity'

import {curateDefaultTemplateItems, curatedNewDocumentOptions} from './curate-new-document-options'
import {launcherTemplates} from '../../templates'

const item = (templateId: string): TemplateItem => ({templateId})

// The resolver ignores context; a global-creation stub satisfies the contract.
const ctx = {creationContext: {type: 'global'}} as NewDocumentOptionsContext

describe('curateDefaultTemplateItems', () => {
  it('drops the default for curated types, keeps curated cards and uncurated defaults', () => {
    const prev = [
      item('sponsor'), // default for a curated type → drop
      item('sponsor-new'), // curated card → keep
      item('article'), // default for a curated type → drop
      item('article-interview'), // curated card → keep
      item('team'), // default, no launcher template → keep
    ]
    const curated = new Set(['sponsor', 'article'])
    expect(curateDefaultTemplateItems(prev, curated).map((i) => i.templateId)).toEqual([
      'sponsor-new',
      'article-interview',
      'team',
    ])
  })

  it('is a no-op when nothing is curated', () => {
    const prev = [item('sponsor'), item('team')]
    expect(curateDefaultTemplateItems(prev, new Set()).map((i) => i.templateId)).toEqual(['sponsor', 'team'])
  })
})

describe('curatedNewDocumentOptions', () => {
  it('hides the auto-default for every type that has a launcher template', () => {
    const curatedTypes = [...new Set(launcherTemplates.map((t) => t.schemaType))]
    // Simulate Sanity's prev: a default item per curated type (id === type name).
    const defaults = curatedTypes.map(item)
    expect(curatedNewDocumentOptions(defaults, ctx)).toEqual([])
  })

  it('keeps the curated cards themselves', () => {
    const cards = launcherTemplates.map((t) => item(t.id))
    expect(curatedNewDocumentOptions(cards, ctx).map((i) => i.templateId)).toEqual(launcherTemplates.map((t) => t.id))
  })

  it('keeps the default for a type that has no launcher template', () => {
    expect(curatedNewDocumentOptions([item('team')], ctx).map((i) => i.templateId)).toEqual(['team'])
  })
})
