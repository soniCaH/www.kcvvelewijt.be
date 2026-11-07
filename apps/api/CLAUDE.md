# apps/api — KCVV BFF (Cloudflare Worker)

Effect-based BFF that proxies ProSoccerData (PSD) API calls with Cloudflare KV caching,
implementing `PsdApi` from `@kcvv/api-contract`.

## Structure

```text
src/
├── index.ts                  ← Worker entry point (HttpApiBuilder.toWebHandler)
├── env.ts                    ← WorkerEnv type + WorkerEnvTag (Effect Context)
├── auth/
│   └── bff-key.ts            ← refuseUnlessBffKey — shared-secret front door (#3485)
├── reconciliation.ts         ← reconcileOrphans — shared orphan-reconciliation guard (#2854), used by sync/psd-sanity-sync.ts and search/sanity-index-sync.ts
├── cache/
│   ├── daily-ceiling.ts      ← utcDay, parseCeiling, parseCount, oncePerDay — daily counters + ceilings shared by kv-cache and search/ai-answer (#3468)
│   └── kv-cache.ts           ← KvCacheService + TypedKvCache (SWR read path, TTLs, drift alerting) + `durable` ops (TTL-less write, list, dataset scoping) for non-SWR callers (#2873)
├── psd/
│   ├── errors.ts             ← BffError discriminated union (typed API errors)
│   ├── schemas.ts            ← Raw PSD API schemas (internal only)
│   ├── schemas-player-team.ts ← PSD player/team/staff schemas (used by sync)
│   ├── service.ts            ← PsdService (fetch + transform + business logic)
│   ├── transforms.ts         ← Pure transform functions (PSD → domain types)
│   ├── gate.ts               ← PsdGateService (Effect facade over the gate)
│   ├── gate-do.ts            ← PsdGate Durable Object (global pacer + single-flight + daily call count)
│   ├── gate-logic.ts         ← GateLogic — token bucket + flight leases (DO-free, testable)
│   ├── incident.ts           ← IncidentTracker (PSD outage open/close state)
│   ├── job-alert.ts          ← Scheduled-job failure signal (KV-debounced, independent of IncidentTracker)
│   ├── slack-alert.ts        ← Incident + drift + job-alert Slack payloads (framework-free)
│   ├── background.ts         ← BackgroundRunnerService (detached SWR refresh port)
│   └── background-live.ts    ← waitUntil-backed runner implementation
├── sanity/
│   ├── config.ts             ← Sanity client config (project ID, dataset, token)
│   ├── mutation.ts           ← SanityMutation — write ops (upsert, archive, image upload / unset)
│   └── projection.ts         ← SanityProjection — read ops (GROQ queries → typed results)
├── handlers/
│   ├── matches.ts            ← MatchesApi HttpApiGroup
│   ├── ranking.ts            ← RankingApi HttpApiGroup
│   ├── opponent.ts           ← OpponentApi HttpApiGroup
│   ├── related.ts            ← RelatedApi HttpApiGroup
│   └── search.ts             ← SearchApi HttpApiGroup + searchWithCeilings (rate limits, response cache, #3468)
└── sync/
    ├── psd-team-client.ts    ← PsdTeamClient (teams/members/staff fetch for sync)
    ├── psd-sanity-sync.ts    ← PSD → Sanity player/team/staff sync
    ├── staff-gaps-check.ts   ← weekly Slack nudge for staff/coordinator gaps (#3561)
    └── birthday-post.ts      ← daily #general birthday post, plus the week's list on Mondays (#3570)
```

## Local development

```bash
cp apps/api/.dev.vars.example apps/api/.dev.vars  # fill in PSD secrets
pnpm --filter @kcvv/api dev                        # wrangler dev on :8787
```

`.dev.vars` is gitignored. Never commit secrets.

## Environment variables

