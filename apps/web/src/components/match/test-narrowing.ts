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
export function asRowKind<T extends { kind: string }, K extends T["kind"]>(
  row: T | undefined,
  kind: K,
  message = `expected a "${kind}" row`,
): Extract<T, { kind: K }> {
  if (!row || row.kind !== kind) throw new Error(message);
  return row as Extract<T, { kind: K }>;
}

/** See the doc comment above `asRowKind` for why this narrows to
 *  `kind: "match"` and is not named `asMatch`. */
export function asNonPlaceholder<T extends { kind: string }>(
  row: T | undefined,
  message = "expected a non-placeholder row",
): Extract<T, { kind: "match" }> {
  return asRowKind(row, "match" as T["kind"] & "match", message) as Extract<
    T,
    { kind: "match" }
  >;
}

/** Narrows to `kind: "reduced"` — the tournament-fixture-with-no-result-yet
 *  member (#2696/#2802). See `asNonPlaceholder` above for the sibling. */
export function asReduced<T extends { kind: string }>(
  row: T | undefined,
  message = "expected a reduced row",
): Extract<T, { kind: "reduced" }> {
  return asRowKind(row, "reduced" as T["kind"] & "reduced", message) as Extract<
    T,
    { kind: "reduced" }
  >;
}
