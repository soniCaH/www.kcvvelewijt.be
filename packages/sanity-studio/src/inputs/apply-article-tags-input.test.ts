import type {ComponentType} from 'react'
import {
  type ArrayOfPrimitivesInputProps,
  type SchemaTypeDefinition,
  defineField,
  defineType,
} from 'sanity'
import {describe, expect, it} from 'vitest'
import {applyArticleTagsInput} from './apply-article-tags-input'

const StubComponent: ComponentType<ArrayOfPrimitivesInputProps<string>> = () => null

const makeSchemaTypes = (): SchemaTypeDefinition[] => [
  defineType({
    name: 'article',
    type: 'document',
    fields: [
      defineField({name: 'title', type: 'string'}),
      defineField({
        name: 'tags',
        type: 'array',
        of: [{type: 'string'}],
        options: {layout: 'tags'},
      }),
    ],
  }),
  defineType({
    name: 'player',
    type: 'document',
    fields: [defineField({name: 'name', type: 'string'})],
  }),
]

describe('applyArticleTagsInput', () => {
  it('sets components.input on the article tags field', () => {
    const result = applyArticleTagsInput(makeSchemaTypes(), StubComponent)
    const article = result.find((t) => t.name === 'article') as unknown as {
      fields: Array<{name: string; components?: {input?: unknown}}>
    }
    const tags = article.fields.find((f) => f.name === 'tags')!
    expect(tags.components?.input).toBe(StubComponent)
  })

  it('leaves every other schema type untouched', () => {
    const original = makeSchemaTypes()
    const result = applyArticleTagsInput(original, StubComponent)
    const player = result.find((t) => t.name === 'player')
    expect(player).toEqual(original[1])
  })

  it('does not mutate the input schemaTypes array', () => {
    const original = makeSchemaTypes()
    const snapshot = structuredClone(original)
    applyArticleTagsInput(original, StubComponent)
    expect(original).toEqual(snapshot)
  })

  it('preserves every other field on the article type', () => {
    const result = applyArticleTagsInput(makeSchemaTypes(), StubComponent)
    const article = result.find((t) => t.name === 'article') as unknown as {
      fields: Array<{name: string; type: string}>
    }
    const titleField = article.fields.find((f) => f.name === 'title')
    expect(titleField).toEqual({name: 'title', type: 'string'})
  })

  it('is a no-op when no article type is present', () => {
    const input: SchemaTypeDefinition[] = [
      defineType({name: 'player', type: 'document', fields: []}),
    ]
    const result = applyArticleTagsInput(input, StubComponent)
    expect(result).toEqual(input)
  })

  it('is a no-op when the article type has no tags field', () => {
    const input: SchemaTypeDefinition[] = [
      defineType({
        name: 'article',
        type: 'document',
        fields: [defineField({name: 'title', type: 'string'})],
      }),
    ]
    const result = applyArticleTagsInput(input, StubComponent)
    expect(result).toEqual(input)
  })
})
