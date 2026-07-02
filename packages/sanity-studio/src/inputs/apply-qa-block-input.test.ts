import type {ComponentType} from 'react'
import {
  defineField,
  defineType,
  type ObjectItemProps,
  type SchemaTypeDefinition,
} from 'sanity'
import {schemaTypes as baseSchemaTypes} from '@kcvv/sanity-schemas'
import {describe, expect, it} from 'vitest'
import {applyQaBlockInput} from './apply-qa-block-input'

const QaPairItem: ComponentType<ObjectItemProps> = () => null
const QaPairRespondentItem: ComponentType<ObjectItemProps> = () => null
const components = {QaPairItem, QaPairRespondentItem}

const makeSchemaTypes = (): SchemaTypeDefinition[] => [
  defineType({
    name: 'qaPairRespondent',
    type: 'object',
    fields: [
      defineField({name: 'respondentKey', type: 'string'}),
      defineField({name: 'answer', type: 'array', of: [{type: 'block'}]}),
    ],
  }),
  defineType({
    name: 'qaPair',
    type: 'object',
    fields: [
      defineField({name: 'question', type: 'string'}),
      defineField({name: 'respondents', type: 'array', of: [{type: 'qaPairRespondent'}]}),
      defineField({name: 'tag', type: 'string'}),
    ],
  }),
]

const componentsOf = (type: SchemaTypeDefinition | undefined) =>
  (type as unknown as {components?: {item?: unknown}} | undefined)?.components

describe('applyQaBlockInput', () => {
  it('grafts components.item onto qaPair and qaPairRespondent', () => {
    const result = applyQaBlockInput(makeSchemaTypes(), components)
    expect(componentsOf(result.find((t) => t.name === 'qaPair'))?.item).toBe(QaPairItem)
    expect(componentsOf(result.find((t) => t.name === 'qaPairRespondent'))?.item).toBe(
      QaPairRespondentItem,
    )
  })

  it('preserves existing components on the grafted types', () => {
    const input = makeSchemaTypes().map((t) =>
      t.name === 'qaPair'
        ? ({...t, components: {input: () => null}} as SchemaTypeDefinition)
        : t,
    )
    const result = applyQaBlockInput(input, components)
    const graftedComponents = componentsOf(result.find((t) => t.name === 'qaPair'))
    expect(graftedComponents?.item).toBe(QaPairItem)
    expect((graftedComponents as {input?: unknown} | undefined)?.input).toBeTypeOf('function')
  })

  it('does not mutate the input schemaTypes array', () => {
    const original = makeSchemaTypes()
    const snapshot = structuredClone(original)
    applyQaBlockInput(original, components)
    expect(original).toEqual(snapshot)
  })

  it('is a no-op when neither qa type is present', () => {
    const input: SchemaTypeDefinition[] = [
      defineType({name: 'player', type: 'document', fields: []}),
    ]
    expect(applyQaBlockInput(input, components)).toEqual(input)
  })

  // De-drift (#2278): assert the graft lands on the schema actually shipped by
  // `@kcvv/sanity-schemas`, so a rename of either type fails here instead of a
  // stale hand-rolled fixture.
  describe('against the real @kcvv/sanity-schemas schema', () => {
    it('grafts components.item onto the real qaPair + qaPairRespondent', () => {
      const result = applyQaBlockInput(baseSchemaTypes, components)
      expect(componentsOf(result.find((t) => t.name === 'qaPair'))?.item).toBe(QaPairItem)
      expect(
        componentsOf(result.find((t) => t.name === 'qaPairRespondent'))?.item,
      ).toBe(QaPairRespondentItem)
    })
  })
})
