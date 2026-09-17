/**
 * Shared test-only narrowing helpers for the `kind` discriminant
 * (#2606/#2688/#2802). Every reservation-aware row type (`ScheduleRow`,
 * `UpcomingRow`, `CalendarMatch`, ...) now has three members —
 * `"match"`/`"reservation"`/`"reduced"` — so one generic assertion per
 * member covers all of them instead of a copy per test file.
 */

/** Narrows `row` to the member whose `kind` matches `kind`, throwing
 *  `message` otherwise. The one generic assertion behind every
 *  per-member wrapper below (and usable directly for a member — e.g.
 *  `"reservation"` — that has no named wrapper). */
export function asRowKind<T extends { kind: string }, K extends T["kind"]>(
  row: T | undefined,
  kind: K,
  message = `expected a "${kind}" row`,
): Extract<T, { kind: K }> {
  if (!row || row.kind !== kind) throw new Error(message);
  return row as Extract<T, { kind: K }>;
}

/**
 * Narrows to `kind: "match"` specifically, not to "not a reservation" — a
 * `"reduced"` row is not a reservation either (it's a real tournament
 * fixture, not a self-match) but has no `homeTeam`/`awayTeam`/scores, so a
 * narrower "not a reservation" check would still refuse those fields.
 * Callers that want the full scoreboard shape need `kind === "match"`; the
 * name is kept (rather than renamed to `asMatch`) so every existing call
 * site in the test suite keeps working unchanged.
 */
export function asNonPlaceholder<T extends { kind: string }>(
  row: T | undefined,
  message = "expected a non-placeholder row",
): Extract<T, { kind: "match" }> {
  return asRowKind<T, T["kind"] & "match">(row, "match", message);
}

/** Narrows to `kind: "reduced"` — the tournament-fixture-with-no-result-yet
 *  member (#2696/#2802). See `asNonPlaceholder` above for the sibling. */
export function asReduced<T extends { kind: string }>(
  row: T | undefined,
  message = "expected a reduced row",
): Extract<T, { kind: "reduced" }> {
  return asRowKind<T, T["kind"] & "reduced">(row, "reduced", message);
}
