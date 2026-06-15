import { DateTime } from "luxon";

/** A football season spanning roughly Aug→May (e.g. 2025–2026). */
export interface Season {
  /** Stable sort/group key, e.g. `"2025-2026"`. */
  key: string;
  /** Display label, e.g. `"Seizoen '25–'26"`. */
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
 * Derive the football season a date belongs to. The Belgian amateur season
 * runs roughly August→May, with cup fixtures already in July, so the boundary
 * is month ≥ 7 (July) → the *new* season: an August Beker match lands in the
 * upcoming season rather than the one that just ended.
 */
export function deriveSeason(date: Date): Season {
  const { year, month } = DateTime.fromJSDate(date);
  const startYear = month >= 7 ? year : year - 1;
  const endYear = startYear + 1;
  return {
    key: `${startYear}-${endYear}`,
    label: `Seizoen '${twoDigit(startYear)}–'${twoDigit(endYear)}`,
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
