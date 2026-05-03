import type {LauncherTemplate} from '../../templates/types'

/**
 * Group templates by `ui.group`, preserving the first-seen group order.
 *
 * Lives in its own file (separate from `launcher-grid.tsx`) so vitest
 * can import it without dragging Sanity UI / runtime CSS into the
 * module graph. Mirrors the convention established by
 * `filter-launcher-templates.ts`.
 */
export function groupByUiGroup(
  templates: ReadonlyArray<LauncherTemplate>,
): {group: string; templates: LauncherTemplate[]}[] {
  const order: string[] = []
  const map = new Map<string, LauncherTemplate[]>()
  for (const template of templates) {
    const key = template.ui.group
    if (!map.has(key)) {
      map.set(key, [])
      order.push(key)
    }
    map.get(key)!.push(template)
  }
  return order.map((group) => ({group, templates: map.get(group)!}))
}

/**
 * Case-insensitive substring search across the title, description,
 * group label, and schemaType. Empty / whitespace queries return the
 * full input list (a fresh copy, never the input array).
 */
export function searchTemplates(
  templates: ReadonlyArray<LauncherTemplate>,
  query: string,
): LauncherTemplate[] {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) return [...templates]
  return templates.filter((template) => {
    const haystack =
      `${template.title} ${template.ui.description} ${template.ui.group} ${template.schemaType}`.toLowerCase()
    return haystack.includes(trimmed)
  })
}
