import type {LauncherTemplate} from './types'

/**
 * Phase 5+ launcher manifest for `page` (#1508).
 *
 * Static info pages are hand-created one at a time, so a single zero-prefill
 * card is the teaching on-ramp — no form-shape variation to seed (per design
 * decision D6, templates seed only shape-driving fields, never editorial
 * content). The card copy is the teaching moment.
 */
export const pageTemplates: LauncherTemplate[] = [
  {
    id: 'page-new',
    title: 'Nieuwe pagina',
    schemaType: 'page',
    value: {},
    ui: {
      icon: 'file-text',
      description: 'Een statische infopagina (bijv. praktische info, geschiedenis) — vrije tekst met titel en URL.',
      group: 'Pages',
    },
  },
]
