/**
 * Calendar Page
 * Full-season matches across all KCVV teams + events, with month/week/list views
 */

import type { Metadata } from "next";
import { Suspense } from "react";
import { Effect } from "effect";
import { runPromise } from "@/lib/effect/runtime";
import { BffService } from "@/lib/effect/services/BffService";
import { TeamRepository } from "@/lib/repositories/team.repository";
import { EventRepository } from "@/lib/repositories/event.repository";
import { CalendarWidget } from "@/components/calendar/CalendarWidget";
import { transformMatchToCalendar } from "./utils";
import type { CalendarMatch, CalendarEvent, CalendarTeamInfo } from "./utils";
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

interface CalendarData {
  matches: CalendarMatch[];
  events: CalendarEvent[];
  teams: CalendarTeamInfo[];
}

async function fetchCalendarData(): Promise<CalendarData> {
  return runPromise(
    Effect.gen(function* () {
      const bff = yield* BffService;
      const teamRepo = yield* TeamRepository;
      const eventRepo = yield* EventRepository;

      // Fetch teams first to know which PSD IDs to query
      const allTeams = yield* teamRepo.findAll();
      const teamsWithPsd = allTeams.filter((t) => t.psdId !== null);

      // Fetch full-season matches for all teams in parallel
      const matchArrays = yield* Effect.all(
        teamsWithPsd.map((t) => bff.getMatches(Number(t.psdId))),
        { concurrency: 5 },
      );

      // Flatten and deduplicate by match ID
      const matchMap = new Map<number, CalendarMatch>();
      for (const arr of matchArrays) {
        for (const m of arr) {
          if (!matchMap.has(m.id)) {
            matchMap.set(m.id, transformMatchToCalendar(m));
          }
        }
      }

      // Fetch events
      const eventVMs = yield* eventRepo.findAll();

      // Build team info list from teams that actually have matches
      const teamLabelsFromMatches = new Set<string>();
      for (const m of matchMap.values()) {
        if (m.team) teamLabelsFromMatches.add(m.team);
      }

      const teamInfos: CalendarTeamInfo[] = teamsWithPsd.map((t) => ({
        id: t.id,
        name: t.name,
        psdId: Number(t.psdId),
        label: t.name,
      }));

      const events: CalendarEvent[] = eventVMs.map((e) => ({
        id: e.id,
        title: e.title,
        dateStart: e.dateStart,
        dateEnd: e.dateEnd,
        href: e.href,
      }));

      return {
        matches: [...matchMap.values()],
        events,
        teams: teamInfos,
      };
    }).pipe(
      Effect.catchAll((error) => {
        console.error("[Calendar] Failed to fetch calendar data:", error);
        return Effect.succeed({
          matches: [],
          events: [],
          teams: [],
        } as CalendarData);
      }),
    ),
  );
}

interface CalendarPageProps {
  searchParams: Promise<{ team?: string; view?: string }>;
}

export default async function CalendarPage({
  searchParams,
}: CalendarPageProps) {
  const [data, params] = await Promise.all([fetchCalendarData(), searchParams]);
  const activeTeamFilter = params.team ?? "all";

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-white">
      {/* Hero */}
      <div className="bg-linear-to-br from-green-main via-green-hover to-green-dark-hover text-white py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 font-title">
            Wedstrijdkalender
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl">
            Alle wedstrijden en evenementen van KCVV Elewijt
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
          <CalendarWidget
            matches={data.matches}
            events={data.events}
            teams={data.teams}
            activeTeamFilter={activeTeamFilter}
          />
        </Suspense>
      </div>
    </div>
  );
}

export const revalidate = 21600; // 6 hours
