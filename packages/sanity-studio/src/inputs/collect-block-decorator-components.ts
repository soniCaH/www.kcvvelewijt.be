import type {SchemaTypeDefinition} from 'sanity'

/**
 * Shared TEST helper (#2278). Collects the `component` of every block decorator
 * whose `value` matches, scanning each top-level type's direct `field.of[]`
 * block members.
 *
 * Mirrors `applyDecoratorComponents`' own traversal exactly — it skips
 * non-block members and does NOT recurse into nested object fields — so the
 * graft-target guards that assert against it stay aligned with the helper's
 * real reach in a single place. Keep this in lockstep with
 * `apply-decorator-components.ts` if that traversal ever changes scope.
 *
 * Not re-exported from the package barrel; imported only by the decorator
 * graft tests.
 */
export function collectBlockDecoratorComponents(
  types: readonly SchemaTypeDefinition[],
  value: string,
): unknown[] {
  const out: unknown[] = []
  for (const type of types) {
    const fields = (type as {fields?: unknown[]}).fields
    if (!Array.isArray(fields)) continue
    for (const field of fields) {
      const of = (field as {of?: unknown}).of
      if (!Array.isArray(of)) continue
      for (const member of of) {
        if (
          !member ||
          typeof member !== 'object' ||
          (member as {type?: string}).type !== 'block'
        ) {
          continue
        }
        const decorators = (member as {marks?: {decorators?: unknown}})?.marks
          ?.decorators
        if (!Array.isArray(decorators)) continue
        for (const d of decorators) {
          if (
            d &&
            typeof d === 'object' &&
            (d as {value?: string}).value === value
          ) {
            out.push((d as {component?: unknown}).component)
          }
        }
      }
    }
  }
  return out
}
