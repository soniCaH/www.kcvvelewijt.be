# apps/api — KCVV BFF (Cloudflare Worker)

Effect-based BFF that proxies ProSoccerData (PSD) API calls with Cloudflare KV caching,
implementing `PsdApi` from `@kcvv/api-contract`.

## Structure

```text
src/
├── index.ts                  ← Worker entry point (HttpApiBuilder.toWebHandler)
├── env.ts                    ← WorkerEnv type + WorkerEnvTag (Effect Context)
├── cache/
│   └── kv-cache.ts           ← KvCacheService (get/set with TTL)
├── footbalisto/
│   ├── schemas.ts            ← Raw PSD API schemas (internal only)
│   └── service.ts            ← FootbalistoService (fetch + transform + business logic)
├── handlers/
│   ├── matches.ts            ← MatchesApi HttpApiGroup
│   ├── ranking.ts            ← RankingApi HttpApiGroup
│   └── stats.ts              ← StatsApi HttpApiGroup
└── sync/
    ├── psd-team-client.ts    ← PsdTeamClient (teams/members/staff fetch for sync)
    └── psd-sanity-sync.ts    ← PSD → Sanity player/team/staff sync
```

## Local development

```bash
cp apps/api/.dev.vars.example apps/api/.dev.vars  # fill in PSD secrets
pnpm --filter @kcvv/api dev                        # wrangler dev on :8787
```

`.dev.vars` is gitignored. Never commit secrets.

## Environment variables

| Variable                   | Where set                            | Notes                     |
| -------------------------- | ------------------------------------ | ------------------------- |
| `PSD_API_BASE_URL`         | `wrangler.toml [vars]`               | Public, safe to commit    |
| `FOOTBALISTO_LOGO_CDN_URL` | `wrangler.toml [vars]`               | Public, safe to commit    |
| `PSD_API_KEY`              | `wrangler secret put` / CF dashboard | Never in toml             |
| `PSD_API_AUTH`             | `wrangler secret put` / CF dashboard | Never in toml             |
| `CACHE_LONG_TTL`           | `wrangler.toml [env.staging.vars]`   | Overrides hardTtl to 365d |
| `PSD_API_CLUB`             | `wrangler secret put` / CF dashboard | Never in toml             |

## Deployment

- **Staging** (on pull requests from this repository): `wrangler deploy --env staging` → `kcvv-api-staging`
- **Production** (on merge to main): `wrangler deploy` → `kcvv-api`

Staging secrets must be set separately:

```bash
wrangler secret put PSD_API_KEY --env staging
wrangler secret put PSD_API_AUTH --env staging
wrangler secret put PSD_API_CLUB --env staging
```

## Cache

`TypedKvCache` uses a two-TTL pattern (stale-on-error):

- **softTtl** — freshness threshold. If cached data is younger than softTtl, return it immediately.
- **hardTtl** — KV storage TTL (default 7 days). If cached data is older than softTtl but younger than hardTtl, attempt refresh; on failure, serve stale data with a warning log.

Values are stored as `{ value, fetchedAt }` wrappers. On deploy, existing cache entries without the wrapper trigger a one-time cold start.

| Key pattern             | softTtl                                             | hardTtl |
| ----------------------- | --------------------------------------------------- | ------- |
| `psd:current-season-id` | 24 h                                                | 7 days  |
| `matches:team:{id}`     | 24 h                                                | 7 days  |
| `matches:next`          | 4 h                                                 | 7 days  |
| `match:detail:{id}`     | 7 days (finished ≥48h ago) / 24 h (all other cases) | 7 days  |
| `ranking:team:{id}`     | 24 h                                                | 7 days  |
| `stats:team:{id}`       | 24 h                                                | 7 days  |
| `psd:calls:YYYY-MM-DD`  | 48 h (daily PSD call counter, not via TypedKvCache) | —       |

## Cache invalidation

Staging uses `CACHE_LONG_TTL = "true"` (set in `wrangler.toml` `[env.staging.vars]`) which overrides the KV hard TTL to 365 days. This means each endpoint cold-starts once, then serves from cache for up to a year — minimizing PSD API quota usage on staging.

To manually invalidate cached data on staging:

```bash
# Clear ALL cached keys on staging
pnpm --filter @kcvv/api cache:clear:staging

# Clear a single key on staging
pnpm --filter @kcvv/api cache:clear:staging:key "matches:next"
pnpm --filter @kcvv/api cache:clear:staging:key "ranking:team:23"
```

## Rules

- No `S.Unknown` in PSD schemas — only declare fields actively used in transforms. Exception: wrapper schemas for resilient per-item decoding (e.g., `PsdMatchListSchema`) use `S.Array(S.Unknown)` so items can be decoded individually via `Effect.partition`
- Secrets via `wrangler secret put`, never in `wrangler.toml`
- `Effect.orDie` in HttpApiGroup handlers — errors become 500s; keep errors typed at handler level
- After changing `@kcvv/api-contract`, run `pnpm turbo build --filter=@kcvv/api-contract` first

## PSD Schema & Transform Rules

- **Audit existing schema declarations before writing a new field.** When adding a field that appears on multiple PSD endpoints, grep `schemas.ts` for the field name first. `competitionType` appears in both `PsdGameBaseFields` (seasons endpoint) and `FootbalistoMatchDetailGeneral` (match detail endpoint) — they must stay in sync.
- **Null before typeof.** When dispatching on `typeof value` for a nullable union field, always guard `if (val == null)` first — `typeof null === "object"` silently routes null into the object branch (e.g. `null?.type ?? "UNKNOWN"` → literal `"UNKNOWN"`). Pattern: `if (ct == null) return undefined; if (typeof ct === "string") ...; return /* object path */`.
- **Best-effort enrichment fetches run after the mandatory empty/not-found guard.** Any fetch that only enriches the response (e.g. `/teams` for team labels) must be placed after the primary empty-check and wrapped in `Effect.catchAll(() => Effect.succeed(undefined))` — an enrichment failure must never abort the primary response.
- **Status guard before every W/D/L aggregation.** When computing win/draw/loss counts over a match list, explicitly guard `m.status === "finished"` before each increment — scheduled, postponed, and forfeited matches must not count.
- **Schema change + transform change = one commit.** Fixing a schema field (e.g. adding `S.Union(PsdCompetitionType, S.String)`) without simultaneously updating every transform that reads that field creates a broken intermediate state. Both changes belong in the same commit.
