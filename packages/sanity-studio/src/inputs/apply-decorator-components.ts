import type {ComponentType} from 'react'
import type {BlockDecoratorProps, SchemaTypeDefinition} from 'sanity'

type DecoratorComponentMap = Record<string, ComponentType<BlockDecoratorProps>>

/**
 * Returns a copy of `schemaTypes` with a render `component` grafted onto every
 * Portable Text decorator whose `value` matches a key of `components`,
 * wherever that decorator appears in a field's `of:[block]` array. The icon
 * stays defined in `@kcvv/sanity-schemas`; this adds the React render so the
 * schema package stays React-free.
 *
 * Non-mutating — the input array and every nested definition stay untouched.
 * A decorator that already has a `component` is left as-is (idempotent).
 */
export function applyDecoratorComponents(
  schemaTypes: readonly SchemaTypeDefinition[],
  components: DecoratorComponentMap,
): SchemaTypeDefinition[] {
  return schemaTypes.map((schemaType) => {
    const fields = (schemaType as unknown as {fields?: readonly unknown[]}).fields
    const nextFields = patchFields(fields, components)
    if (nextFields === fields) return schemaType
    return {...schemaType, fields: nextFields} as SchemaTypeDefinition
  })
}

function patchFields(
  fields: readonly unknown[] | undefined,
  components: DecoratorComponentMap,
): readonly unknown[] | undefined {
  if (!Array.isArray(fields)) return fields
  let changed = false
  const next = fields.map((field) => {
    const of = (field as {of?: unknown}).of
    const patchedOf = patchOf(of, components)
    if (patchedOf === of) return field
    changed = true
    return {...(field as object), of: patchedOf}
  })
  return changed ? next : fields
}

function patchOf(of: unknown, components: DecoratorComponentMap): unknown {
  if (!Array.isArray(of)) return of
  let changed = false
  const next = of.map((member) => {
    if (
      !member ||
      typeof member !== 'object' ||
      (member as {type?: string}).type !== 'block'
    ) {
      return member
    }
    const patched = patchBlock(member as Record<string, unknown>, components)
    if (patched === member) return member
    changed = true
    return patched
  })
  return changed ? next : of
}

function patchBlock(
  block: Record<string, unknown>,
  components: DecoratorComponentMap,
): Record<string, unknown> {
  const marks = block.marks as {decorators?: unknown} | undefined
  const decorators = marks?.decorators
  if (!Array.isArray(decorators)) return block
  let changed = false
  const nextDecorators = decorators.map((decorator) => {
    if (!decorator || typeof decorator !== 'object') return decorator
    const d = decorator as {value?: string; component?: unknown}
    const Component = d.value ? components[d.value] : undefined
    if (!Component || d.component) return decorator
    changed = true
    return {...d, component: Component}
  })
  if (!changed) return block
  return {...block, marks: {...marks, decorators: nextDecorators}}
}
