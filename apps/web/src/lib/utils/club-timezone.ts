/**
 * KCVV is in Belgium, and every date the site renders is Belgian wall-clock.
 *
 * The constant is **club**-scoped on purpose: it governs articles, galleries,
 * search and match metadata, not only events. Its previous event-scoped name
 * (`EVENT_TIMEZONE`, in `./event-datetime`) is precisely why every non-event
 * formatter kept assuming it did not apply to them and reached for the runtime
 * zone instead (#2430). Storage stays UTC; this is presentation only.
 *
 * Lives in its own import-free file so a client component can read the zone
 * without pulling Luxon in through `./dates` (#3480). `./dates` re-exports it;
 * nothing else may spell the literal (cross-page-consistency rule 2).
 */
export const CLUB_TIMEZONE = "Europe/Brussels";
