/**
 * Scheurkalender Page
 * Print-friendly upcoming matches calendar for kiosk / display use
 */

import type { Metadata } from "next";
import { Effect } from "effect";
import { runPromise } from "@/lib/effect/runtime";
import { BffService } from "@/lib/effect/services/BffService";
import type { Match } from "@/lib/effect/schemas/match.schema";
import {
  ScheurkalenderPage,
  type ScheurkalenderDay,
} from "@/components/scheurkalender/ScheurkalenderPage";
import { FooterSafeArea } from "@/components/design-system";

export const metadata: Metadata = {
  title: "Scheurkalender | KCVV Elewijt",
  description:
    "Printbare wedstrijdkalender van KCVV Elewijt met alle aankomende wedstrijden.",
};

async function fetchUpcomingMatches(): Promise<Match[]> {
  const matches = await runPromise(
    Effect.gen(function* () {
      const bff = yield* BffService;
      return yield* bff.getNextMatches();
    }).pipe(
      Effect.catchAll((error) => {
        console.error("[Scheurkalender] Failed to fetch matches:", error);
        return Effect.succeed([]);
      }),
    ),
  );

  return [...matches]
    .filter((m) => m.status === "scheduled")
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatFullDate(date: Date): string {
  return date.toLocaleDateString("nl-BE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function ScheurkalenderPageRoute() {
  const matches = await fetchUpcomingMatches();

  // Group by date and build ScheurkalenderDay array
  const grouped = new Map<string, Match[]>();
  for (const match of matches) {
    const key = toLocalDateKey(match.date);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(match);
  }

  const days: ScheurkalenderDay[] = [...grouped.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, dayMatches]) => ({
      key,
      label: formatFullDate(new Date(key + "T12:00:00")),
      matches: dayMatches.map((m) => ({
        id: m.id,
        time: m.time,
        squadLabel: m.squadLabel,
        homeTeam: { name: m.home_team.name, logo: m.home_team.logo },
        awayTeam: { name: m.away_team.name, logo: m.away_team.logo },
      })),
    }));

  return (
    <>
      <ScheurkalenderPage days={days} />
      <FooterSafeArea />
    </>
  );
}

export const revalidate = 300; // 5 minutes
