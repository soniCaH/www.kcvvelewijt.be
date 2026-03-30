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
  title: "Story Generator | KCVV Elewijt",
  robots: { index: false, follow: false },
};

function toMatchOption(match: Match): MatchOption {
  const home = match.home_team.name;
  const away = match.away_team.name;
  const teamLabel = match.kcvv_team_label ? ` (${match.kcvv_team_label})` : "";
  return {
    id: match.id,
    label: `${home} - ${away}${teamLabel}`,
    matchName: `${home} — ${away}`,
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

      const [nextMatches, allPlayers] = yield* Effect.all(
        [
          bff.getNextMatches().pipe(Effect.catchAll(() => Effect.succeed([]))),
          playerRepo.findAll().pipe(Effect.catchAll(() => Effect.succeed([]))),
        ],
        { concurrency: 2 },
      );

      const matches = [...nextMatches].map(toMatchOption);

      const players: PlayerForShare[] = allPlayers.map((p) => ({
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        number: p.number,
        celebrationImageUrl: p.celebrationImageUrl,
      }));

      return { matches, players };
    }),
  );
}

export default async function ShareRoute() {
  const { matches, players } = await fetchSharePageData();
  return <SharePage matches={matches} players={players} />;
}
