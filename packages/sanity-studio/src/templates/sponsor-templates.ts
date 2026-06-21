import type {LauncherTemplate} from './types'

/**
 * Phase 5+ launcher manifest for `sponsor` (#1506).
 *
 * Sponsors are hand-created one at a time, so a single zero-prefill card is
 * the teaching on-ramp — there is no form-shape variation to seed (per design
 * decision D6, templates seed only shape-driving fields, never editorial
 * content). The card copy is the teaching moment.
 */
export const sponsorTemplates: LauncherTemplate[] = [
  {
    id: 'sponsor-new',
    title: 'Nieuwe sponsor',
    schemaType: 'sponsor',
    value: {},
    ui: {
      icon: 'handshake',
      description: 'Voeg een sponsor of partner toe — logo, tier en website voor het sponsoroverzicht.',
      group: 'Sponsors',
    },
  },
]
