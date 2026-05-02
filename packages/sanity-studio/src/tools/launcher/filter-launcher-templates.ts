import type {Template} from 'sanity'

import {isLauncherTemplate, type LauncherTemplate} from '../../templates/types'

/**
 * Pure filter — narrows Sanity's `Template[]` down to the launcher-
 * eligible subset and drops entries whose `schemaType` is unknown to
 * the workspace (would fail-closed on intent navigation otherwise).
 *
 * Unknown types are reported via `onUnknownType` so the calling hook
 * can log once per render. Tests pass a no-op to keep them silent.
 *
 * Lives in its own file (separate from `use-templates.ts`) so the
 * vitest suite can import it without dragging Sanity's runtime CSS
 * bundle into the module graph.
 */
export function filterLauncherTemplates(
  templates: ReadonlyArray<Template>,
  isKnownType: (schemaType: string) => boolean,
  onUnknownType?: (schemaType: string) => void,
): LauncherTemplate[] {
  const result: LauncherTemplate[] = []
  const seenUnknown = new Set<string>()
  for (const template of templates) {
    if (!isLauncherTemplate(template)) continue
    if (!isKnownType(template.schemaType)) {
      if (onUnknownType && !seenUnknown.has(template.schemaType)) {
        seenUnknown.add(template.schemaType)
        onUnknownType(template.schemaType)
      }
      continue
    }
    result.push(template)
  }
  return result
}
