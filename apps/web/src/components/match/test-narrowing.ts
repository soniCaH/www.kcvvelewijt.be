/**
 * Shared test-only narrowing helpers for the `kind` discriminant
 * (#2606/#2688/#2802). Every reservation-aware row type (`ScheduleRow`,
 * `UpcomingRow`, `CalendarMatch`, ...) now has three members —
 * `"match"`/`"reservation"`/`"reduced"` — so one generic assertion per
 * member covers all of them instead of a copy per test file.
 *
 * `asNonPlaceholder` narrows to `kind: "match"` specifically, not to
 * "not a reservation" — a `"reduced"` row is not a reservation either (it's
 * a real tournament fixture, not a self-match) but has no
 * `homeTeam`/`awayTeam`/scores, so a narrower "not a reservation" check
 * would still refuse those fields. Callers that want the full scoreboard
 * shape need `kind === "match"`; the name is kept (rather than renamed to
 * `asMatch`) so every existing call site in the test suite keeps working
 * unchanged.
 */
export function asNonPlaceholder<T extends { kind: string }>(
  row: T | undefined,
  message = "expected a non-placeholder row",
): Extract<T, { kind: "match" }> {
  if (!row || row.kind !== "match") throw new Error(message);
  return row as Extract<T, { kind: "match" }>;
}

/** Narrows to `kind: "reduced"` — the tournament-fixture-with-no-result-yet
 *  member (#2696/#2802). See `asNonPlaceholder` above for the sibling. */
export function asReduced<T extends { kind: string }>(
  row: T | undefined,
  message = "expected a reduced row",
): Extract<T, { kind: "reduced" }> {
  if (!row || row.kind !== "reduced") throw new Error(message);
  return row as Extract<T, { kind: "reduced" }>;
}
