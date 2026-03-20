/**
 * Calendar Page
 * Upcoming matches across all KCVV teams, grouped by date with team filter
 */

import type { Metadata } from "next";
import { Suspense } from "react";
import { Effect } from "effect";
import { runPromise } from "@/lib/effect/runtime";
import { BffService } from "@/lib/effect/services/BffService";
import { CalendarView } from "./CalendarView";
import type { CalendarMatch } from "./CalendarView";
import { Spinner } from "@/components/design-system";

export const metadata: Metadata = {
  title: "Wedstrijdkalender | KCVV Elewijt",
  description:
    "Bekijk alle aankomende wedstrijden van KCVV Elewijt — A-ploeg, B-ploeg en jeugdteams op één overzicht.",
  keywords: [
    "wedstrijden",
    "kalender",
    "schema",
    "A-ploeg",
    "B-ploeg",
    "jeugd",
    "KCVV Elewijt",
  ],
  openGraph: {
    title: "Wedstrijdkalender - KCVV Elewijt",
    description: "Alle aankomende wedstrijden van KCVV Elewijt",
    type: "website",
  },
};

async function fetchMatches(): Promise<CalendarMatch[]> {
  const matches = await runPromise(
    Effect.gen(function* () {
      const bff = yield* BffService;
      return yield* bff.getNextMatches();
    }).pipe(
      Effect.catchAll((error) => {
        console.error("[Calendar] Failed to fetch matches:", error);
        return Effect.succeed([]);
      }),
    ),
  );

  return matches.map((m) => ({
    id: m.id,
    date: m.date.toISOString(),
    time: m.time,
    homeTeam: {
      id: m.home_team.id,
      name: m.home_team.name,
      logo: m.home_team.logo,
    },
    awayTeam: {
      id: m.away_team.id,
      name: m.away_team.name,
      logo: m.away_team.logo,
    },
    homeScore: m.home_team.score,
    awayScore: m.away_team.score,
    status: m.status,
    competition: m.competition,
    team: m.kcvv_team_label,
  }));
}

export default async function CalendarPage() {
  const matches = await fetchMatches();

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-white">
      {/* Hero */}
      <div className="bg-linear-to-br from-green-main via-green-hover to-green-dark-hover text-white py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 font-title">
            Wedstrijdkalender
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl">
            Alle aankomende wedstrijden van KCVV Elewijt
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <Suspense
          fallback={
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          }
        >
          <CalendarView matches={matches} />
        </Suspense>
      </div>
    </div>
  );
}

export const revalidate = 300; // 5 minutes
