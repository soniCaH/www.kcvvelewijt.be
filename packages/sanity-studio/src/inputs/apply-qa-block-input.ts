import type {ComponentType} from 'react'
import type {ObjectItemProps, SchemaTypeDefinition} from 'sanity'

type ItemComponent = ComponentType<ObjectItemProps>

export interface QaBlockInlineComponents {
  /** `components.item` for `qaPair` array items. */
  QaPairItem: ItemComponent
  /** `components.item` for `qaPairRespondent` array items. */
  QaPairRespondentItem: ItemComponent
}

/**
 * Returns a copy of `schemaTypes` with inline Q&A authoring grafted on: the
 * `qaPair` and `qaPairRespondent` types get a `components.item` renderer so
 * their array items render in place instead of opening nested dialogs (#2277).
 * Non-mutating; every other type is returned untouched. Safe no-op when the
 * `qaPair` / `qaPairRespondent` types are absent.
 *
 * Mirrors the shape of `applyRespondentPicker` — the grafts compose:
 * `applyQaBlockInput(applyRespondentPicker(base, RespondentPicker), {...})`.
 * Ordering is irrelevant: the picker grafts a field's `components.input`,
 * this grafts a type's `components.item` — disjoint targets.
 */
export function applyQaBlockInput(
  schemaTypes: readonly SchemaTypeDefinition[],
  {QaPairItem, QaPairRespondentItem}: QaBlockInlineComponents,
): SchemaTypeDefinition[] {
  const itemFor: Record<string, ItemComponent> = {
    qaPair: QaPairItem,
    qaPairRespondent: QaPairRespondentItem,
  }
  return schemaTypes.map((schemaType) => {
    const item = itemFor[schemaType.name]
    if (!item) return schemaType
    const existingComponents =
      (schemaType as {components?: Record<string, unknown>}).components ?? {}
    return {
      ...schemaType,
      components: {...existingComponents, item},
    } as SchemaTypeDefinition
  })
}
