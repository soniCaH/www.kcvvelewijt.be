export interface LoadingAnnouncementProps {
  /**
   * Dutch, per-route label, e.g. "Nieuws laden…". Uses the ellipsis
   * character (`…`), never three periods — the two read identically to a
   * screen reader, but the audit that shipped this component found both in
   * production and standardised on the one.
   */
  label: string;
}

/**
 * `<LoadingAnnouncement>` — the one screen-reader announcement shape every
 * route's `loading.tsx` renders (#2432 §4).
 *
 * Four different shapes shipped before this component existed: the full
 * triplet below (15 files), `status` + `aria-busy` only (2), `status` +
 * `aria-live` only (2), and nothing at all (9) — leaving a screen-reader user
 * in silence through a multi-second BFF read on nine routes. `label` is the
 * only thing that may vary between call sites.
 *
 * Always render this OUTSIDE any `aria-hidden="true"` wrapper — the visual
 * skeleton bars are hidden from assistive tech, but the announcement is the
 * one thing in a `loading.tsx` that must not be.
 */
export const LoadingAnnouncement = ({ label }: LoadingAnnouncementProps) => {
  return (
    <span role="status" aria-busy="true" aria-live="polite" className="sr-only">
      {label}
    </span>
  );
};
