import type {Template} from 'sanity'

/**
 * UI metadata required for a template to appear on the LauncherTool grid.
 * Templates without a `ui` block are ignored by the launcher (they still
 * work via Sanity's default `+ Create` button) — this preserves graceful
 * coexistence with auto-generated and third-party templates.
 */
export interface LauncherTemplateUi {
  /** Lucide icon name rendered on the card (e.g. `'help-circle'`). */
  icon: string
  /** Dutch ≤100-char "when to use this" description rendered on the card. */
  description: string
  /** Card group label (e.g. `'Responsibilities'`, `'Articles'`). */
  group: string
}

/**
 * Sanity Template extended with the launcher-specific `ui` block. Cards
 * appear on the launcher grid only for templates of this shape.
 */
export interface LauncherTemplate extends Template {
  ui: LauncherTemplateUi
}

/**
 * Type guard used by `useTemplates()` to narrow Sanity's `Template[]`
 * down to the launcher-eligible subset. Filtering on `'ui' in t` alone
 * is not enough — the field could be present but malformed; this guard
 * checks the three required string fields explicitly.
 */
export function isLauncherTemplate(template: Template): template is LauncherTemplate {
  const ui = (template as Partial<LauncherTemplate>).ui
  return (
    !!ui &&
    typeof ui.icon === 'string' &&
    typeof ui.description === 'string' &&
    typeof ui.group === 'string'
  )
}
