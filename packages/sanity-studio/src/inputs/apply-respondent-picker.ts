import type {ComponentType} from 'react'
import type {SchemaTypeDefinition, StringInputProps} from 'sanity'

type RespondentPickerComponent = ComponentType<StringInputProps>

/**
 * Returns a copy of `schemaTypes` with the `qaPairRespondent.respondentKey`
 * field's `components.input` set to `InputComponent`. Non-mutating; the input
 * array and every nested definition stay untouched. Safe no-op when the
 * `qaPairRespondent` type or its `respondentKey` field is absent.
 *
 * Note: `respondentKey` moved from `qaPair` onto the nested `qaPairRespondent`
 * object in the multi-respondent rework (see `qa-pair-respondents` migration).
 *
 * Mirrors the shape of `applyArticleTagsInput` — the two helpers compose:
 * `applyRespondentPicker(applyArticleTagsInput(baseSchemaTypes, ...), ...)`.
 */
export const applyRespondentPicker = (
  schemaTypes: readonly SchemaTypeDefinition[],
  InputComponent: RespondentPickerComponent,): SchemaTypeDefinition[] => {
  return schemaTypes.map((schemaType) => {
    if (schemaType.name !== 'qaPairRespondent') return schemaType
    const fields = (schemaType as unknown as {fields?: readonly Record<string, unknown>[]}).fields
    if (!Array.isArray(fields)) return schemaType
    const isTarget = (field: unknown) => (field as {name?: string}).name === 'respondentKey'
    if (!fields.some(isTarget)) return schemaType
    const nextFields = fields.map((field) => {
      if (!isTarget(field)) return field
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
    return {...schemaType, fields: nextFields} as SchemaTypeDefinition
  })
};
