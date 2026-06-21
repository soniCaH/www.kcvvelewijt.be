import type {LauncherTemplate} from './types'

/**
 * Phase 5+ launcher manifest for `organigramNode` (#2181).
 *
 * Org-chart positions are hand-created one at a time, so a single zero-prefill
 * card is the teaching on-ramp — no form-shape variation to seed (per design
 * decision D6, templates seed only shape-driving fields, never editorial
 * content).
 */
export const organigramNodeTemplates: LauncherTemplate[] = [
  {
    id: 'organigramNode-new',
    title: 'Nieuwe organigrampositie',
    schemaType: 'organigramNode',
    value: {},
    ui: {
      icon: 'network',
      description: 'Een functie in het organigram (bijv. Voorzitter, TVJO) — koppel wie ze bekleedt.',
      group: 'Organigram',
    },
  },
]
