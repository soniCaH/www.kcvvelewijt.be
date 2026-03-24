import { NextRequest, NextResponse } from "next/server";
import { Effect } from "effect";
import { unstable_cache } from "next/cache";
import { runPromise } from "@/lib/effect/runtime";
import { BffService } from "@/lib/effect/services/BffService";
import { TeamRepository } from "@/lib/repositories/team.repository";
import type { Match } from "@kcvv/api-contract";
import { generateIcal, normalizeCacheKey } from "@/lib/utils/ical";

export const runtime = "nodejs";

const CACHE_MAX_AGE = 43200; // 12 hours
const MAX_TEAM_IDS = 20;
const FETCH_CONCURRENCY = 5;

type Side = "home" | "away" | "all";

function parseSide(raw: string | null): Side {
  if (raw === "home" || raw === "away") return raw;
  return "all";
}

async function fetchMatches(
  teamIdParams: number[] | null,
): Promise<readonly Match[]> {
  const program = Effect.gen(function* () {
    let teamIds: number[];

    if (teamIdParams && teamIdParams.length > 0) {
      teamIds = teamIdParams;
    } else {
      const repo = yield* TeamRepository;
      const teams = yield* repo.findAll();
      teamIds = teams.map((t) => Number(t.psdId)).filter((id) => !isNaN(id));
    }

    const bff = yield* BffService;
    const results = yield* Effect.all(
      teamIds.map((id) => bff.getMatches(id)),
      { concurrency: FETCH_CONCURRENCY },
    );

    return results.flat();
  });

  return runPromise(program);
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const rawTeamIds = searchParams.get("teamIds");
  const side = parseSide(searchParams.get("side"));
  const cacheKey = normalizeCacheKey(rawTeamIds, side);

  const teamIdNums = rawTeamIds
    ? rawTeamIds
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => !isNaN(n) && n > 0)
        .slice(0, MAX_TEAM_IDS)
    : null;

  try {
    const generateCached = unstable_cache(
      async () => {
        const matches = await fetchMatches(teamIdNums);
        return generateIcal(matches, { side });
      },
      [cacheKey],
      { revalidate: CACHE_MAX_AGE },
    );

    const icalOutput = await generateCached();

    return new NextResponse(icalOutput, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'attachment; filename="kcvv-wedstrijden.ics"',
        "Cache-Control": `max-age=${CACHE_MAX_AGE}, s-maxage=${CACHE_MAX_AGE}`,
      },
    });
  } catch (error) {
    console.error("[Calendar API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
