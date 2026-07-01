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
    // Collect every block decorator `component` for `value` across each
    // top-level type's direct `field.of[]` — the reach of the helper.
    const componentsFor = (
      types: readonly SchemaTypeDefinition[],
      value: string,
    ): unknown[] => {
      const out: unknown[] = []
      for (const type of types) {
        const fields = (type as {fields?: unknown[]}).fields
        if (!Array.isArray(fields)) continue
        for (const field of fields) {
          const of = (field as {of?: unknown}).of
          if (!Array.isArray(of)) continue
          for (const member of of) {
            // Block members only — mirror the helper's own traversal, which
            // skips non-block members, so the collector's scope matches.
            if (
              !member ||
              typeof member !== 'object' ||
              (member as {type?: string}).type !== 'block'
            ) {
              continue
            }
            const decorators = (member as {marks?: {decorators?: unknown}})?.marks
              ?.decorators
            if (!Array.isArray(decorators)) continue
            for (const d of decorators) {
              if (d && typeof d === 'object' && (d as {value?: string}).value === value) {
                out.push((d as {component?: unknown}).component)
              }
            }
          }
        }
      }
      return out
    }

    it('grafts the real pullquote + accent decorators', () => {
      const grafted = applyDecoratorComponents(baseSchemaTypes, components)
      const pullquotes = componentsFor(grafted, 'pullquote')
      const accents = componentsFor(grafted, 'accent')
      expect(pullquotes.length).toBeGreaterThan(0)
      expect(accents.length).toBeGreaterThan(0)
      expect(pullquotes.every((c) => c === Pullquote)).toBe(true)
      expect(accents.every((c) => c === Accent)).toBe(true)
    })
  })
})
