import type {ComponentType} from 'react'
import {
  type BlockDecoratorProps,
  type SchemaTypeDefinition,
  defineField,
  defineType,
} from 'sanity'
import {describe, expect, it} from 'vitest'
import {applyDecoratorComponents} from './apply-decorator-components'

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
})
