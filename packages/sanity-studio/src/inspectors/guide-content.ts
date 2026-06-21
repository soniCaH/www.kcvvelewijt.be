import type {GuideEntry} from './guide-model'

/**
 * Per-document-type editor guidance. Add an entry here to opt a document type
 * into the GuidedSidebar inspector; types without an entry are left with
 * Sanity's default document pane. Start with `responsibility` (the reference
 * type for the editor-UX rework) and extend as other types are reworked.
 */
export const guideContent: Record<string, GuideEntry> = {
  responsibility: {
    intro:
      'Een info-pad beantwoordt één concrete vraag van een bezoeker (bijv. "Hoe sluit ik mijn kind aan?"). Vul de vraag, een helder antwoord en een contactpersoon in — zo vindt de bezoeker meteen het juiste aanspreekpunt op de site.',
  },
}
