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
    name: 'qaPair',
    type: 'object',
    fields: [
      defineField({name: 'question', type: 'string'}),
      defineField({
        name: 'answer',
        type: 'array',
        of: [{type: 'block'}],
      }),
      defineField({name: 'tag', type: 'string'}),
      defineField({name: 'respondentKey', type: 'string'}),
    ],
  }),
  defineType({
    name: 'qaBlock',
    type: 'object',
    fields: [defineField({name: 'pairs', type: 'array', of: [{type: 'qaPair'}]})],
  }),
]

describe('applyRespondentPicker', () => {
  it('sets components.input on qaPair.respondentKey', () => {
    const result = applyRespondentPicker(makeSchemaTypes(), StubComponent)
    const qaPair = result.find((t) => t.name === 'qaPair') as unknown as {
      fields: Array<{name: string; components?: {input?: unknown}}>
    }
    const respondent = qaPair.fields.find((f) => f.name === 'respondentKey')!
    expect(respondent.components?.input).toBe(StubComponent)
  })

  it('leaves qaBlock and other sibling types untouched', () => {
    const original = makeSchemaTypes()
    const result = applyRespondentPicker(original, StubComponent)
    const qaBlock = result.find((t) => t.name === 'qaBlock')
    expect(qaBlock).toEqual(original[1])
  })

  it('preserves other qaPair fields unchanged', () => {
    const result = applyRespondentPicker(makeSchemaTypes(), StubComponent)
    const qaPair = result.find((t) => t.name === 'qaPair') as unknown as {
      fields: Array<{name: string; type: string}>
    }
    const question = qaPair.fields.find((f) => f.name === 'question')
    expect(question).toEqual({name: 'question', type: 'string'})
    const tag = qaPair.fields.find((f) => f.name === 'tag')
    expect(tag).toEqual({name: 'tag', type: 'string'})
  })

  it('does not mutate the input schemaTypes array', () => {
    const original = makeSchemaTypes()
    const snapshot = structuredClone(original)
    applyRespondentPicker(original, StubComponent)
    expect(original).toEqual(snapshot)
  })

  it('is a no-op when no qaPair type is present', () => {
    const input: SchemaTypeDefinition[] = [
      defineType({name: 'player', type: 'document', fields: []}),
    ]
    const result = applyRespondentPicker(input, StubComponent)
    expect(result).toEqual(input)
  })

  it('is a no-op when qaPair has no respondentKey field', () => {
    const input: SchemaTypeDefinition[] = [
      defineType({
        name: 'qaPair',
        type: 'object',
        fields: [defineField({name: 'question', type: 'string'})],
      }),
    ]
    const result = applyRespondentPicker(input, StubComponent)
    expect(result).toEqual(input)
  })
})
