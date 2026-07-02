import type {ComponentType} from 'react'
import {
  type BlockDecoratorProps,
  type SchemaTypeDefinition,
  defineField,
  defineType,
} from 'sanity'
import {schemaTypes as baseSchemaTypes} from '@kcvv/sanity-schemas'
import {describe, expect, it} from 'vitest'
import {applyDecoratorComponents} from './apply-decorator-components'
import {collectBlockDecoratorComponents} from './collect-block-decorator-components'

const Pullquote: ComponentType<BlockDecoratorProps> = () => null
const Accent: ComponentType<BlockDecoratorProps> = () => null
const components = {pullquote: Pullquote, accent: Accent}

const makeSchemaTypes = (): SchemaTypeDefinition[] => [
  defineType({
    name: 'player',
    type: 'document',
    fields: [
      defineField({name: 'name', type: 'string'}),
      defineField({
        name: 'bio',
        type: 'array',
        of: [
          {
            type: 'block',
            marks: {
              decorators: [
                {title: 'Strong', value: 'strong'},
                {title: 'Pullquote', value: 'pullquote'},
              ],
            },
          },
        ],
      }),
    ],
  }),
  defineType({
    name: 'qaSectionDivider',
    type: 'object',
    fields: [
      defineField({
        name: 'title',
        type: 'array',
        of: [{type: 'block', marks: {decorators: [{title: 'Accent', value: 'accent'}]}}],
      }),
    ],
  }),
]

type BlockOf = {
  of: Array<{marks?: {decorators?: Array<{value: string; component?: unknown}>}}>
}
const decoratorsOf = (
  result: SchemaTypeDefinition[],
  typeName: string,
  fieldName: string,
) => {
  const type = result.find((t) => t.name === typeName) as unknown as {
    fields: Array<{name: string} & BlockOf>
  }
  const field = type.fields.find((f) => f.name === fieldName)!
  return field.of[0].marks!.decorators!
}

describe('applyDecoratorComponents', () => {
  it('grafts the matching component onto the pullquote decorator', () => {
    const decorators = decoratorsOf(
      applyDecoratorComponents(makeSchemaTypes(), components),
      'player',
      'bio',
    )
    expect(decorators.find((d) => d.value === 'pullquote')?.component).toBe(Pullquote)
  })

  it('grafts the accent component on a nested object type field', () => {
    const decorators = decoratorsOf(
      applyDecoratorComponents(makeSchemaTypes(), components),
      'qaSectionDivider',
      'title',
    )
    expect(decorators.find((d) => d.value === 'accent')?.component).toBe(Accent)
  })

  it('leaves decorators with no matching component untouched', () => {
    const decorators = decoratorsOf(
      applyDecoratorComponents(makeSchemaTypes(), components),
      'player',
      'bio',
    )
    expect(decorators.find((d) => d.value === 'strong')).toEqual({
      title: 'Strong',
      value: 'strong',
    })
  })

  it('does not mutate the input schemaTypes array', () => {
    const original = makeSchemaTypes()
    const snapshot = structuredClone(original)
    applyDecoratorComponents(original, components)
    expect(original).toEqual(snapshot)
  })

  it('is a no-op when no decorator matches', () => {
    const input: SchemaTypeDefinition[] = [
      defineType({
        name: 'page',
        type: 'document',
        fields: [defineField({name: 'body', type: 'array', of: [{type: 'block'}]})],
      }),
    ]
    expect(applyDecoratorComponents(input, components)).toEqual(input)
  })

  // De-drift (#2278): assert the graft lands on the real `pullquote` /`accent`
  // decorators shipped by `@kcvv/sanity-schemas` (pullquote → bio/body fields,
  // accent → accent-title fields), not just the hand-rolled fixture above. If a
  // decorator `value` is renamed or dropped, this fails instead of a stale mock.
  describe('against the real @kcvv/sanity-schemas schema', () => {
    it('grafts the real pullquote + accent decorators', () => {
      const grafted = applyDecoratorComponents(baseSchemaTypes, components)
      // Shared collector mirrors this helper's block-only traversal — see
      // collect-block-decorator-components.ts (kept in one place, #2278).
      const pullquotes = collectBlockDecoratorComponents(grafted, 'pullquote')
      const accents = collectBlockDecoratorComponents(grafted, 'accent')
      expect(pullquotes.length).toBeGreaterThan(0)
      expect(accents.length).toBeGreaterThan(0)
      expect(pullquotes.every((c) => c === Pullquote)).toBe(true)
      expect(accents.every((c) => c === Accent)).toBe(true)
    })
  })
})
