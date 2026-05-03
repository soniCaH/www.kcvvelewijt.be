import {describe, expect, it, vi} from 'vitest'
import type {Template} from 'sanity'

import {filterLauncherTemplates} from './filter-launcher-templates'

const known = (registered: string[]) => (schemaType: string) => registered.includes(schemaType)

const launcherTemplate = (overrides: Partial<Template> = {}): Template => ({
  id: 'responsibility-new',
  title: 'Nieuwe responsibility',
  schemaType: 'responsibility',
  value: {},
  // @ts-expect-error LauncherTemplate ui field is not part of Sanity's Template type
  ui: {icon: 'help-circle', description: 'desc', group: 'Responsibilities'},
  ...overrides,
})

describe('filterLauncherTemplates', () => {
  it('keeps templates with a valid ui block and a known schemaType', () => {
    const result = filterLauncherTemplates([launcherTemplate()], known(['responsibility']))
    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('responsibility-new')
  })

  it('drops templates without a ui block (auto-generated / third-party)', () => {
    const sanityAutoTemplate: Template = {
      id: 'responsibility',
      title: 'responsibility',
      schemaType: 'responsibility',
      value: {},
    }
    const result = filterLauncherTemplates([sanityAutoTemplate], known(['responsibility']))
    expect(result).toHaveLength(0)
  })

  it('drops templates with malformed ui (missing required fields)', () => {
    const malformed = {
      id: 'malformed',
      title: 'x',
      schemaType: 'responsibility',
      value: {},
      ui: {icon: 'help-circle'}, // description + group missing
    } as unknown as Template
    const result = filterLauncherTemplates([malformed], known(['responsibility']))
    expect(result).toHaveLength(0)
  })

  it('drops templates whose schemaType is not registered in the workspace', () => {
    const result = filterLauncherTemplates(
      [launcherTemplate({id: 'ghost', schemaType: 'ghostType'})],
      known(['responsibility']),
    )
    expect(result).toHaveLength(0)
  })

  it('logs unknown schemaTypes once per pass via the onUnknownType callback', () => {
    const onUnknownType = vi.fn()
    filterLauncherTemplates(
      [
        launcherTemplate({id: 'a', schemaType: 'ghostType'}),
        launcherTemplate({id: 'b', schemaType: 'ghostType'}),
        launcherTemplate({id: 'c', schemaType: 'otherGhost'}),
      ],
      known([]),
      onUnknownType,
    )
    expect(onUnknownType).toHaveBeenCalledTimes(2)
    expect(onUnknownType).toHaveBeenCalledWith('ghostType')
    expect(onUnknownType).toHaveBeenCalledWith('otherGhost')
  })

  it('does not log when onUnknownType is omitted', () => {
    expect(() =>
      filterLauncherTemplates(
        [launcherTemplate({schemaType: 'ghostType'})],
        known([]),
      ),
    ).not.toThrow()
  })

  it('preserves input order for kept templates', () => {
    const templates: Template[] = [
      launcherTemplate({id: 'a', schemaType: 'responsibility'}),
      launcherTemplate({id: 'b', schemaType: 'article'}),
      launcherTemplate({id: 'c', schemaType: 'responsibility'}),
    ]
    const result = filterLauncherTemplates(templates, known(['responsibility', 'article']))
    expect(result.map((t) => t.id)).toEqual(['a', 'b', 'c'])
  })
})
