import type {ValidationMarker} from 'sanity'

/**
 * Per-document-type editor guidance shown in the GuidedSidebar inspector.
 * A type opts in by having an entry in `guideContent`; types without one
 * render Sanity's default document pane unchanged.
 *
 * The goal is to help the editor get the document into the *right*
 * configuration and spot — not just describe it. So an entry states the
 * document's intention (`intro`), where it surfaces on the public site
 * (`placement`), and any non-obvious configuration guidance (`tips`).
 */
export interface GuideEntry {
  /** What this document is and why it matters — its intention. 1–2 Dutch sentences. */
  intro: string
  /** Where the content appears on the public site (the "spot"). 1–2 Dutch sentences. */
  placement: string
  /** Config guidance for non-straightforward choices. Omit when nothing needs it. */
  tips?: string[]
}

export interface GuideOutstandingItem {
  path: string
  message: string
}

export interface GuideModel extends GuideEntry {
  outstanding: GuideOutstandingItem[]
}

/** Publish-readiness verdict shown when nothing is outstanding. */
export type GuideVerdict = 'incomplete' | 'empty' | 'validating' | 'ready'

/**
 * Derives the "what's still needed" list from Sanity's own validation markers
 * (which already respect required + hidden + custom rules), rather than
 * re-walking compiled schema rule internals. Only error-level markers count
 * as outstanding — warnings/info don't block publish. The entry's static
 * guidance fields pass through unchanged.
 */
export function buildGuideModel(markers: readonly ValidationMarker[], entry: GuideEntry): GuideModel {
  const outstanding = markers
    .filter((m) => m.level === 'error')
    .map((m) => ({
      path: (m.path ?? []).map(String).join('.'),
      message: m.message,
    }))
  return {...entry, outstanding}
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

/**
 * Resolves the readiness verdict. Empty markers are ambiguous — they mean
 * "valid" OR "not validated yet" — so `isValidating` must gate the verdict:
 * a half-filled doc whose markers haven't settled shows "validating", never a
 * premature "ready". Order: outstanding errors win; then an untouched doc;
 * then in-flight validation; only a settled, non-empty, error-free doc is ready.
 */
export function resolveGuideVerdict(args: {
  outstandingCount: number
  empty: boolean
  isValidating: boolean
}): GuideVerdict {
  if (args.outstandingCount > 0) return 'incomplete'
  if (args.empty) return 'empty'
  if (args.isValidating) return 'validating'
  return 'ready'
}
