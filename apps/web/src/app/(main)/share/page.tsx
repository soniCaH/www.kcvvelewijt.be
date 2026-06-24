import type { Metadata } from "next";

// Always server-render: match data changes throughout the day
export const dynamic = "force-dynamic";
import { Effect } from "effect";
import { runPromise } from "@/lib/effect/runtime";
import { BffService } from "@/lib/effect/services/BffService";
import { PlayerRepository } from "@/lib/repositories/player.repository";
import type { Match } from "@/lib/effect/schemas/match.schema";
import { SharePage } from "@/components/share/SharePage/SharePage";
import type {
  MatchOption,
  PlayerForShare,
} from "@/components/share/SharePage/SharePage";

export const metadata: Metadata = {
  title: "Story Generator",
  robots: { index: false, follow: false },
};

function formatDateTime(match: Match): string | undefined {
  const weekday = new Date(match.date).toLocaleDateString("nl-BE", {
    weekday: "long",
    timeZone: "Europe/Brussels",
  });
  const capitalised = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  return match.time ? `${capitalised} · ${match.time}` : capitalised;
}

function toMatchOption(match: Match): MatchOption {
  const home = match.home_team.name;
  const away = match.away_team.name;
  const teamLabel = match.kcvv_team_label ? ` (${match.kcvv_team_label})` : "";
  return {
    id: match.id,
    label: `${home} - ${away}${teamLabel}`,
    matchName: `${home} — ${away}`,
    competition: match.competition,
    dateTime: formatDateTime(match),
    homeLogo: match.home_team.logo,
    awayLogo: match.away_team.logo,
  };
}

async function fetchSharePageData(): Promise<{
  matches: MatchOption[];
  players: PlayerForShare[];
}> {
  return runPromise(
    Effect.gen(function* () {
      const bff = yield* BffService;
      const playerRepo = yield* PlayerRepository;

      const [windowMatches, allPlayers] = yield* Effect.all(
        [
          // Matchday-aware window: includes matches that already kicked off /
          // finished today (for goal/HT/FT/card posts) plus the next 7 days
          // (for pre-game posts). Replaces the old getNextMatches + today-only
          // filter, which dropped a match the moment it started (#2160).
          bff
            .getMatchesWindow()
            .pipe(Effect.catchTag("HttpNotFound", () => Effect.succeed([]))),
          playerRepo.findAll(),
        ],
        { concurrency: 2 },
      );

      const matches = windowMatches.map(toMatchOption);

      const players: PlayerForShare[] = allPlayers.map((p) => ({
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        number: p.number,
        celebrationImageUrl: p.celebrationImageUrl,
        psdImageUrl: p.imageUrl,
      }));

      return { matches, players };
    }),
  );
}

export default async function ShareRoute() {
  const { matches, players } = await fetchSharePageData();
  return (
    <>
      <SharePage matches={matches} players={players} />
    </>
  );
}
