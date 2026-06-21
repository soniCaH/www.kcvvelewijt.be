import type {LauncherTemplate} from './types'

/**
 * Launcher manifest for `photoGallery` (#1471). Galleries are always
 * hand-created (no PSD/sync seed), so a single zero-prefill card suffices —
 * per design decision D6 the card copy is the teaching moment, not prefilled
 * editorial content. The curated `+ Create` menu hides the bare `+ Photo
 * gallery` default once this card is registered.
 */
export const photoGalleryTemplates: LauncherTemplate[] = [
  {
    id: 'photoGallery-new',
    title: 'Nieuwe fotogalerij',
    schemaType: 'photoGallery',
    value: {},
    ui: {
      icon: 'image',
      description: "Een reeks foto's van een wedstrijd, evenement of clubmoment — toont als galerij op de site.",
      group: 'PhotoGalleries',
    },
  },
]
