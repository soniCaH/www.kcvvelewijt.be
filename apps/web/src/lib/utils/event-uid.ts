/**
 * The one iCal UID scheme for a club activity, shared by the subscribe
 * feed's club-activity VEVENTs (`ical.ts`'s `eventToEntry`) and the per-event
 * "Zet in agenda" download (`EventDetailCtas`'s `buildEventIcs` call). Before
 * #2716 the two surfaces minted different UIDs for the same activity — a
 * subscriber who used both got it twice, with no way for a calendar app to
 * reconcile the two.
 *
 * Keyed by the Sanity document id (or source article id, for an
 * `articleType:event` row) rather than the slug: a slug is editable in the
 * Studio, and re-keying on it would silently mint a new UID on rename,
 * orphaning the old one in every subscriber's calendar. The id is stable for
 * the life of the document — the only one of the two schemes that survives a
 * Studio slug edit.
 *
 * `kcvv-event-` keeps this namespace disjoint from a match's `kcvv-match-`
 * one (#2704) — a Sanity document id and a PSD match id are drawn from
 * unrelated id spaces and can coincide; a shared prefix would let one
 * silently collide with the other in a subscriber's calendar app instead of
 * each being updated in place on refresh.
 *
 * Lives in its own module (no `ical-generator`/`@touch4it/ical-timezones`
 * imports) so a `"use client"` component can import it without dragging
 * `ical.ts`'s server-oriented dependency tree into the client bundle —
 * mirrors `event-datetime.ts`'s `resolveEventDateRange`, the other function
 * shared by both `.ics` surfaces.
 */
export const buildEventUid = (id: string): string => {
  return `kcvv-event-${id}@kcvvelewijt.be`;
};
