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
import { DateTime } from "luxon";
import { runPromise } from "@/lib/effect/runtime";
import { BffService } from "@/lib/effect/services/BffService";
import { TeamRepository } from "@/lib/repositories/team.repository";
import type { Match } from "@/lib/effect/schemas/match.schema";
import { KCVV_CLUB_ID } from "@/lib/constants";
import {
  ScheurkalenderPage,
  type ScheurkalenderMatch,
} from "@/components/scheurkalender/ScheurkalenderPage";

export const metadata: Metadata = {
  title: "Scheurkalender | KCVV Elewijt",
  description:
    "Interne wedstrijdkalender (competitie A + B) — bron voor de seizoensposter.",
  // Private tool: keep it out of search indexes (also unlinked everywhere).
  robots: { index: false, follow: false },
};

const TZ = "Europe/Brussels";

interface ScheurkalenderData {
  matches: ScheurkalenderMatch[];
  season: string;
}

/** "B" for the squad whose name ends in " B", "A" for the first team. */
function squadLabel(name: string): "A" | "B" {
  return name.trim().endsWith(" B") ? "B" : "A";
}

/** Belgian season label (e.g. "25/26") for the calendar day in `isoDate`. */
function seasonLabel(isoDate: string): string {
  const dt = DateTime.fromISO(isoDate, { zone: TZ });
  const startYear = dt.month >= 7 ? dt.year : dt.year - 1;
  const twoDigit = (year: number) => String(year % 100).padStart(2, "0");
  return `${twoDigit(startYear)}/${twoDigit(startYear + 1)}`;
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
    // The BFF encodes the local kickoff wall-clock into the Date's UTC fields,
    // so read the calendar day off UTC — re-zoning a late kickoff (≥22:00)
    // to Brussels would roll it to the next day (and possibly next weekend).
    date: DateTime.fromJSDate(match.date, { zone: "utc" }).toISODate() ?? "",
    ...(match.time ? { time: match.time } : {}),
    opponent,
    kcvvLabel: label,
    kcvvIsHome,
  };
}

async function fetchScheurkalenderData(): Promise<ScheurkalenderData> {
  return runPromise(
    Effect.gen(function* () {
      const bff = yield* BffService;
      const teamRepo = yield* TeamRepository;

      // Senior A + B squads (age "A"); the one whose name ends " B" is the B-team.
      const seniorTeams = (yield* teamRepo.findAll()).filter(
        (team) => team.age === "A" && team.psdId !== null,
      );

      // Full-season fixtures per team, in parallel. One team failing degrades
      // to an empty list rather than taking down the whole table.
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
        { concurrency: 5 },
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

      const season = seasonLabel(
        matches[0]?.date ?? DateTime.now().setZone(TZ).toISODate()!,
      );

      return { matches, season };
    }).pipe(
      Effect.catchAll((error) => {
        console.error("[Scheurkalender] Failed to build fixture table:", error);
        return Effect.succeed({
          matches: [],
          season: seasonLabel(DateTime.now().setZone(TZ).toISODate()!),
        } satisfies ScheurkalenderData);
      }),
    ),
  );
}

export default async function ScheurkalenderPageRoute() {
  const { matches, season } = await fetchScheurkalenderData();
  return <ScheurkalenderPage matches={matches} season={season} />;
}

// Season fixtures change rarely — cache long (6h ISR). Never generateStaticParams
// (PSD rate limits); ISR keeps per-request rendering fast without build fan-out.
export const revalidate = 21600;
