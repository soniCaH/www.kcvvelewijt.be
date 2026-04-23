import type {ComponentType} from 'react'
import type {SchemaTypeDefinition, StringInputProps} from 'sanity'

type RespondentPickerComponent = ComponentType<StringInputProps>

/**
 * Returns a copy of `schemaTypes` with the `qaPair.respondentKey` field's
 * `components.input` set to `InputComponent`. Non-mutating; the input array
 * and every nested definition stay untouched. Safe no-op when the `qaPair`
 * type or its `respondentKey` field is absent.
 *
 * Mirrors the shape of `applyArticleTagsInput` — the two helpers compose:
 * `applyRespondentPicker(applyArticleTagsInput(baseSchemaTypes, ...), ...)`.
 */
export function applyRespondentPicker(
  schemaTypes: readonly SchemaTypeDefinition[],
  InputComponent: RespondentPickerComponent,
): SchemaTypeDefinition[] {
  return schemaTypes.map((schemaType) => {
    if (schemaType.name !== 'qaPair') return schemaType
    const fields = (schemaType as unknown as {fields?: readonly Record<string, unknown>[]}).fields
    if (!Array.isArray(fields)) return schemaType
    let changed = false
    const nextFields = fields.map((field) => {
      if ((field as {name?: string}).name !== 'respondentKey') return field
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
