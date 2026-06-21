import type {ValidationMarker} from 'sanity'

/**
 * Per-document-type editor guidance shown in the GuidedSidebar inspector.
 * A type opts in by having an entry in `guideContent`; types without one
 * render Sanity's default document pane unchanged.
 */
export interface GuideEntry {
  /** Plain-language "why this matters" intro for this document type (Dutch). */
  intro: string
}

export interface GuideOutstandingItem {
  path: string
  message: string
}

export interface GuideModel {
  intro: string
  outstanding: GuideOutstandingItem[]
}

/**
 * Derives the "what's still needed" list from Sanity's own validation markers
 * (which already respect required + hidden + custom rules), rather than
 * re-walking compiled schema rule internals. Only error-level markers count
 * as outstanding — warnings/info don't block publish.
 */
export function buildGuideModel(
  markers: readonly ValidationMarker[],
  entry: GuideEntry,
): GuideModel {
  const outstanding = markers
    .filter((m) => m.level === 'error')
    .map((m) => ({
      path: (m.path ?? []).map(String).join('.'),
      message: m.message,
    }))
  return {intro: entry.intro, outstanding}
}

/**
 * A brand-new draft has only system (`_`-prefixed) keys and Sanity has not yet
 * produced validation markers for it — so "no outstanding errors" must NOT be
 * read as "publish-ready". This distinguishes an untouched doc from a complete
 * one so the panel can show "begin met invullen" instead of a false green tick.
 */
export function isDocEmpty(value: Record<string, unknown> | null | undefined): boolean {
  if (!value) return true
  return Object.keys(value).every((key) => key.startsWith('_'))
}
