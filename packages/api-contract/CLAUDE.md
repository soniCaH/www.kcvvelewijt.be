# api-contract Package

Shared Effect Schema types and HttpApi definition consumed by both `apps/web` and `apps/api` (Cloudflare Worker BFF).

## Structure

```text
src/
├── schemas/
│   ├── common.ts       ← DateFromStringOrDate
│   ├── http-errors.ts  ← HttpServiceUnavailable, HttpBadGateway, HttpNotFound, HttpBadRequest
│   ├── match.ts        ← Match, MatchDetail, MatchTeam, MatchStatus, MatchLineup, MatchLineupPlayer, MatchEvent, CardType
│   ├── opponent.ts     ← OpponentHistory, OpponentInfo, OpponentSummary
│   ├── ranking.ts      ← RankingEntry, RankingArray, RankingTable, RankingTableArray
│   ├── related.ts      ← RelatedItem
│   ├── player-stats.ts ← PlayerSeasonStats, PlayerTeamStats
│   ├── search.ts       ← SearchRequest, SearchResponse, FeedbackRequest, FeedbackResponse
│   ├── forms.ts        ← MembershipRequest, MembershipResponse
│   └── index.ts        ← barrel
├── api/
│   ├── matches.ts      ← MatchesApi HttpApiGroup
│   ├── ranking.ts      ← RankingApi HttpApiGroup
│   ├── opponent.ts     ← OpponentApi HttpApiGroup
│   ├── related.ts      ← RelatedApi HttpApiGroup
│   ├── search.ts       ← SearchApi HttpApiGroup
│   ├── forms.ts        ← FormsApi HttpApiGroup
│   └── index.ts        ← PsdApi root export
├── wire.test.ts        ← the BFF seam: every schema round-trips encode → JSON → decode
└── index.ts            ← re-exports everything
```

## Rules

- All schemas use Effect Schema (`import { Schema as S } from "effect"`)
- No `S.Unknown` — every field must be typed
- **Numbers are `S.Finite`, never `S.Number`.** JSON has no `NaN` or `Infinity`: both arrive as `null`, and then the decode on the other side fails. Path and query ids are `S.NumberFromString.pipe(S.int())`, so `/match/NaN/detail` gets a 400 and never reaches PSD. `src/wire.test.ts` guards both rules. It round-trips every schema `encode → JSON → decode` with generated values. It also walks every schema's AST and fails on any bare `number`. The walk is deterministic. The generated values hit `NaN` only by chance. The test reads the endpoints off `PsdApi` and the exports off `src/index.ts`, so a new schema is covered with no edit to the test. Red there means the wire is wrong: fix the schema, not the test.
- Schemas here are the single source of truth — never duplicate in `apps/web/src/lib/effect/schemas/`
- HttpApi groups live in `src/api/`, schemas in `src/schemas/`
- Export everything from `src/index.ts`
- No `.js` extensions in imports — `moduleResolution: "bundler"` is used (compatible with Next.js/Turbopack and Wrangler/esbuild)
- After adding/changing schemas, run `pnpm --filter @kcvv/api-contract build` so apps/web picks up updated `.d.ts` files
- **An HTTP error's status must be attached with `HttpApiSchema.annotations({ status })`, never a bare third-argument object.** `S.TaggedError<X>()(tag, fields, { status: N })` type-checks — `{ status }` is a valid plain schema annotation — but `@effect/platform` does not read status from there; it reads a dedicated symbol key set only by `HttpApiSchema.annotations`. The bare form is silently inert and the error serves (and decodes) as the default 500 regardless of the number written next to it. This is exactly the #2440 bug: all four classes in `src/schemas/http-errors.ts` carried a working-looking `{ status: 404 }` etc. for an unknown length of time while every one of them actually served 500. `tsc` cannot catch this — write a runtime assertion via `HttpApiSchema.getStatusError(X)` for any new error class (see `src/schemas/http-errors.test.ts`), not just a type-level check.
