/**
 * Per-document-type editor guidance shown in the GuidedSidebar inspector.
 * A type opts in by having an entry in `guideContent`; types without one
 * render Sanity's default document pane unchanged.
 *
 * The guide helps the editor get the document into the right configuration
 * and spot — not just describe it. So an entry states the document's intention
 * (`intro`), where it surfaces on the public site (`placement`), and any
 * non-obvious configuration guidance (`tips`).
 *
 * "What's still outstanding" is deliberately NOT duplicated here — Sanity's
 * native validation (red field/tab markers + a blocked Publish button) already
 * shows that reliably, and the inspector can't see the form's live validation
 * without diverging from it. The guide stays purely a curation aid.
 */
export interface GuideEntry {
  /** What this document is and why it matters — its intention. 1–2 Dutch sentences. */
  intro: string
  /** Where the content appears on the public site (the "spot"). 1–2 Dutch sentences. */
  placement: string
  /** Config guidance for non-straightforward choices. Omit when nothing needs it. */
  tips?: string[]
}
