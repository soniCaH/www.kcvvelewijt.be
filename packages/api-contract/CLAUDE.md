# api-contract Package

Shared Effect Schema types and HttpApi definition consumed by both `apps/web` and `apps/api` (Cloudflare Worker BFF).

## Structure

```text
src/
├── schemas/
│   ├── common.ts     ← DateFromStringOrDate
│   ├── match.ts      ← Match, MatchDetail, MatchTeam, MatchStatus, MatchLineup, MatchLineupPlayer, CardType
│   ├── ranking.ts    ← RankingEntry, RankingArray, RankingResponse
│   ├── player-stats.ts ← PlayerSeasonStats, PlayerTeamStats
│   └── index.ts      ← barrel
├── api/
│   ├── matches.ts    ← MatchesApi HttpApiGroup
│   ├── ranking.ts    ← RankingApi HttpApiGroup
│   ├── opponent.ts   ← OpponentApi HttpApiGroup
│   ├── related.ts    ← RelatedApi HttpApiGroup
│   ├── search.ts     ← SearchApi HttpApiGroup
│   └── index.ts      ← PsdApi root export
└── index.ts          ← re-exports everything
```

## Rules

- All schemas use Effect Schema (`import { Schema as S } from "effect"`)
- No `S.Unknown` — every field must be typed
- Schemas here are the single source of truth — never duplicate in `apps/web/src/lib/effect/schemas/`
- HttpApi groups live in `src/api/`, schemas in `src/schemas/`
- Export everything from `src/index.ts`
- No `.js` extensions in imports — `moduleResolution: "bundler"` is used (compatible with Next.js/Turbopack and Wrangler/esbuild)
- After adding/changing schemas, run `pnpm --filter @kcvv/api-contract build` so apps/web picks up updated `.d.ts` files
