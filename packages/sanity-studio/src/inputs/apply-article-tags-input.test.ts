import {describe, expect, it} from 'vitest'
import {applyArticleTagsInput} from './apply-article-tags-input'

const StubComponent = () => null

const makeSchemaTypes = () => [
  {
    name: 'article',
    type: 'document',
    fields: [
      {name: 'title', type: 'string'},
      {
        name: 'tags',
        type: 'array',
        of: [{type: 'string'}],
        options: {layout: 'tags'},
      },
    ],
  },
  {
    name: 'player',
    type: 'document',
    fields: [{name: 'name', type: 'string'}],
  },
]

describe('applyArticleTagsInput', () => {
  it('sets components.input on the article tags field', () => {
    const result = applyArticleTagsInput(makeSchemaTypes() as never, StubComponent as never)
    const article = result.find((t) => t.name === 'article') as unknown as {
      fields: Array<{name: string; components?: {input?: unknown}}>
    }
    const tags = article.fields.find((f) => f.name === 'tags')!
    expect(tags.components?.input).toBe(StubComponent)
  })

  it('leaves every other schema type untouched', () => {
    const original = makeSchemaTypes()
    const result = applyArticleTagsInput(original as never, StubComponent as never)
    const player = result.find((t) => t.name === 'player')
    expect(player).toEqual(original[1])
  })

  it('does not mutate the input schemaTypes array', () => {
    const original = makeSchemaTypes()
    const snapshot = structuredClone(original)
    applyArticleTagsInput(original as never, StubComponent as never)
    expect(original).toEqual(snapshot)
  })

  it('preserves every other field on the article type', () => {
    const result = applyArticleTagsInput(makeSchemaTypes() as never, StubComponent as never)
    const article = result.find((t) => t.name === 'article') as unknown as {
      fields: Array<{name: string; type: string}>
    }
    const titleField = article.fields.find((f) => f.name === 'title')
    expect(titleField).toEqual({name: 'title', type: 'string'})
  })

  it('is a no-op when no article type is present', () => {
    const input = [{name: 'player', type: 'document', fields: []}]
    const result = applyArticleTagsInput(input as never, StubComponent as never)
    expect(result).toEqual(input)
  })

  it('is a no-op when the article type has no tags field', () => {
    const input = [
      {
        name: 'article',
        type: 'document',
        fields: [{name: 'title', type: 'string'}],
      },
    ]
    const result = applyArticleTagsInput(input as never, StubComponent as never)
    expect(result).toEqual(input)
  })
})
