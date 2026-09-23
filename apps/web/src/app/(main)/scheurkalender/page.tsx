/**
 * Scheurkalender — private InDesign-poster data source (#2137).
 *
 * Not a public page: `noindex` + unlinked (no nav/footer/sitemap entry,
 * reachable only by typing the URL). Renders the full-season A + B *league*
 * fixture table the club screenshots into the A2 season poster.
 * See `docs/design/mockups/phase-10-scheurkalender/`.
 */

import type { Metadata } from "next";
import { Effect } from "effect";
import { runPromise } from "@/lib/effect/runtime";
import { orDieOrRenderOnDemand } from "@/lib/effect/or-die-or-render-on-demand";
import {
  BffService,
  BFF_FAN_OUT_CONCURRENCY,
} from "@/lib/effect/services/BffService";
import { TeamRepository } from "@/lib/repositories/team.repository";
import { selectSeniorTeams } from "@/components/home/FirstTeamsBlock/first-teams";
import type { Match } from "@/lib/effect/schemas/match.schema";
import { KCVV_CLUB_ID } from "@/lib/constants";
import { clubToday, toMatchDisplayZone } from "@/lib/utils/dates";
import { deriveSeason } from "@/lib/utils/season";
import {
  ScheurkalenderPage,
  type ScheurkalenderMatch,
} from "@/components/scheurkalender/ScheurkalenderPage";

export const metadata: Metadata = {
  title: "Scheurkalender",
  description:
    "Interne wedstrijdkalender (competitie A + B) — bron voor de seizoensposter.",
  // Private tool: keep it out of search indexes (also unlinked everywhere).
  robots: { index: false, follow: false },
};

interface ScheurkalenderData {
  matches: ScheurkalenderMatch[];
  season: string;
}

/** "B" for the squad whose name ends in " B", "A" for the first team. */
function squadLabel(name: string): "A" | "B" {
  return name.trim().endsWith(" B") ? "B" : "A";
}

function toScheurkalenderMatch(
  match: Match,
  label: "A" | "B",
): ScheurkalenderMatch {
  // getMatchesByTeam sets `is_home`; fall back to an exact club-id check on the
  // rare null (home_team.id is the club id; KCVV is 1235).
  const kcvvIsHome = match.is_home ?? match.home_team.id === KCVV_CLUB_ID;
  const opponent = kcvvIsHome ? match.away_team.name : match.home_team.name;
  return {
    id: match.id,
    // `toMatchDisplayZone` reads the calendar day off UTC, which is where the
    // BFF put the local kickoff wall-clock; re-zoning a late kickoff (≥22:00)
    // to Brussels would roll it to the next day (and possibly next weekend).
    date: toMatchDisplayZone(match.date).toISODate() ?? "",
    ...(match.time ? { time: match.time } : {}),
    opponent,
    kcvvLabel: label,
    kcvvIsHome,
  };
}

/**
 * The senior-team list is this sheet's subject — without it there is no way
 * to know which teams to query — so its failure is uncaught by design and
 * takes the render down to the one global boundary, same as before #2864
 * (when it arrived as a defect). Each team's own match fan-out below is a
 * section and stays caught: one team's fixtures failing must not blank the
 * whole sheet.
 */
async function fetchScheurkalenderData(): Promise<ScheurkalenderData> {
  return runPromise(
    Effect.gen(function* () {
      const bff = yield* BffService;
      const teamRepo = yield* TeamRepository;

      // Senior A + B squads; the one whose name ends " B" is the B-team.
      // Uses the shared first-team filter rather than a local `age === "A"`
      // test: Reserven carries the senior age code "A" too, so the local test
      // put its league fixtures on the poster the moment its `showInNavigation`
      // was turned on — labelled "A", since its name ends in neither suffix.
      const seniorTeams = selectSeniorTeams(yield* teamRepo.findAll());

      // Full-season fixtures per team, in parallel. Catch broadly (the
      // CLAUDE.md "broader catch when necessary" exception): this ISR page is
      // prerendered at build, where the BFF can be unreachable — a transport
      // error (not just HttpNotFound) must degrade to an empty sheet rather
      // than fail the build. ISR self-heals once the BFF recovers on the next
      // revalidation. Errors are still logged via tapError above.
      const matchArrays = yield* Effect.all(
        seniorTeams.map((team) =>
          bff.getMatches(Number(team.psdId)).pipe(
            Effect.tapError((error) =>
              Effect.log(
                `[Scheurkalender] Failed to fetch matches for ${team.name} (psdId: ${team.psdId}): ${String(error)}`,
              ),
            ),
            Effect.catchAll(() => Effect.succeed([] as readonly Match[])),
          ),
        ),
        { concurrency: BFF_FAN_OUT_CONCURRENCY },
      );

      // League only, labelled by the queried squad (getMatches doesn't set
      // kcvv_team_label), deduped by match id. Gate on the structured
      // competitionType — `competition` is a division name, not "Competitie".
      const byId = new Map<number, ScheurkalenderMatch>();
      matchArrays.forEach((matches, index) => {
        const label = squadLabel(seniorTeams[index]!.name);
        for (const match of matches) {
          if (match.competitionType !== "league") continue;
          if (byId.has(match.id)) continue;
          byId.set(match.id, toScheurkalenderMatch(match, label));
        }
      });

      // Sort by date, then kickoff time.
      const matches = [...byId.values()].sort(
        (a, b) =>
          a.date.localeCompare(b.date) ||
          (a.time ?? "").localeCompare(b.time ?? ""),
      );

      // The bare label — this masthead has no room for the word "Seizoen"
      // (#2546). `date` is already `YYYY-MM-DD` normalised through
      // `toMatchDisplayZone` above, which is the zone `deriveSeason` reads.
      // `find`, not `matches[0]`: `toScheurkalenderMatch` writes `date: ""`
      // for a BFF date Luxon cannot parse, and `""` sorts first under
      // `localeCompare` — so the anchor could be the one broken fixture.
      // `??` does not catch it either (`""` is not nullish), and
      // `deriveSeason("")` yields `’NaN/’NaN`, which would print in the
      // masthead and the print footer (#2546 review).
      const season = deriveSeason(
        matches.find((match) => match.date)?.date ?? clubToday(),
      ).label;

      return { matches, season };
    }).pipe(orDieOrRenderOnDemand),
  );
}

export default async function ScheurkalenderPageRoute() {
  const { matches, season } = await fetchScheurkalenderData();
  return <ScheurkalenderPage matches={matches} season={season} />;
}

// 15 min ISR — renders live PSD fixtures, so its cache is aligned to the BFF
// freshness window. Never generateStaticParams (PSD rate limits); ISR keeps
// per-request rendering fast without build fan-out.
export const revalidate = 900;
