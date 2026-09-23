import { getFirstTeamStripData } from "@/lib/server/match-data";
import { clubToday, isMatchDay } from "@/lib/utils/dates";
import { MatchStripView } from "./MatchStripView";

/**
 * Server component. Fetches the first team's last result and next fixture via
 * the cached `getFirstTeamStripData()` helper. Returns `null` when neither is
 * available, producing zero DOM (the strip slot reserves no space).
 *
 * Where this mounts is `<MatchStripSlot>`'s call — see its own docblock
 * (not repeated here, so the two can't drift the way they did in #3023):
 * the `(landing)` route group mounts it once via `layout.tsx`, and three
 * bespoke detail routes mount it from their own segment layouts. The original phase-3.C spec,
 * `docs/design/mockups/phase-3-c-header-and-matchstrip/matchstrip-locked.md`,
 * predates that detail-route usage and is a point-in-time locked decision record,
 * not living documentation — read it for the strip's original design intent,
 * not for where it renders today.
 *
 * Also computes `matchDay` (#2616) — whether the next fixture falls on
 * today's calendar day — and passes it down as a plain boolean prop rather
 * than letting `<MatchStripView>` (a client component) recompute it. That
 * matters here specifically: `clubToday()` reads the wall clock, and this
 * component renders once per ISR revalidation (`revalidate = 900` on the
 * landing route) while `<MatchStripView>` renders again on hydration in the
 * visitor's own browser, at whatever moment they load the page — recomputing
 * there risks the exact same server/client date disagreement `dates.ts`
 * documents for `toDisplayZone` (an unpinned parse rendering one calendar day
 * on the UTC server and the next after hydration). Baking the boolean into
 * the server-rendered props sidesteps it entirely.
 *
 * Gated on a real `ScheduleMatch` (`kind: "match"`), never a
 * pitch-reservation placeholder or a reduced tournament fixture with no
 * result yet (#2606/#2802): "Match" is a defined term
 * (`docs/ubiquitous-language.md`) with a confirmed opponent and kickoff,
 * which is exactly what neither reduced state has yet. Reading either match
 * day and relabelling it "Vandaag" would assert a certainty PSD hasn't given
 * the club yet — excluding only the reservation case would still pass a
 * reduced tournament fixture through, since it isn't a reservation either.
 */
export async function MatchStrip() {
  const data = await getFirstTeamStripData();
  if (!data) return null;
  const { fixture } = data;
  const matchDay =
    fixture !== null && fixture.kind === "match"
      ? isMatchDay(fixture.date, clubToday())
      : false;
  return <MatchStripView data={data} matchDay={matchDay} />;
}
