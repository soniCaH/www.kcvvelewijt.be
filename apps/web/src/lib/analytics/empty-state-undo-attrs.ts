/**
 * Which host rendered a filtered `<EmptyState>`'s undo. A closed union (not
 * `string`) so a typo or a copy-paste from `<EmptyState surface>` (a
 * *different* prop on the same component — a visual ground:
 * `"paper" | "bare" | "inverse"`) fails to compile instead of shipping a
 * garbage GA4 dimension value.
 *
 * Lives here, not in the design-system primitive: a five-app-page GA4
 * vocabulary inside `EmptyState.tsx` would mean a sixth filtered surface or a
 * page rename edits design-system source. The primitive owns the *shape*
 * (`EmptyStateAction`'s two extra fields); this analytics leaf owns the
 * *members* — matching `NavSource` (`useNavigationAnalytics.ts`) and
 * `VideoSource` (`useVideoAnalytics.ts`), the repo's other source unions.
 */
export type EmptyStateUndoSource =
  "evenementen" | "kalender" | "hulp_audience" | "hulp_category" | "nieuws";

export interface EmptyStateUndoAttrs {
  source: EmptyStateUndoSource;
  facet: string;
}

/**
 * Read the inert `data-empty-state-undo-source` / `-facet` markers
 * `<EmptyState reason="filtered">` renders off a delegated click target, or
 * `null` when the element carries no source. Mirrors `readSponsorAttrs`
 * (`sponsor-attrs.ts`) — the shape this repo already uses to keep a
 * delegated attribute's names and domain-union cast in one leaf module
 * shared by writer and reader, rather than spelling the attribute name at
 * every call site.
 */
export const readEmptyStateUndoAttrs = (
  el: HTMLElement,
): EmptyStateUndoAttrs | null => {
  const source = el.getAttribute("data-empty-state-undo-source");
  const facet = el.getAttribute("data-empty-state-undo-facet");
  if (!source || !facet) return null;
  return { source: source as EmptyStateUndoSource, facet };
};
