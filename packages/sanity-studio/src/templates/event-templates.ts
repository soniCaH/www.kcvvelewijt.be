import type {LauncherTemplate} from './types'

/**
 * Phase 5+ launcher manifest for `event` (#1507).
 *
 * One card per `eventType` an editor hand-creates — the field that drives the
 * agenda colour-coding. Per design decision D6 each template seeds ONLY
 * `eventType` (no editorial-content prefill); the card copy is the teaching
 * moment. A card per type is needed because the curated `+ Create` menu hides
 * the bare `+ Event` default once `event` has launcher templates.
 */
export const eventTemplates: LauncherTemplate[] = [
  {
    id: 'event-clubevent',
    title: 'Nieuw clubevent',
    schemaType: 'event',
    value: {eventType: 'Clubevent'},
    ui: {
      icon: 'party-popper',
      description: 'Een activiteit georganiseerd door de club (bijv. eetfestijn, quiz, viering).',
      group: 'Events',
    },
  },
  {
    id: 'event-supportersactiviteit',
    title: 'Nieuwe supportersactiviteit',
    schemaType: 'event',
    value: {eventType: 'Supportersactiviteit'},
    ui: {
      icon: 'users',
      description: 'Een activiteit van of voor de supporters (bijv. busreis, supportersfeest).',
      group: 'Events',
    },
  },
  {
    id: 'event-jeugdwerking',
    title: 'Nieuwe jeugdactiviteit',
    schemaType: 'event',
    value: {eventType: 'Jeugdwerking'},
    ui: {
      icon: 'baby',
      description: 'Een activiteit binnen de jeugdwerking (bijv. tornooi, stage, jeugddag).',
      group: 'Events',
    },
  },
  {
    id: 'event-andere',
    title: 'Nieuw evenement (overig)',
    schemaType: 'event',
    value: {eventType: 'Andere'},
    ui: {
      icon: 'calendar',
      description: 'Een evenement dat niet onder de andere categorieën valt.',
      group: 'Events',
    },
  },
]
