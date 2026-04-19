import type {ComponentType} from 'react'
import type {ArrayOfPrimitivesInputProps, SchemaTypeDefinition} from 'sanity'

type ArticleTagsInputComponent = ComponentType<ArrayOfPrimitivesInputProps<string>>

/**
 * Returns a copy of `schemaTypes` with the `article.tags` field's
 * `components.input` set to `InputComponent`. Non-mutating — the input array
 * and every nested definition stay untouched. Safe no-op when the `article`
 * type or its `tags` field is absent.
 */
export function applyArticleTagsInput(
  schemaTypes: readonly SchemaTypeDefinition[],
  InputComponent: ArticleTagsInputComponent,
): SchemaTypeDefinition[] {
  return schemaTypes.map((schemaType) => {
    if (schemaType.name !== 'article') return schemaType
    const fields = (schemaType as unknown as {fields?: readonly Record<string, unknown>[]}).fields
    if (!Array.isArray(fields)) return schemaType
    let changed = false
    const nextFields = fields.map((field) => {
      if ((field as {name?: string}).name !== 'tags') return field
      changed = true
      const existingComponents =
        ((field as {components?: Record<string, unknown>}).components) ?? {}
      return {
        ...field,
        components: {
          ...existingComponents,
          input: InputComponent,
        },
      }
    })
    if (!changed) return schemaType
    return {...schemaType, fields: nextFields} as SchemaTypeDefinition
  })
}
