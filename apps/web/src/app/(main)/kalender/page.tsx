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
  type EventListItemVM,
} from "@/lib/repositories/event.repository";
import type { Match } from "@/lib/effect/schemas/match.schema";
import { InteriorPageHero } from "@/components/layout";
import { CalendarWidget } from "@/components/calendar/CalendarWidget";
import { transformMatchToCalendar, buildCalendarFeed } from "./utils";
import type {
  CalendarMatch,
  CalendarFeedItem,
  CalendarTeamInfo,
} from "./utils";

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
  feed: CalendarFeedItem[];
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

      // Fetch the merged event feed — `event` docs + `articleType:event`
      // articles (Phase 6.E, #1968) — so event-articles surface on the
      // calendar alongside matches. Graceful degradation on failure: a Sanity
      // error yields an empty feed, not a crash.
      const feedItems = yield* eventRepo
        .findUpcomingForList()
        .pipe(Effect.catchAll(() => Effect.succeed([] as EventListItemVM[])));

      const teamInfos: CalendarTeamInfo[] = teamsWithPsd.map((t) => ({
        id: t.id,
        name: t.name,
        psdId: Number(t.psdId),
        label: t.name,
      }));

      // Compose matches + the event feed into one chronological, discriminated
      // `CalendarFeedItem[]` (each tagged with its `kalenderType`). The widget
      // filters this by type and projects it back to the renderers. The repo
      // already resolved each event's detail href (`/evenementen/[slug]` for
      // event docs, `/nieuws/[slug]` for articles).
      const feed = buildCalendarFeed(
        [...deduplicatedMatches.values()],
        feedItems,
      );

      return {
        feed,
        teams: teamInfos,
      };
    }).pipe(
      Effect.catchAll((error) => {
        console.error("[Calendar] Failed to fetch calendar data:", error);
        return Effect.succeed({
          feed: [],
          teams: [],
        } as CalendarData);
      }),
    ),
  );
}

export default async function CalendarPage() {
  const data = await fetchCalendarData();

  return (
    // `pb-[var(--footer-diagonal)]` on the root wrapper (instead of a
    // trailing <FooterSafeArea />) lets `bg-cream` extend through the
    // footer-diagonal overlap zone — the overlap's transparent upper
    // triangle then reveals the page's own cream surface rather than
    // white body. See #1360. (Phase 6.D: cream paper field hosts the
    // reskinned paper/ink calendar panel.)
    <div className="bg-cream min-h-screen pb-[var(--footer-diagonal)]">
      <InteriorPageHero
        image="/images/youth-trainers.jpg"
        imageAlt="KCVV jeugdtraining"
        label="Kalender"
        headline="Wedstrijdkalender"
        body="Bekijk alle wedstrijden en activiteiten van KCVV Elewijt."
        size="compact"
      />

      <div className="mx-auto max-w-5xl px-4 py-10">
        <CalendarWidget feed={data.feed} teams={data.teams} />
      </div>
    </div>
  );
}

// Skip build-time prerendering — the page depends on BFF + Sanity APIs
// that aren't available during build. Runtime caching is handled by the BFF
// layer (24h KV cache) so per-request rendering is still fast.
export const dynamic = "force-dynamic";
