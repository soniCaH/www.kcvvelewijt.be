# apps/api — KCVV BFF (Cloudflare Worker)

Effect-based BFF that proxies ProSoccerData (PSD) API calls with Cloudflare KV caching,
implementing `PsdApi` from `@kcvv/api-contract`.

## Structure

```text
src/
├── index.ts                  ← Worker entry point (HttpApiBuilder.toWebHandler)
├── env.ts                    ← WorkerEnv type + WorkerEnvTag (Effect Context)
├── cache/
│   └── kv-cache.ts           ← KvCacheService + TypedKvCache (SWR read path, TTLs, drift alerting)
├── psd/
│   ├── errors.ts             ← BffError discriminated union (typed API errors)
│   ├── schemas.ts            ← Raw PSD API schemas (internal only)
│   ├── schemas-player-team.ts ← PSD player/team/staff schemas (used by sync)
│   ├── service.ts            ← PsdService (fetch + transform + business logic)
│   ├── transforms.ts         ← Pure transform functions (PSD → domain types)
│   ├── gate.ts               ← PsdGateService (Effect facade over the gate)
│   ├── gate-do.ts            ← PsdGate Durable Object (global pacer + single-flight)
│   ├── gate-logic.ts         ← GateLogic — token bucket + flight leases (DO-free, testable)
│   ├── incident.ts           ← IncidentTracker (PSD outage open/close state)
│   ├── slack-alert.ts        ← Incident + slow-drift Slack payloads (framework-free)
│   ├── background.ts         ← BackgroundRunnerService (detached SWR refresh port)
│   └── background-live.ts    ← waitUntil-backed runner implementation
├── sanity/
│   ├── config.ts             ← Sanity client config (project ID, dataset, token)
│   ├── mutation.ts           ← SanityMutation — write ops (upsert, archive, image upload)
│   └── projection.ts         ← SanityProjection — read ops (GROQ queries → typed results)
├── handlers/
│   ├── matches.ts            ← MatchesApi HttpApiGroup
│   ├── ranking.ts            ← RankingApi HttpApiGroup
│   ├── opponent.ts           ← OpponentApi HttpApiGroup
│   ├── related.ts            ← RelatedApi HttpApiGroup
│   └── search.ts             ← SearchApi HttpApiGroup
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

| Variable                   | Where set                                     | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PSD_API_BASE_URL`         | `wrangler.toml [vars]`                        | Public, safe to commit                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `FOOTBALISTO_LOGO_CDN_URL` | `wrangler.toml [vars]`                        | Public, safe to commit                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `PSD_API_KEY`              | `wrangler secret put` / CF dashboard          | Never in toml                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `PSD_API_AUTH`             | `wrangler secret put` / CF dashboard          | Never in toml                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `CACHE_LONG_TTL`           | `wrangler.toml [env.staging.vars]`            | Overrides hardTtl to 365d                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `PSD_API_CLUB`             | `wrangler secret put` / CF dashboard          | Never in toml                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `RESEND_API_KEY`           | `wrangler secret put` / CF dashboard          | Never in toml — see `docs/prd/email-delivery.md`                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `SLACK_ALERT_WEBHOOK_URL`  | `wrangler secret put` / CF dashboard          | Never in toml — Slack incoming-webhook for PSD incident/drift alerts (#2329). **Production only** — deliberately unset on staging, where `CACHE_LONG_TTL` makes every key drift by design; absent → alerting no-ops                                                                                                                                                                                                                                                                                   |
| `SEARCH_INDEX_NAME`        | `wrangler.toml [vars]` / `[env.staging.vars]` | Public, safe to commit — mirrors the `SEARCH_INDEX` binding's `[[vectorize]].index_name` for the same environment. Wrangler never exposes a binding's target index name to the worker at runtime, so this is the value the webhook's dataset/index guard (`webhooks/index-handler.ts`, #2833) reads instead. Keep it in sync with the `index_name` on the matching `[[vectorize]]` block by hand — nothing else enforces the pairing except the guard's own hardcoded `EXPECTED_INDEX_BY_DATASET` map |

## Deployment

- **Staging** (on pull requests from this repository): `wrangler deploy --env staging` → `kcvv-api-staging`
- **Production** (on merge to main): `wrangler deploy` → `kcvv-api`

Staging secrets must be set separately:

```bash
wrangler secret put PSD_API_KEY --env staging
wrangler secret put PSD_API_AUTH --env staging
wrangler secret put PSD_API_CLUB --env staging
wrangler secret put RESEND_API_KEY --env staging
```

`SLACK_ALERT_WEBHOOK_URL` is intentionally **not** in that list. Staging runs with
`CACHE_LONG_TTL="true"` (365d hard TTL), so serving months-old cache is its designed
behaviour — but the drift check reads it as "refreshes are not landing" and nudges once
per day per key, forever. With the secret absent, `postSlack` no-ops and staging stays
silent. Don't re-add it.

### Staging Vectorize index — one-time setup (#2833)

`env.staging.vectorize.index_name` in `wrangler.toml` points at `kcvv-search-staging`,
a separate index from production's `kcvv-search`. **It must exist before the first
staging deploy that carries this config** — Cloudflare rejects a `[[vectorize]]`
binding whose `index_name` doesn't exist yet, and staging deploys on every PR
(`wrangler deploy --env staging` above, run from CI), not on demand. Run this once,
before merging any change that lands `index_name = "kcvv-search-staging"`:

```bash
# Dimensions and metric must match production's model, @cf/baai/bge-m3
# (src/search/embedding.ts) — 1024 dims, cosine. They are not arbitrary.
wrangler vectorize create kcvv-search-staging --dimensions=1024 --metric=cosine

# Then, before any vector lands in it: search-handler.ts filters queries on
# the `type` metadata field, and Vectorize v2 only honours a filter on a
# property that has an explicit metadata index — one created AFTER vectors
# already exist does not apply to them retroactively. Get this order wrong
# and the failure is silent: a filtered search just returns zero rows.
wrangler vectorize create-metadata-index kcvv-search-staging --property-name=type --type=string
```

**Nothing populates the new index automatically.** `env.staging.triggers.crons` is
`[]` by design (staging shares PSD's API quota with production), so
`runSanityIndexSync` — the only bulk writer, dispatched from the `30 2 * * *` cron in
`index.ts` — never runs on staging. The only other writer is the per-document
webhook. Before this change, staging's `/search` and `/related` read production's
data through the shared index; after it, **staging search returns nothing until
someone runs a one-off backfill.** `docs/agents/testing-ops.md` and
`.github/workflows/e2e.yml` both point `KCVV_API_URL` at the staging worker, so this
is a real gap for anyone exercising search there, not a theoretical one.

To backfill once, run the same nightly job on demand against real staging bindings:

```bash
pnpm wrangler dev --env staging --remote --test-scheduled
# in another terminal, or a browser:
curl "http://localhost:8787/__scheduled?cron=30+2+*+*+*"
```

Re-run the same command any time staging's index needs to catch up (e.g. after the
one-time setup above, or after a long staging Studio session). A guarded HTTP route
that does the same thing without a local `wrangler dev` session would be cheaper to
run repeatedly — proposed, not built, in #2833's PR.

## Cache

`TypedKvCache` uses a two-TTL pattern (stale-on-error):

- **softTtl** — freshness threshold. If cached data is younger than softTtl, return it immediately.
- **hardTtl** — KV storage TTL (default 7 days). If cached data is older than softTtl but younger than hardTtl, attempt refresh; on failure, serve stale data with a warning log.

Values are stored as `{ value, fetchedAt }` wrappers. On deploy, existing cache entries without the wrapper trigger a one-time cold start.

### Drift observability (#2335)

A background (SWR) refresh runs in `waitUntil`, which Cloudflare cancels ~30 s after the invocation ends. A **killed** refresh — unlike a **failed** one — runs none of its handlers: no negative marker, no incident report, no drift nudge. The value then drifts toward the 7-day hard-expiry cliff behind a clean `200` and a clean log. Two guards close that gap:

- **`BG_REFRESH_TIMEOUT_MS` (12 s)** bounds the background refresh fetch so a slow one takes the normal failure path (negative marker + escalating log) instead of being killed. **The binding ceiling is `GateLogic.leaseMs` (15 s), not the `waitUntil` budget** — a refresh that outruns the lease loses single-flight, so the next reader forks a second full fan-out under exactly the load that made the first one slow, and the original's `endFlight` then releases the new leader's flight. A unit test pins `BG_REFRESH_TIMEOUT_MS < 15 s`; keep them coupled. `getOrFetch`'s `backgroundTimeoutMs` option exists so tests can drive it with a small value — no production caller overrides it. A timed-out refresh deliberately does **not** call `gate.reportOutcome` — a slow fan-out under load is not proof PSD is down, and reporting it would open spurious outage pings. Note the timeout abandons the fan-out but does not cancel it: `fetch` takes no `AbortSignal`, so in-flight PSD calls run to completion.
- **A read-path drift check** evaluates stale age on every stale serve, before the negative-marker early-return, so a key whose marker keeps being re-set still surfaces. It is the only signal that does not depend on a refresh path executing at all.

`blockingRefresh` is deliberately **not** bounded. It runs inside the request's own lifetime, so nothing kills it out from under its handlers — the failure mode this section exists to fix cannot occur there. (In production it is only reachable via the `mustBlockOnStale` correctness guard, since `index.ts` provides `BackgroundRunnerLive` for the whole API layer.)

**Drift is measured as time past the soft TTL, not absolute age**: `staleForMs = (now − fetchedAt) − softTtl`, compared against `DRIFT_NUDGE_THRESHOLD` (24 h) — "this key has failed to refresh for a day". An absolute rule would fire the instant a healthy 24 h-softTtl key (`matches:team:{id}`, `ranking:team:{id}`) goes stale on a perfectly normal refresh cycle. The same rule governs `keepStale`'s WARN→ERROR escalation. Slack still reports **absolute** age + time-to-cliff.

While drifting: `ERROR` on every stale serve (the `wrangler tail` trace), Slack nudge once per day per key (`nudge:{key}`, `NUDGE_MARKER_TTL`). The drift decision is pure arithmetic, so the normal stale path costs no extra I/O; the nudge's KV dedup read + Slack POST are forked into `waitUntil` rather than run inline, because this is the serve-stale-instantly path. `keepStale` keeps a fallback nudge for the case where the read-path write did not land — it is the only one carrying the failing HTTP status.

| Key pattern                          | softTtl                                                                                                                                                                                                                                                                                                                                                   | hardTtl |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `psd:current-season-id`              | 24 h                                                                                                                                                                                                                                                                                                                                                      | 7 days  |
| `matches:team:{id}`                  | 24 h — capped at 5 min while any match is past kickoff but still `scheduled` (result pending, 48h grace window), so scores land on list surfaces (kalender, homepage, team agenda) minutes after PSD publishes them. See `teamMatchesTtl` in `handlers/matches.ts`.                                                                                       | 7 days  |
| `matches:next`                       | 4 h — capped at 5 min once any listed kickoff is in the past ("next" is computed at fetch time, so a started match would otherwise stay advertised on the homepage agenda + MatchStrip for hours). See `nextMatchesTtl` in `handlers/matches.ts`.                                                                                                         | 7 days  |
| `match:detail:{id}`                  | proximity-based: 7 days (settled ≥48h ago w/ report) · 60 s (<3h of kickoff) · 5 min (<24h) · 1 h (<7d) · 24 h (distant). Report-pending override: a past match still missing its report (PSD `hasReport` set, or <48h since kickoff) is capped at 5 min so the report self-heals instead of being pinned. See `matchDetailTtl` in `handlers/matches.ts`. | 7 days  |
| `ranking:team:{id}`                  | 24 h                                                                                                                                                                                                                                                                                                                                                      | 7 days  |
| `stats:team:{id}`                    | 24 h                                                                                                                                                                                                                                                                                                                                                      | 7 days  |
| `stats:player:{memberId}:{seasonId}` | 6 h                                                                                                                                                                                                                                                                                                                                                       | 7 days  |
| `psd:calls:YYYY-MM-DD`               | 48 h (daily PSD call counter, not via TypedKvCache)                                                                                                                                                                                                                                                                                                       | —       |

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
- **Never rate-limit off `Date.now()` inside the `PsdGate` Durable Object.** A DO advances its clock only on I/O, so while every caller is sleeping inside the gate no time passes: a wall-clock token bucket accrues nothing and starves forever (this pinned every fan-out — `matches:window`, `match:detail:*` — at its Jul 30 snapshot until the 7-day hard TTL). Pace with relative sleeps only (`GateLogic.acquireToken`). The failure is silent: a cancelled `waitUntil` sets no negative marker and reports no outcome, so SWR just keeps serving stale.

## PSD Schema & Transform Rules

- **Audit existing schema declarations before writing a new field.** When adding a field that appears on multiple PSD endpoints, grep `schemas.ts` for the field name first. `competitionType` appears in both `PsdGameBaseFields` (seasons endpoint) and the match detail general schema (match detail endpoint) — they must stay in sync.
- **Null before typeof.** When dispatching on `typeof value` for a nullable union field, always guard `if (val == null)` first — `typeof null === "object"` silently routes null into the object branch (e.g. `null?.type ?? "UNKNOWN"` → literal `"UNKNOWN"`). Pattern: `if (ct == null) return undefined; if (typeof ct === "string") ...; return /* object path */`.
- **Best-effort enrichment fetches run after the mandatory empty/not-found guard.** Any fetch that only enriches the response (e.g. `/teams` for team labels) must be placed after the primary empty-check and wrapped in `Effect.catchAll(() => Effect.succeed(undefined))` — an enrichment failure must never abort the primary response.
- **Status guard before every W/D/L aggregation.** When computing win/draw/loss counts over a match list, explicitly guard `m.status === "finished"` before each increment — scheduled, postponed, and forfeited matches must not count.
- **Schema change + transform change = one commit.** Fixing a schema field (e.g. adding `S.Union(PsdCompetitionType, S.String)`) without simultaneously updating every transform that reads that field creates a broken intermediate state. Both changes belong in the same commit.
- **Club names get `normaliseClubName()` at the emission site, never at decode time** (#2336 — rationale in its JSDoc). Match-side names go through `toMatchTeam`, which normalises by construction; `team_name` on the ranking transform is the one hand-wired site. Consumers must not re-case — the web app owned two local copies and they drifted. `CLUB_ABBREVIATIONS` is a hand-maintained allowlist: add a token when a club is reported wrong, not a name→name exception map.
