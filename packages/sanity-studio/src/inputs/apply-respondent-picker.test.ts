import type {ComponentType} from 'react'
import {
  defineField,
  defineType,
  type SchemaTypeDefinition,
  type StringInputProps,
} from 'sanity'
import {describe, expect, it} from 'vitest'
import {applyRespondentPicker} from './apply-respondent-picker'

const StubComponent: ComponentType<StringInputProps> = () => null

const makeSchemaTypes = (): SchemaTypeDefinition[] => [
  defineType({
    name: 'qaPairRespondent',
    type: 'object',
    fields: [
      defineField({name: 'respondentKey', type: 'string'}),
      defineField({
        name: 'answer',
        type: 'array',
        of: [{type: 'block'}],
      }),
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

describe('applyRespondentPicker', () => {
  it('sets components.input on qaPairRespondent.respondentKey', () => {
    const result = applyRespondentPicker(makeSchemaTypes(), StubComponent)
    const respondentType = result.find((t) => t.name === 'qaPairRespondent') as unknown as {
      fields: Array<{name: string; components?: {input?: unknown}}>
    }
    const respondent = respondentType.fields.find((f) => f.name === 'respondentKey')!
    expect(respondent.components?.input).toBe(StubComponent)
  })

  it('leaves qaPair and other sibling types untouched', () => {
    const original = makeSchemaTypes()
    const result = applyRespondentPicker(original, StubComponent)
    const qaPair = result.find((t) => t.name === 'qaPair')
    expect(qaPair).toEqual(original[1])
  })

  it('preserves other qaPairRespondent fields unchanged', () => {
    const result = applyRespondentPicker(makeSchemaTypes(), StubComponent)
    const respondentType = result.find((t) => t.name === 'qaPairRespondent') as unknown as {
      fields: Array<{name: string; type: string; of?: unknown}>
    }
    const answer = respondentType.fields.find((f) => f.name === 'answer')
    expect(answer).toEqual({name: 'answer', type: 'array', of: [{type: 'block'}]})
  })

  it('does not mutate the input schemaTypes array', () => {
    const original = makeSchemaTypes()
    const snapshot = structuredClone(original)
    applyRespondentPicker(original, StubComponent)
    expect(original).toEqual(snapshot)
  })

  it('is a no-op when no qaPairRespondent type is present', () => {
    const input: SchemaTypeDefinition[] = [
      defineType({name: 'player', type: 'document', fields: []}),
    ]
    const result = applyRespondentPicker(input, StubComponent)
    expect(result).toEqual(input)
  })

  it('is a no-op when qaPairRespondent has no respondentKey field', () => {
    const input: SchemaTypeDefinition[] = [
      defineType({
        name: 'qaPairRespondent',
        type: 'object',
        fields: [defineField({name: 'answer', type: 'array', of: [{type: 'block'}]})],
      }),
    ]
    const result = applyRespondentPicker(input, StubComponent)
    expect(result).toEqual(input)
  })
})