| Variable                     | Where set                                     | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PSD_API_BASE_URL`           | `wrangler.toml [vars]`                        | Public, safe to commit                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `FOOTBALISTO_LOGO_CDN_URL`   | `wrangler.toml [vars]`                        | Public, safe to commit                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `PSD_API_KEY`                | `wrangler secret put` / CF dashboard          | Never in toml                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `BFF_SHARED_SECRET`          | `wrangler secret put` / CF dashboard          | Never in toml — required; see "Only the website may call the worker" below (#3485)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `PSD_API_AUTH`               | `wrangler secret put` / CF dashboard          | Never in toml                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `AI_ANSWER_DAILY_CAP`        | `wrangler.toml [vars]` / `[env.staging.vars]` | `"2000"` — AI answers per UTC day; see "Ceilings inside the worker" (#3468). Unset → no cap; `"0"` → no answers at all (kill switch)                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `PSD_ONDEMAND_DAILY_BUDGET`  | `wrangler.toml [vars]` / `[env.staging.vars]` | `"850"` — PSD calls per UTC day after which a cold miss fails fast; see "Ceilings inside the worker" (#3468). Unset → no budget; `"0"` → every cold miss refused (kill switch)                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `CACHE_LONG_TTL`             | `wrangler.toml [env.staging.vars]`            | Overrides hardTtl to 365d                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `PSD_API_CLUB`               | `wrangler secret put` / CF dashboard          | Never in toml                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `RESEND_API_KEY`             | `wrangler secret put` / CF dashboard          | Never in toml — see `docs/prd/archive/2026/email-delivery.md`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `SLACK_ALERT_WEBHOOK_URL`    | `wrangler secret put` / CF dashboard          | Never in toml — Slack incoming-webhook for PSD incident/drift alerts (#2329). **Production only** — deliberately unset on staging, where `CACHE_LONG_TTL` makes every key drift by design; absent → alerting no-ops                                                                                                                                                                                                                                                                                                                                                                            |
| `SEARCH_INDEX_NAME`          | `wrangler.toml [vars]` / `[env.staging.vars]` | Public, safe to commit — mirrors the `SEARCH_INDEX` binding's `[[vectorize]].index_name` for the same environment. Wrangler never exposes a binding's target index name to the worker at runtime, so this is the value the webhook's dataset/index guard (`webhooks/index-handler.ts`, #2833) reads instead. Keep it in sync with the `index_name` on the matching `[[vectorize]]` block by hand — nothing else enforces the pairing except the guard's own hardcoded `EXPECTED_INDEX_BY_DATASET` map                                                                                          |
| `SEARCH_INDEX_PRUNE_DRY_RUN` | `wrangler.toml [vars]` / `[env.staging.vars]` | Public, safe to commit — `"false"` since #2857, so the nightly sweep's prune step (`search/sanity-index-sync.ts`, #2831) calls `deleteByIds` for real. It shipped as `"true"`, which logs the ids it would delete instead; the release check on 2026-09-10 found the KV manifest, the live `kcvv-search` index and the current Sanity set all at the same 166 ids, so the delete set was empty and the flip carried no blast radius. Set it back to `"true"` to re-arm dry-run. Anything other than the literal string `"false"` is treated as dry-run — fails safe on a typo or an absent var |

## Runbooks (`docs/agents/api-ops.md`)

### Releasing a stuck prune safety cap

The nightly search-index sweep refuses to prune when its delete set is over the safety cap, and logs a WARN. Release lever (deleting the manifest key), refusal alerts and the webhook GROQ filter: `docs/agents/api-ops.md` → Releasing a stuck prune safety cap.

### The search-index manifest and the orphan-reconciliation guard (#2854, #2855)

The nightly sweep (`search/sanity-index-sync.ts`) is the only writer of the manifest array; `VectorizeServiceLive.upsert` records pending markers, and a delete never touches the manifest. `reconcileOrphans` (`src/reconciliation.ts`) is the one shared orphan guard behind both sync jobs, and its `releaseLeverHint` is required. Why, and the floor-less ratio latch: `docs/agents/api-ops.md` → The search-index manifest's ADD side and The shared orphan-reconciliation guard.

### PSD sync rotation, portraits and personal data (#3465, #3469)

The nightly sync rotates through PSD's teams sorted by numeric id, guards the cycle end, isolates each member, writes only on change and keeps portraits in step with PSD. Details, `SYNC_MANUAL_RUN` and the cleanup alerts: `docs/agents/api-ops.md` → PSD sync rotation, PSD portraits and personal data.

### Releasing a stuck PSD sync orphan-cap refusal

The release lever is the one-shot KV key `sync:orphan-cap-override` (`players`, `staff`, `teams` or `all`, one entity type per use). Set it only after confirming the refusal is a false positive. Commands and the reasoning: `docs/agents/api-ops.md` → Releasing a stuck PSD sync orphan-cap refusal.

### Weekly staff-gaps nudge (#3561) and daily birthday post (#3570)

Two production-only crons, each in its own `scheduled()` branch and each reporting through `reportScheduledJobOutcome` (`staff-gaps-check`, `birthday-post`): `0 6 * * MON` runs `sync/staff-gaps-check.ts`, `0 7 * * *` runs `sync/birthday-post.ts`. What each reads and posts: `docs/agents/api-ops.md` → Weekly staff-gaps nudge, Daily birthday post.

## Only the website may call the worker (#3485)

The worker is public on `workers.dev` with no zone or WAF in front of it, and
no browser ever calls it — every caller is Next.js server code. So `fetch()` in
`src/index.ts` refuses every request that does not carry header
`x-kcvv-bff-key` (`BFF_KEY_HEADER`, exported by `@kcvv/api-contract`) equal to
the `BFF_SHARED_SECRET` wrangler secret, with `401 Unauthorized`, before any
KV, DO, PSD, Sanity or AI work. The comparison is constant-time
(`crypto.subtle.timingSafeEqual`, `src/auth/bff-key.ts`).

- **Fail closed.** Secret unset → every request gets `401` and an
  `[auth] BFF_SHARED_SECRET not set` error log. No dev bypass: local dev puts
  the same value in `apps/api/.dev.vars` and `apps/web/.env.local` (both
  `.example` files carry `local-dev-secret`).
- **Webhook exemption.** `POST /webhooks/index` is routed before the check and
  keeps its own Sanity HMAC (`SANITY_WEBHOOK_SECRET`). The `scheduled()` crons
  are not requests and are unaffected.
- **Calendar redirect exemption.** `GET`/`HEAD /calendar` is also answered
  before the check, with a `308` to `https://www.kcvvelewijt.be/api/calendar.ics`
  (`teams` → `teamIds`, `side` kept, other params dropped), because old
  `footbalisto.be/calendar` subscribers' calendar apps hold no BFF key (#3578).
  No service is built for it.
