/**
 * Calendar Page
 * Full-season matches across all KCVV teams + events, with month/week views
 */

import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE } from "@/lib/constants";
import { Effect } from "effect";
import { runPromise } from "@/lib/effect/runtime";
import { BffService } from "@/lib/effect/services/BffService";
import { TeamRepository } from "@/lib/repositories/team.repository";
import {
  EventRepository,
  type EventVM,
} from "@/lib/repositories/event.repository";
import type { Match } from "@/lib/effect/schemas/match.schema";
import { PageHero } from "@/components/design-system";
import { CalendarWidget } from "@/components/calendar/CalendarWidget";
import { transformMatchToCalendar } from "./utils";
import type { CalendarMatch, CalendarEvent, CalendarTeamInfo } from "./utils";

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
    images: [DEFAULT_OG_IMAGE],
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

      // Fetch full-season matches for all teams in parallel.
      // Each fetch is individually wrapped so one team failure
      // doesn't take down the entire calendar.
      const matchArrays = yield* Effect.all(
        teamsWithPsd.map((t) =>
          bff.getMatches(Number(t.psdId)).pipe(
            Effect.tapError((error) =>
              Effect.log(
                `[Calendar] Failed to fetch matches for team ${t.name} (psdId: ${t.psdId}): ${String(error)}`,
              ),
            ),
            Effect.catchAll(() => Effect.succeed([] as readonly Match[])),
          ),
        ),
        { concurrency: 5 },
      );

      // Flatten, enrich with team label, and deduplicate by match ID.
      // The BFF getTeamMatches endpoint doesn't set kcvv_team_label,
      // so we enrich from the Sanity team name here.
      const deduplicatedMatches = matchArrays
        .flatMap((matches, i) => {
          const teamLabel = teamsWithPsd[i]!.name;
          return matches.map((m) => ({
            ...transformMatchToCalendar(m),
            team: m.kcvv_team_label ?? teamLabel,
          }));
        })
        .reduce((map, cal) => {
          if (!map.has(cal.id)) map.set(cal.id, cal);
          return map;
        }, new Map<number, CalendarMatch>());

      // Fetch events (graceful degradation on failure)
      const eventVMs = yield* eventRepo
        .findAll()
        .pipe(Effect.catchAll(() => Effect.succeed([] as EventVM[])));

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
        matches: [...deduplicatedMatches.values()],
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

export default async function CalendarPage() {
  const data = await fetchCalendarData();

  return (
    <div className="min-h-screen bg-gray-100">
      <PageHero
        image="/images/youth-trainers.jpg"
        imageAlt="KCVV jeugdtraining"
        label="Kalender"
        headline="Wedstrijdkalender"
        body="Bekijk alle wedstrijden en activiteiten van KCVV Elewijt."
        size="compact"
      />

      <div className="max-w-5xl mx-auto px-4 py-10">
        <CalendarWidget
          matches={data.matches}
          events={data.events}
          teams={data.teams}
        />
      </div>
    </div>
  );
}

// Skip build-time prerendering — the page depends on BFF + Sanity APIs
// that aren't available during build. Runtime caching is handled by the BFF
// layer (24h KV cache) so per-request rendering is still fast.
export const dynamic = "force-dynamic";
