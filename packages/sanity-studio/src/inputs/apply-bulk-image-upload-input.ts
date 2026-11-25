import type {ComponentType} from 'react'
import type {ArrayOfObjectsInputProps, SchemaTypeDefinition} from 'sanity'

type BulkImageUploadComponent = ComponentType<ArrayOfObjectsInputProps>

interface BulkImageUploadTarget {
  typeName: string
  fieldName: string
}

/**
 * Returns a copy of `schemaTypes` with the `target` field's `components.input`
 * set to `InputComponent`. Non-mutating; the input array and every nested
 * definition stay untouched. Safe no-op when the targeted type or field is
 * absent; any existing `components` on the field are preserved.
 *
 * Takes the scope as a parameter (unlike the fixed-target grafts it mirrors,
 * e.g. `applyRespondentPicker`) so promoting the bulk-upload input to another
 * image array later is one more apply line, never a rewrite (#2369).
 */
export const applyBulkImageUploadInput = (
  schemaTypes: readonly SchemaTypeDefinition[],
  InputComponent: BulkImageUploadComponent,
  {typeName, fieldName}: BulkImageUploadTarget,
): SchemaTypeDefinition[] => {
  return schemaTypes.map((schemaType) => {
    if (schemaType.name !== typeName) return schemaType
    const fields = (schemaType as unknown as {fields?: readonly Record<string, unknown>[]}).fields
    if (!Array.isArray(fields)) return schemaType
    const isTarget = (field: unknown) => (field as {name?: string}).name === fieldName
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
}