- **No CORS.** `HttpMiddleware.cors()` is gone on purpose — do not add it back.
- **The web side.** `BffService` (every `HttpApiClient` request) and the
  `api/search` / `api/membership` route handlers send the header from the
  server-only `BFF_SHARED_SECRET` env var — never `NEXT_PUBLIC_`, never in a
  `"use client"` file. CI passes `secrets.BFF_SHARED_SECRET` (GitHub
  environment secret in `Production` and `Preview`) to the Next build and E2E.
- **Rollout order.** Set the secret everywhere first — production and staging
  worker (`wrangler secret put BFF_SHARED_SECRET [--env staging]`), Vercel
  (Production + Preview) and the GitHub `Production`/`Preview` environments —
  then merge. Old code ignores the secret, so setting it early is harmless.
  Until the Vercel deploy finishes after a merge, cold cache misses get `401`
  for a few minutes; ISR pages serve their cached copy. A PR built from older
  code gets `401` from the staging worker until it is rebased. Rotating the
  secret follows the same order: worker and Vercel together, then redeploy.

## Ceilings inside the worker (#3468)

Every request reaches the worker through the website, so these ceilings bound what a script can spend: `/search` and `/search/team-guess` (IP and global rate limiters, a response cache, an AI daily cap `AI_ANSWER_DAILY_CAP`), PSD (a not-found cache, an on-demand daily budget `PSD_ONDEMAND_DAILY_BUDGET`) and `/related` (id validation). Order, keys, TTLs and how the budget was chosen: `docs/agents/api-ops.md` → Ceilings inside the worker. The budget rule is in § Rules.

## Deployment

- **Staging** (on pull requests from this repository): `wrangler deploy --env staging` → `kcvv-api-staging`
- **Production** (on merge to main): `wrangler deploy` → `kcvv-api`

Staging secrets must be set separately:

```bash
wrangler secret put PSD_API_KEY --env staging
wrangler secret put PSD_API_AUTH --env staging
wrangler secret put PSD_API_CLUB --env staging
wrangler secret put RESEND_API_KEY --env staging
wrangler secret put BFF_SHARED_SECRET --env staging
```

`SLACK_ALERT_WEBHOOK_URL` is intentionally **not** in that list. Staging runs with
`CACHE_LONG_TTL="true"` (365d hard TTL), so serving months-old cache is its designed
behaviour — but the drift check reads it as "refreshes are not landing" and nudges once
per day per key, forever. With the secret absent, `postSlack` no-ops and staging stays
silent. Don't re-add it.

