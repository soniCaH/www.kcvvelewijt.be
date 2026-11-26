/**
 * Off-season notice decision rule (#2505) — resolves the Studio-authored
 * `matchesSliderPlaceholder` fields (plus the caller's own match-read
 * outcome) into the single state `<FirstTeamsBlock>` renders on its no-rows
 * path.
 *
 * Ported from `git show 8103b710:apps/web/src/components/home/
 * MatchesSliderEmptyState/decisionRule.ts` — the three branches
 * (future / today / past kickoff) and `clubCalendarDaysBetween` survive in
 * spirit. `ResolvedContent`'s four modes and their `eyebrow` values do not
 * come back (#2844): the 201-line `<MatchesSliderEmptyState>` markup stays
 * deleted.
 *
 * **`unavailable` is a state here, not a side-channel (#2505 round-3 review
 * finding M4).** It used to be checked by the caller *before* this function
 * ran, with the "outage wins and suppresses the image" invariant restated in
 * prose at every call site instead of stated once. Folding it into the union
 * makes the winning rule structural: `resolvePlaceholderState` returns
 * `{ kind: "unavailable" }` and nothing else when `unavailable` is true, so
 * there is no path through this function that both claims an outage and
 * still carries an image or a mededeling.
 *
 * Kept free of React so it can be unit-tested in isolation, matching
 * `first-teams.ts`'s own convention.
 */
import { toDisplayZone } from "@/lib/utils/dates";
import type { MatchesSliderPlaceholderVM } from "@/lib/repositories/homepage.repository";

// Calendar-days diff anchored to the club's local zone (`toDisplayZone` —
// the site's single date parse, `lib/utils/dates.ts`) so a 23:30 UTC "now"
// (00:30 Brussels) reads the same calendar date as 01:30 UTC the next day.
// This is the opposite rule to a PSD kickoff (already wall-clock in UTC's
// clothing, see `toMatchDisplayZone`) — `nextSeasonKickoff` reaches this
// function as `new Date(sanityDateString)`, a real instant, which is
// `toDisplayZone`'s documented case. Do not "fix" this to use the other one.
export const clubCalendarDaysBetween = (from: Date, to: Date): number => {
  const fromDay = toDisplayZone(from).startOf("day");
  const toDay = toDisplayZone(to).startOf("day");
  return Math.round(toDay.diff(fromDay, "days").days);
};

/** One authored value, one shape — text plus its optional link. Replaces
 *  two differently-named carriers (`countdown.mededeling` vs
 *  `mededeling.text`) that forced a nested conditional spread to build
 *  (#2505 round-3 review finding S7). */
export interface Mededeling {
  text: string;
  href?: string;
}

/** The authored highlight image, narrowed to what the notice renders —
 *  `width`/`height` never reach here, `<Image fill>` doesn't read them. */
export interface PlaceholderImage {
  url: string;
  alt: string;
  lqip?: string;
}

export type PlaceholderState =
  | { kind: "unavailable" }
  | {
      kind: "countdown";
      daysUntil: number;
      mededeling?: Mededeling;
      image?: PlaceholderImage;
    }
  | { kind: "today"; image?: PlaceholderImage }
  | { kind: "mededeling"; mededeling: Mededeling; image?: PlaceholderImage }
  | { kind: "empty"; image?: PlaceholderImage };

const toMededeling = (
  text: string | undefined,
  href: string | undefined,
): Mededeling | undefined => {
  return text ? { text, ...(href ? { href } : {}) } : undefined;
};

const toPlaceholderImage = (
  image: MatchesSliderPlaceholderVM["highlightImage"],
): PlaceholderImage | undefined => {
  return image
    ? {
        url: image.url,
        alt: image.alt,
        ...(image.lqip ? { lqip: image.lqip } : {}),
      }
    : undefined;
};

/**
 * `unavailable` is checked first and unconditionally short-circuits: a match
 * read failing outranks every authored field, and the returned state carries
 * neither a mededeling nor an image, so a caller can't accidentally render
 * either by forgetting to check `kind` first (#2505/#2844).
 */
export const resolvePlaceholderState = (
  placeholder: MatchesSliderPlaceholderVM | null | undefined,
  now: Date,
  unavailable: boolean,
): PlaceholderState => {
  if (unavailable) return { kind: "unavailable" };

  const mededeling = toMededeling(
    placeholder?.announcementText,
    placeholder?.announcementHref,
  );
  const image = toPlaceholderImage(placeholder?.highlightImage);
  const kickoff = placeholder?.nextSeasonKickoff;

  if (kickoff) {
    const daysUntil = clubCalendarDaysBetween(now, kickoff);
    if (daysUntil === 0) {
      return { kind: "today", ...(image ? { image } : {}) };
    }
    if (daysUntil > 0) {
      return {
        kind: "countdown",
        daysUntil,
        ...(mededeling ? { mededeling } : {}),
        ...(image ? { image } : {}),
      };
    }
    // Past kickoff → fall through to the mededeling or empty state.
  }

  if (mededeling) {
    return { kind: "mededeling", mededeling, ...(image ? { image } : {}) };
  }

  return { kind: "empty", ...(image ? { image } : {}) };
};

/** "1 dag" / "23 dagen" — the only pluralisation this sentence needs. */
export const formatDaysUntil = (daysUntil: number): string => {
  return `${daysUntil} ${daysUntil === 1 ? "dag" : "dagen"}`;
};
