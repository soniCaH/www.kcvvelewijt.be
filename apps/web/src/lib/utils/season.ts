import { toMatchDisplayZone } from "./dates";

/** A football season spanning roughly Aug→May (e.g. 2025–2026). */
export interface Season {
  /** Stable sort/group key, e.g. `"2025-2026"`. */
  key: string;
  /**
   * Display label, e.g. `"’25/’26"` — typographic apostrophes, slash, and
   * **no leading word**. The surface supplies "Seizoen" when it wants it
   * (`/tegenstander/[clubId]`'s season band does; `<MatchHero>`'s meta line
   * and `/scheurkalender`'s masthead do not), so the helper never has to
   * guess whether its caller has room for it (#2546).
   */
  label: string;
}

/** A group of items sharing one season, preserving the input order. */
export interface SeasonGroup<T> {
  season: Season;
  items: T[];
}

function twoDigit(year: number): string {
  return String(year % 100).padStart(2, "0");
}

/**
 * Derive the football season a date belongs to. **The one derivation** — it
 * used to be three, in three shapes (`Seizoen '25–'26` here, `25/26` on
 * `/scheurkalender`, `’25/’26` in `<MatchHero>`), each re-deriving the same
 * `month >= 7` boundary from a date it already held. #2546 kept `<MatchHero>`'s
 * spelling, the incumbent on the only public in-scope route, and deleted the
 * other two. The Belgian amateur season
 * runs roughly August→May, with cup fixtures already in July, so the boundary
 * is month ≥ 7 (July) → the *new* season: an August Beker match lands in the
 * upcoming season rather than the one that just ended.
 *
 * Every date reaching this helper is a match date, whose Belgian wall-clock
 * sits in its UTC fields — so the month is read through `toMatchDisplayZone`,
 * never `toDisplayZone`. Unpinned, a 30 June evening kickoff read in a browser
 * east of UTC crossed into July and moved a whole season boundary.
 * `/scheurkalender` passes a `YYYY-MM-DD` string that the route has already
 * normalised through the same helper, so it reads identically.
 */
export function deriveSeason(date: Date | string): Season {
  const { year, month } = toMatchDisplayZone(date);
  const startYear = month >= 7 ? year : year - 1;
  const endYear = startYear + 1;
  return {
    key: `${startYear}-${endYear}`,
    label: `’${twoDigit(startYear)}/’${twoDigit(endYear)}`,
  };
}

/**
 * Group items by season, preserving the input order both across groups and
 * within each group. Callers pass an already-sorted list (the opponent-history
 * page sorts date-descending) so the first group is the most recent season.
 */
export function groupBySeason<T>(
  items: readonly T[],
  getDate: (item: T) => Date,
): SeasonGroup<T>[] {
  const groups: SeasonGroup<T>[] = [];
  const byKey = new Map<string, SeasonGroup<T>>();
  for (const item of items) {
    const season = deriveSeason(getDate(item));
    const existing = byKey.get(season.key);
    if (existing) {
      existing.items.push(item);
    } else {
      const group: SeasonGroup<T> = { season, items: [item] };
      byKey.set(season.key, group);
      groups.push(group);
    }
  }
  return groups;
}
