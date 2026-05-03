import type {LauncherTemplate} from './types'

/**
 * Phase 1 tracer-bullet template manifest for `responsibility`.
 * Single zero-prefill entry — the launcher card copy is the teaching
 * moment. Editorial defaults are deliberately NOT seeded; per design
 * decision D6 templates only seed fields that change form shape.
 */
export const responsibilityTemplates: LauncherTemplate[] = [
  {
    id: 'responsibility-new',
    title: 'Nieuwe responsibility',
    schemaType: 'responsibility',
    value: {},
    ui: {
      icon: 'help-circle',
      description:
        "Voor info-paden zoals 'Hoe meld ik een blessure?' — gebruikers vinden dit via zoeken op de site.",
      group: 'Responsibilities',
    },
  },
]