### Staging Vectorize index (#2833)

`env.staging.vectorize.index_name` in `wrangler.toml` points at `kcvv-search-staging`, a separate index from production's `kcvv-search`; it was created once, by hand. If it is ever recreated: 1024 dimensions, cosine (production's model, `@cf/baai/bge-m3`, `src/search/embedding.ts`), and create the `type` metadata index (`wrangler vectorize create-metadata-index kcvv-search-staging --property-name=type --type=string`) before any vector lands. `search-handler.ts` filters on `type`, and a metadata index created after vectors exist does not apply to them, so a filtered search silently returns zero rows.

**Nothing populates the new index automatically.** `env.staging.triggers.crons` is
`[]` by design (staging shares PSD's API quota with production), so
`runSanityIndexSync` — the only bulk writer, dispatched from the `30 2 * * *` cron in
`index.ts` — never runs on staging. No Sanity webhook points at staging either
(#2846, closed into #2845), so nothing writes the staging index unless someone
runs the backfill below. Before this change, staging's `/search` and `/related` read production's
data through the shared index; after it, **staging search returns nothing until
someone runs the backfill below.** `docs/agents/testing-ops.md` and
`.github/workflows/e2e.yml` both point `KCVV_API_URL` at the staging worker, so this
is a real gap for anyone exercising search there, not a theoretical one.

**Staging search is pull-only, by choice (#2845): no cron, no webhook.** To fill or
refresh `kcvv-search-staging`, run one command from the repo root:

```bash
./scripts/backfill-staging-search.sh
```

It starts the staging worker with remote bindings, fires the `30 2 * * *` sweep once
(never the `0 2 * * *` PSD sync), waits for it to settle, stops the worker, and prints
the index's vector count. It exits non-zero on a failed sweep. Re-run it whenever
staging search should catch up with the staging dataset. Run it from a checkout that
has `apps/api/.dev.vars` — a fresh worktree has none, and the script refuses rather
than start a worker without a Sanity token.

It refuses to start unless `wrangler.toml` pairs staging with dataset `staging` and
index `kcvv-search-staging`. It also keeps `.dev.vars` from overriding that pair: a
`.dev.vars` that sets `SANITY_DATASET=production` would otherwise win over
`[env.staging.vars]`, and the dataset/index guard would refuse the sweep. The script
passes wrangler a copy of `.dev.vars` without those two keys (`--env-file`), so the
secrets still load.

## Cache

### `KvCacheService` owns KV, in full (#2873)

Every KV access in this worker goes through `KvCacheService`; no caller reaches `env.PSD_CACHE` directly. Its SWR read path (`get`/`set`/`delete`) swallows every KV failure to `null`/`undefined`, so a cache blip never breaks a read. Its `durable` half (`get`/`set`/`setForever`/`delete`/`list`/`forDataset`) surfaces a `KvError`: use it where "unreadable" must never read as "absent" (`sync/psd-sanity-sync.ts`, `search/index-manifest.ts`). The full contract: `docs/agents/api-ops.md` → `KvCacheService` owns KV, in full.

`TypedKvCache` uses a two-TTL pattern (stale-on-error):

- **softTtl** — freshness threshold. If cached data is younger than softTtl, return it immediately.
- **hardTtl** — KV storage TTL (default 7 days). If cached data is older than softTtl but younger than hardTtl, attempt refresh; on failure, serve stale data with a warning log.

Values are stored as `{ value, fetchedAt, partial? }` wrappers. On deploy, existing cache entries without the wrapper trigger a one-time cold start.

### Drift observability (#2335)

A killed background refresh runs none of its handlers, so a key can drift toward the 7-day hard-expiry cliff behind a clean `200`. `BG_REFRESH_TIMEOUT_MS` (12 s, pinned below `GateLogic.leaseMs`) and a read-path drift check on the `stale-since:{key}` marker close that gap; there is no blocking refresh. The guards, the partial-fan-out and inline-refresh rules, the drift definition and the KV TTL table: `docs/agents/api-ops.md` → Drift observability.

## Cache invalidation

Staging uses `CACHE_LONG_TTL = "true"` (set in `wrangler.toml` `[env.staging.vars]`) which overrides the KV hard TTL to 365 days. This means each endpoint cold-starts once, then serves from cache for up to a year — minimizing PSD API quota usage on staging.

To manually invalidate cached data on staging:

```bash
# Clear ALL cached keys on staging
pnpm --filter @kcvv/api cache:clear:staging

# Clear a single key on staging. Match keys carry a version suffix
# (CACHE_VERSION in src/handlers/matches.ts) — list them first:
pnpm --filter @kcvv/api exec wrangler kv key list --binding=PSD_CACHE --env staging --remote --prefix "matches:"
pnpm --filter @kcvv/api cache:clear:staging:key "matches:next:v2"
pnpm --filter @kcvv/api cache:clear:staging:key "ranking:team:23"
```

## Rules

- No `S.Unknown` in PSD schemas — only declare fields actively used in transforms. Exception: wrapper schemas for resilient per-item decoding (e.g., `PsdMatchListSchema`) use `S.Array(S.Unknown)` so items can be decoded individually via `Effect.partition`
- Secrets via `wrangler secret put`, never in `wrangler.toml`
- `Effect.orDie` in HttpApiGroup handlers — errors become 500s; keep errors typed at handler level
- After changing `@kcvv/api-contract`, run `pnpm turbo build --filter=@kcvv/api-contract` first
- **Every PSD call takes a gate token — the scheduled paths too, not just the request path.** Both PSD clients (`psd/service.ts` for reads, `sync/psd-team-client.ts` for the nightly sync) open `countedFetch` with `gate.acquireToken`, and every layer that provides either one must also provide `PsdGateLive`. The sync shipped without it (#2867): its fan-out runs members+staff at concurrency 2 over pages at concurrency 3, so ~6 calls sat outside the ≤5/s worldwide budget. This is now enforced by the type system — dropping `PsdGateLive` from a layer that builds `PsdTeamClientLive` fails `type-check` — so a new PSD client only needs the same `acquireToken` opening to inherit the guarantee.
- **A gate token is pacing, not observability — PSD incident alerting still does not cover the scheduled paths, by design.** `gate.reportOutcome` (the call that opens/closes a PSD incident and fires the Slack ping from #2329) is invoked from the `TypedKvCache` refresh path in `cache/kv-cache.ts` and nowhere else. The nightly sync's PSD-fetch layer (`sync/psd-team-client.ts`) no longer touches `KvCacheService` at all (its token grant is what counts the call, #3490); `sync/psd-sanity-sync.ts`'s `runSync` itself goes through `KvCacheService.durable` for its cursor/checkpoint/accumulation state (#2873). Neither touchpoint ever calls `reportOutcome`, so the nightly sync never reaches one, and this is intentional: the read path reads `incidentOpen` back to escalate its serve-stale logs `WARN→ERROR`, so routing a scheduled-job failure through `reportOutcome` would make request-path logs shout — and fire a "PSD outage started" Slack ping — while the site serves visitors from cache perfectly fine. A sync failing at 02:00 is not the same event as PSD being down for visitors, and `IncidentTracker` must never model it. **Decided in #2870 (Option B over Option A):** Option A (routing scheduled-job failures through `reportOutcome`) was rejected for exactly that read-path blast radius, and it could not have covered the `30 2 * * *` search-index cron anyway — its failures are Workers AI / Vectorize / Sanity, not PSD, so there is no PSD incident for it to open. Instead, `psd/job-alert.ts` runs a second, parallel state machine — `reportScheduledJobOutcome` — that never imports `psd/incident.ts` or `psd/gate.ts`. It persists a per-job state in KV (`job-alert:{job}`, shaped like the drift nudge's `nudge:{key}` marker) and debounces the same way `IncidentTracker` does: alert on the first failure after healthy and keep retrying on every subsequent failure until Slack actually confirms delivery (`postSlack` now returns whether the POST landed, not just whether it was attempted — a dropped webhook POST used to debounce a whole outage into announcing it zero times, not once), then stay silent for the rest of that streak; alert once on the first recovery after ≥1 failures (best-effort — a dropped recovery POST still resets the streak, since losing one "recovered" ping is far less costly than losing the outage ping). `psd/slack-alert.ts` gained a third message builder, `buildJobAlertMessage` (alongside `buildIncidentMessage` and `buildDriftMessage`), reusing the same `postSlack`. Both `scheduled()` branches in `index.ts` call `reportScheduledJobOutcome("psd-sanity-sync", …)` / `reportScheduledJobOutcome("sanity-index-sync", …)` strictly after their sync work settles (never inside its own `try`, so a reporting hiccup can't be mistaken for — or falsely alert — a sync failure, and never before the `0 2 * * *` branch's wall-clock log, so the report's own KV/Slack I/O doesn't inflate the number #2900 measures against the Cron Trigger ceiling) — additive to the existing `console.error`, not a replacement.
  - **`runSanityIndexSync` degrades every embedding/upsert failure internally** (`embedDoc`, `upsertBatched`, `deleteBatched` in `search/sanity-index-sync.ts` each `catchAll` and log-and-skip, so one bad document never aborts the sweep), which used to mean the whole function resolved successfully even when Workers AI or Vectorize rejected every single call — the job-alert signal would have called that run healthy. It now fails (and the job-alert signal sees it) only on the unambiguous bar: there was content to index and **none** of it landed across all four phases combined (responsibility paths + articles + pages + galleries). A partial failure — some documents land, others don't — still resolves successfully and stays a WARN/ERROR log, not a job failure; that's a deliberate, narrower bar than "any degradation", not an oversight.
  - **Known remaining gap, not built here:** if the `0 2 * * *` invocation is killed at the 15-minute Cron Trigger wall-clock ceiling (the #2900 failure mode this job is designed around), neither the `catch` nor the post-sync report ever runs — no alert fires, and a counter already at "failing" from an earlier night stays there silently forever. Catching that needs a heartbeat / dead-man's-switch (write "started" on entry, clear on success) — a different mechanism, out of scope for #2870.
- **The PSD on-demand daily budget (`PSD_ONDEMAND_DAILY_BUDGET`) never goes above 1 000 while the old AWS app also calls PSD** (our half of PSD's 2 000/day). It counts the nightly sync too. Reasoning: `docs/agents/api-ops.md` → Ceilings inside the worker.
- **Never stop accumulating a team on a zero roster.** PSD returning 0 players for a team Sanity lists players for must still accumulate the team and its existing player ids; skipping it turns player reconciliation off. Detail: `docs/agents/api-ops.md` → PSD sync rotation.
- **Every KV access goes through `KvCacheService`.** Never reach `env.PSD_CACHE` directly.
- **Never rate-limit off `Date.now()` inside the `PsdGate` Durable Object.** A DO advances its clock only on I/O, so while every caller is sleeping inside the gate no time passes: a wall-clock token bucket accrues nothing and starves forever (this pinned every fan-out — `matches:window`, `match:detail:*` — at its Jul 30 snapshot until the 7-day hard TTL). Pace with relative sleeps only (`GateLogic.acquireToken`). The failure is silent: a cancelled `waitUntil` sets no negative marker and reports no outcome, so SWR just keeps serving stale.

## PSD Schema & Transform Rules

- **Audit existing schema declarations before writing a new field.** When adding a field that appears on multiple PSD endpoints, grep `schemas.ts` for the field name first. `competitionType` appears in both `PsdGameBaseFields` (seasons endpoint) and the match detail general schema (match detail endpoint) — they must stay in sync.
- **Null before typeof.** When dispatching on `typeof value` for a nullable union field, always guard `if (val == null)` first — `typeof null === "object"` silently routes null into the object branch (e.g. `null?.type ?? "UNKNOWN"` → literal `"UNKNOWN"`). Pattern: `if (ct == null) return undefined; if (typeof ct === "string") ...; return /* object path */`.
- **Best-effort enrichment fetches run after the mandatory empty/not-found guard.** Any fetch that only enriches the response (e.g. `/teams` for team labels) must be placed after the primary empty-check and wrapped in `Effect.catchAll(() => Effect.succeed(undefined))` — an enrichment failure must never abort the primary response.
- **Status guard before every W/D/L aggregation.** When computing win/draw/loss counts over a match list, explicitly guard `m.status === "finished"` before each increment — scheduled, postponed, and forfeited matches must not count.
- **Schema change + transform change = one commit.** Fixing a schema field (e.g. adding `S.Union(PsdCompetitionType, S.String)`) without simultaneously updating every transform that reads that field creates a broken intermediate state. Both changes belong in the same commit.
- **Club names get `normaliseClubName()` at the emission site, never at decode time** (#2336 — rationale in its JSDoc). Match-side names go through `toMatchTeam`, which normalises by construction; `team_name` on the ranking transform is the one hand-wired site. Consumers must not re-case — the web app owned two local copies and they drifted. `CLUB_ABBREVIATIONS` is a hand-maintained allowlist: add a token when a club is reported wrong, not a name→name exception map.
