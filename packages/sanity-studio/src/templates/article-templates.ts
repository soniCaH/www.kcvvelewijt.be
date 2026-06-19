import type {LauncherTemplate} from './types'

/**
 * Phase 3 launcher manifest for `article` (#1501).
 *
 * One card per editorial `articleType` an editor hand-creates. The two
 * data-driven types (`matchPreview` / `matchRecap`) are generated from match
 * data, not launched here, so they get no card. Per design decision D6 each
 * template seeds ONLY `articleType` — the field that changes the form's shape
 * (which groups/fields show) — and never any editorial-content prefill; the
 * card copy is the teaching moment.
 */
export const articleTemplates: LauncherTemplate[] = [
  {
    id: 'article-interview',
    title: 'Nieuw interview',
    schemaType: 'article',
    value: {articleType: 'interview'},
    ui: {
      icon: 'mic',
      description: 'Vraaggesprek met één of meer spelers/staf — toont portretten en Q&A.',
      group: 'Articles',
    },
  },
  {
    id: 'article-announcement',
    title: 'Nieuwe aankondiging',
    schemaType: 'article',
    value: {articleType: 'announcement'},
    ui: {
      icon: 'megaphone',
      description: 'Algemeen clubnieuws of mededeling — de standaard artikelvorm.',
      group: 'Articles',
    },
  },
  {
    id: 'article-transfer',
    title: 'Nieuwe transfer',
    schemaType: 'article',
    value: {articleType: 'transfer'},
    ui: {
      icon: 'arrow-left-right',
      description: 'Komst, vertrek of verlenging van een speler — vraagt een Transfer-fact.',
      group: 'Articles',
    },
  },
  {
    id: 'article-event',
    title: 'Nieuw event',
    schemaType: 'article',
    value: {articleType: 'event'},
    ui: {
      icon: 'calendar',
      description: 'Verslag of aankondiging van een clubevenement — vraagt een Event-fact.',
      group: 'Articles',
    },
  },
]
