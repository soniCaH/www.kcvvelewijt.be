import type {ComponentType} from 'react'
import {
  defineField,
  defineType,
  type ArrayOfObjectsInputProps,
  type SchemaTypeDefinition,
} from 'sanity'
import {schemaTypes as baseSchemaTypes} from '@kcvv/sanity-schemas'
import {describe, expect, it} from 'vitest'
import {applyFieldInput} from './apply-field-input'

const StubComponent: ComponentType<ArrayOfObjectsInputProps> = () => null

const TARGET = {typeName: 'photoGallery', fieldName: 'images'}

const makeSchemaTypes = (): SchemaTypeDefinition[] => [
  defineType({
    name: 'photoGallery',
    type: 'document',
    fields: [
      defineField({name: 'title', type: 'string'}),
      defineField({
        name: 'images',
        type: 'array',
        of: [{type: 'image', name: 'galleryImage'}],
      }),
    ],
  }),
  defineType({
    name: 'event',
    type: 'document',
    fields: [defineField({name: 'title', type: 'string'})],
  }),
]

describe('applyFieldInput', () => {
  it('sets components.input on the targeted field', () => {
    const result = applyFieldInput(makeSchemaTypes(), StubComponent, TARGET)
    const galleryType = result.find((t) => t.name === 'photoGallery') as unknown as {
      fields: Array<{name: string; components?: {input?: unknown}}>
    }
    const images = galleryType.fields.find((f) => f.name === 'images')!
    expect(images.components?.input).toBe(StubComponent)
  })

  it('leaves sibling types untouched', () => {
    const original = makeSchemaTypes()
    const result = applyFieldInput(original, StubComponent, TARGET)
    const event = result.find((t) => t.name === 'event')
    expect(event).toEqual(original[1])
  })

  it('preserves other photoGallery fields unchanged', () => {
    const result = applyFieldInput(makeSchemaTypes(), StubComponent, TARGET)
    const galleryType = result.find((t) => t.name === 'photoGallery') as unknown as {
      fields: Array<{name: string; type: string}>
    }
    const title = galleryType.fields.find((f) => f.name === 'title')
    expect(title).toEqual({name: 'title', type: 'string'})
  })

  it('preserves existing components on the targeted field', () => {
    const ExistingItem: ComponentType = () => null
    const input: SchemaTypeDefinition[] = [
      defineType({
        name: 'photoGallery',
        type: 'document',
        fields: [
          defineField({
            name: 'images',
            type: 'array',
            of: [{type: 'image', name: 'galleryImage'}],
            components: {item: ExistingItem},
          }),
        ],
      }),
    ]
    const result = applyFieldInput(input, StubComponent, TARGET)
    const galleryType = result.find((t) => t.name === 'photoGallery') as unknown as {
      fields: Array<{name: string; components?: {input?: unknown; item?: unknown}}>
    }
    const images = galleryType.fields.find((f) => f.name === 'images')!
    expect(images.components?.input).toBe(StubComponent)
    expect(images.components?.item).toBe(ExistingItem)
  })

  it('does not mutate the input schemaTypes array', () => {
    const original = makeSchemaTypes()
    const snapshot = structuredClone(original)
    applyFieldInput(original, StubComponent, TARGET)
    expect(original).toEqual(snapshot)
  })

  it('is a no-op when the targeted type is absent', () => {
    const input: SchemaTypeDefinition[] = [
      defineType({name: 'player', type: 'document', fields: []}),
    ]
    const result = applyFieldInput(input, StubComponent, TARGET)
    expect(result).toEqual(input)
  })

  it('is a no-op when the targeted field is absent', () => {
    const input: SchemaTypeDefinition[] = [
      defineType({
        name: 'photoGallery',
        type: 'document',
        fields: [defineField({name: 'title', type: 'string'})],
      }),
    ]
    const result = applyFieldInput(input, StubComponent, TARGET)
    expect(result).toEqual(input)
  })

  it('targets whatever scope it is given, not a hardcoded field', () => {
    const result = applyFieldInput(makeSchemaTypes(), StubComponent, {
      typeName: 'event',
      fieldName: 'title',
    })
    const eventType = result.find((t) => t.name === 'event') as unknown as {
      fields: Array<{name: string; components?: {input?: unknown}}>
    }
    const title = eventType.fields.find((f) => f.name === 'title')!
    expect(title.components?.input).toBe(StubComponent)
  })

  // De-drift (#2278): assert the graft lands on the schema actually shipped by
  // `@kcvv/sanity-schemas`, so a rename of the type or field fails this test
  // instead of a stale fixture.
  describe('against the real @kcvv/sanity-schemas schema', () => {
    it('grafts components.input onto the real photoGallery.images', () => {
      const result = applyFieldInput(baseSchemaTypes, StubComponent, TARGET)
      const galleryType = result.find((t) => t.name === 'photoGallery') as unknown as {
        fields: Array<{name: string; components?: {input?: unknown}}>
      }
      expect(galleryType).toBeDefined()
      const images = galleryType.fields.find((f) => f.name === 'images')
      expect(images?.components?.input).toBe(StubComponent)
    })
  })
})
