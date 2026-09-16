# apps/api — KCVV BFF (Cloudflare Worker)

Effect-based BFF that proxies ProSoccerData (PSD) API calls with Cloudflare KV caching,
implementing `PsdApi` from `@kcvv/api-contract`.

## Structure

```text
src/
├── index.ts                  ← Worker entry point (HttpApiBuilder.toWebHandler)
├── env.ts                    ← WorkerEnv type + WorkerEnvTag (Effect Context)
├── reconciliation.ts         ← reconcileOrphans — shared orphan-reconciliation guard (#2854), used by sync/psd-sanity-sync.ts and search/sanity-index-sync.ts
├── cache/
│   └── kv-cache.ts           ← KvCacheService + TypedKvCache (SWR read path, TTLs, drift alerting) + `durable` ops (TTL-less write, list, dataset scoping) for non-SWR callers (#2873)
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
│   ├── job-alert.ts          ← Scheduled-job failure signal (KV-debounced, independent of IncidentTracker)
│   ├── slack-alert.ts        ← Incident + drift + job-alert Slack payloads (framework-free)
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

| Variable                     | Where set                                     | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PSD_API_BASE_URL`           | `wrangler.toml [vars]`                        | Public, safe to commit                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `FOOTBALISTO_LOGO_CDN_URL`   | `wrangler.toml [vars]`                        | Public, safe to commit                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `PSD_API_KEY`                | `wrangler secret put` / CF dashboard          | Never in toml                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `PSD_API_AUTH`               | `wrangler secret put` / CF dashboard          | Never in toml                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `CACHE_LONG_TTL`             | `wrangler.toml [env.staging.vars]`            | Overrides hardTtl to 365d                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `PSD_API_CLUB`               | `wrangler secret put` / CF dashboard          | Never in toml                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `RESEND_API_KEY`             | `wrangler secret put` / CF dashboard          | Never in toml — see `docs/prd/email-delivery.md`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `SLACK_ALERT_WEBHOOK_URL`    | `wrangler secret put` / CF dashboard          | Never in toml — Slack incoming-webhook for PSD incident/drift alerts (#2329). **Production only** — deliberately unset on staging, where `CACHE_LONG_TTL` makes every key drift by design; absent → alerting no-ops                                                                                                                                                                                                                                                                                                                                                                            |
| `SEARCH_INDEX_NAME`          | `wrangler.toml [vars]` / `[env.staging.vars]` | Public, safe to commit — mirrors the `SEARCH_INDEX` binding's `[[vectorize]].index_name` for the same environment. Wrangler never exposes a binding's target index name to the worker at runtime, so this is the value the webhook's dataset/index guard (`webhooks/index-handler.ts`, #2833) reads instead. Keep it in sync with the `index_name` on the matching `[[vectorize]]` block by hand — nothing else enforces the pairing except the guard's own hardcoded `EXPECTED_INDEX_BY_DATASET` map                                                                                          |
| `SEARCH_INDEX_PRUNE_DRY_RUN` | `wrangler.toml [vars]` / `[env.staging.vars]` | Public, safe to commit — `"false"` since #2857, so the nightly sweep's prune step (`search/sanity-index-sync.ts`, #2831) calls `deleteByIds` for real. It shipped as `"true"`, which logs the ids it would delete instead; the release check on 2026-09-10 found the KV manifest, the live `kcvv-search` index and the current Sanity set all at the same 166 ids, so the delete set was empty and the flip carried no blast radius. Set it back to `"true"` to re-arm dry-run. Anything other than the literal string `"false"` is treated as dry-run — fails safe on a typo or an absent var |

### Releasing a stuck prune safety cap

The sweep refuses to prune (and logs a WARN) when a sweep's delete set exceeds `max(PRUNE_SAFETY_FLOOR, previousManifest.length × PRUNE_SAFETY_CAP_FRACTION)` (`search/sanity-index-sync.ts`) — a truncated fetch and a genuine bulk deactivation look identical from inside the sweep. **This does not self-heal**: the same input recomputes the same refusal every night until something changes. After investigating and confirming the delete set is legitimate (not a truncated/regressed fetch), release it with:

```bash
# Production (SANITY_DATASET=production)
wrangler kv key delete "search-index:manifest:production" --binding=PSD_CACHE

# Staging (SANITY_DATASET=staging)
wrangler kv key delete "search-index:manifest:staging" --binding=PSD_CACHE --env staging
```

This deletes the whole manifest, not just the over-cap entries — the next sweep bootstraps fresh (prunes nothing, just re-learns the current state) rather than resuming a partial one. Safe: nothing in the manifest is unrecoverable except the pre-existing backlog this mechanism could never see anyway (see #2831's PR description).

### The search-index manifest's ADD side is owned by `VectorizeServiceLive`; the array itself stays the sweep's alone (#2855)

The manifest (`index-manifest.ts`) is a single KV array, `search-index:manifest:{dataset}`, of ids the index is believed to hold. It has exactly **one** writer of that array: the nightly sweep (`search/sanity-index-sync.ts`). That was already true before #2855 and remains true after it — this is deliberate, not an oversight, because Workers KV cannot support a second writer safely (see "Why not a read-modify-write" below).

What #2855 changed is who is responsible for _getting an id to the sweep_ in the first place:

- **Adding an id is now structural.** `VectorizeServiceLive.upsert` (`search/vectorize.ts`) records every successfully upserted id as a put-only pending marker (`index-manifest.ts`'s `addToManifest`/`listPendingIds`) as an internal side effect — a caller cannot upsert through this service without a marker following. Previously only the webhook remembered to make this call itself; now every caller (the webhook, and the nightly sweep's own upsert phases) gets it for free, and a future third caller inherits it automatically too.
- **The nightly sweep still absorbs those markers into the array**, exactly as before: it lists every pending marker (`listPendingIds`), folds them into `previousManifest` before diffing against its freshly-fetched current ids, writes the merged array back once (`writeManifest`, the array's single write per sweep), and deletes the marker keys it just absorbed. This is why a document whose entire visible life fits between two sweeps (published and unpublished the same day) still gets pruned — the webhook's marker registers it even though no sweep ever saw it as "current."
- **Deleting an id is NOT symmetric, on purpose.** `VectorizeServiceLive.deleteByIds` does not touch the manifest or any marker at all. Pre-#2855, a webhook delete never updated the manifest either — the array only ever drops an id via the sweep's own confirmed-delete reconciliation (`reconcileOrphans` + `deleteBatched`'s returned _confirmed_ subset), and that was already the manifest's only removal path with nothing to consolidate. Mirroring the add side with a parallel "pending delete" marker would be new complexity #2855 was never asked to build — the issue's own text explicitly frames "manifest growth" (a deleted id lingering one extra sweep) as **not a bug**: the next sweep's `deleteByIds` call for an already-absent id is a documented no-op, and the manifest converges within that one sweep regardless of which side deletes registered on.

**Why not a read-modify-write on the array itself, from the service.** An earlier version of this change moved BOTH the add and the confirmed-delete bookkeeping into `VectorizeServiceLive`, replacing the per-id marker with a `readManifest` → `writeManifest` pair called directly from `upsert`/`deleteByIds`. This does not work on Workers KV: `get` is served from a colo cache and is documented as taking up to **60 seconds** to reflect a preceding `put` (not read-your-writes), and a single key is throttled to roughly **1 write/second**. A sweep's own phases alone call this at least four times (once per upsert batch, once per delete chunk) — the article phase's read can return the pre-responsibility-phase value and clobber it, and a concurrent webhook racing either one loses the same way. That is precisely the #2856 defect the original put-only marker design exists to prevent by construction (no shared read, so nothing to race on) — read-modify-write reintroduces it. Keep the marker.

Manifest keys — and marker keys — stay dataset-scoped exactly as before (`manifestKey(dataset)` / `pendingKey(dataset, id)`, both keyed off `env.SANITY_DATASET`), so a staging worker and a production worker sharing one `PSD_CACHE` namespace never touch each other's state. Getting this scoping wrong is exactly what #2833 was about.

**Known, accepted trade-off:** the marker write now happens inside `VectorizeService.upsert`'s own Effect, awaited by the webhook before it responds (a single KV `put`, retried on a transient failure) — pre-#2855 the webhook deferred this same write via `ctx.waitUntil` so it couldn't add latency to the response. Restoring that deferral would require either leaking Cloudflare's `ExecutionContext` into `VectorizeService`'s general interface (which the sweep's scheduled invocation has no use for and shouldn't need to satisfy), or building a background-runner seam generalized beyond the PSD-specific one that already exists (`psd/background.ts`). Neither was judged worth it for a single low-latency put; flagged here for a human to weigh in on if it matters in practice.

### The shared orphan-reconciliation guard (`reconciliation.ts`, #2854)

`reconcileOrphans` (`src/reconciliation.ts`) is the one shared implementation of the four-step orphan-reconciliation pattern both sync jobs need: diff the tracked set against the current set, handle the none-case, apply a ratio-based safety cap before acting, then act (calling a caller-supplied archive/delete function and returning the **confirmed** removed subset — not merely a completion signal, since a caller like the search-index sweep needs to know exactly what landed before touching its own manifest).

Every call passes a config object with a **required** `releaseLeverHint` — the pointer an operator sees in the cap-refusal WARN telling them where THIS caller's release lever lives. It's required, not defaulted, on purpose: the two callers have different levers documented in different sections below, and a shared default previously pointed every refusal at the search-index-only manifest-delete lever, which would tell an operator investigating a PSD refusal to delete the search-index manifest instead (#2854 review). `logPrefix` (optional, default `""`) is prepended to every log line the call emits, so a log query scoped to a caller's own prefix (e.g. `[search-sync]`) still finds its reconciliation outcome, refusal included.

- **`sync/psd-sanity-sync.ts`**'s `reconcileEntity` is a thin adapter over it — same public signature as before this refactor, still used by its three cycle-end callers (players, staff, teams). It always passes `floor: 0` (the default), which reproduces the pre-refactor bare-ratio behaviour (`ratio > MAX_ORPHAN_RATIO`) exactly — see the latching note below for why this means PSD sync's latching behaviour is unchanged, not fixed.
- **`search/sanity-index-sync.ts`**'s manifest-diff prune calls it directly, passing its existing `PRUNE_SAFETY_CAP_FRACTION`, `PRUNE_SAFETY_FLOOR`, and `logPrefix: "[search-sync] "` — unchanged from before this refactor except for the prefix, which restores what a log query scoped to `[search-sync]` used to see. The excluded-ids deletes (stateless, authoritative) are **not** routed through this helper — they're scoped independently and must never be subject to the manifest-diff's cap (see the block comment above the call site). Before deleting, they're also filtered against whatever the manifest-diff call just confirmed removed, so an id that is simultaneously a manifest orphan and an excluded id is not sent to `deleteByIds` twice in the same sweep and does not get double-counted across the two "Pruned N" log lines.

**A floor-less ratio latches.** A bare `ratio > threshold` check with no floor refuses forever once tripped against a small tracked set: the same input recomputes the same refusal every run, with no state change and no release lever, until something external changes the underlying data.

**This is NOT fixed for PSD sync by the refactor itself.** `reconcileEntity`'s three production callers pass `floor: 0` — the compatibility guarantee — so `max(0, activeCount × ratioThreshold)` is mathematically identical to the bare ratio check they always had. PSD sync's latching behaviour is **unchanged**: a genuinely stuck cap still recomputes the same refusal every cycle. What #2854 actually gives PSD sync is not immunity to latching but a **manual lever to break it** — the one-shot override key below — where before there was no documented way to clear a stuck refusal at all. Do not read "the shared helper supports a floor" as "PSD sync's small id sets are now protected"; they aren't, by design (see the AC in #2854: the three callers must behave identically to today).

### Releasing a stuck PSD sync orphan-cap refusal

Unlike the search-index prune, PSD sync's cap isn't evaluated against a persisted manifest — it's recomputed fresh every rotation cycle from the current Sanity-active ids and the freshly-accumulated PSD ids, so there's no stored state to delete. The release lever is a one-shot KV bypass key instead, **scoped to a single entity type per use** — an operator who investigated and confirmed a genuine `players` refusal has verified nothing about that same cycle's staff or team fetch, so a blanket bypass would also wave through an unrelated, uninvestigated refusal. The key is read and deleted **upfront**, before any reconciliation leg runs, so it is always consumed on observation — whether or not the leg it was meant for actually runs that cycle (e.g. a failed club-wide staff fetch skips staff reconciliation entirely; a staff-scoped override set for that cycle is still consumed and must be re-armed).

Value is a comma-separated list of `players`, `staff`, `teams`, or the literal `all` (`1` also works, as a quick blanket override):

```bash
# Release a players-only refusal (production; SANITY_DATASET=production)
wrangler kv key put "sync:orphan-cap-override" "players" --binding=PSD_CACHE

# Release every entity type at once (staging; SANITY_DATASET=staging)
wrangler kv key put "sync:orphan-cap-override" "all" --binding=PSD_CACHE --env staging
```

Only set this after confirming the refusal is a false positive (a genuine mass roster change, not a truncated/regressed PSD fetch) — see the WARN log `reconciliation: SKIPPED — …` for the counts that tripped it, and `reconciliation: orphan-cap override consumed — …` for confirmation of what the key actually bypassed.

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

### `KvCacheService` owns KV, in full (#2873)

Every KV access in this worker goes through `KvCacheService` — there are no
callers left that reach `env.PSD_CACHE` directly. The interface has two
halves with deliberately different error contracts:

- **The SWR read path** — `get`/`set`/`delete`/`increment` — swallows every
  KV failure to `null`/`undefined`, on purpose: a cache blip must never
  break a read. This is what `TypedKvCache` (below) uses.
- **`durable`** — `get`/`set`/`setForever`/`delete`/`list`/`forDataset` —
  surfaces every failure as a `KvError` instead. This exists for callers
  where "unreadable" must never be silently reinterpreted as "absent" or
  "empty": `sync/psd-sanity-sync.ts` (`runSync`'s cursor, per-team
  checkpoint, and per-cycle id accumulation — several of these
  deliberately fail the whole sync on a KV error, others log and continue,
  matching each key's original behaviour) and `search/index-manifest.ts`
  (`readManifest` must fail rather than resolve `[]` on a KV blip, or the
  nightly search-index sweep would read that as "nothing tracked" and
  prune everything — #2831). `setForever` is the TTL-less write the SWR
  `set` couldn't express — `runSync`'s rotation cursor needs one: a TTL
  there would let it expire and silently restart the whole team rotation.
  `forDataset(dataset)` scopes `get`/`set`/`setForever`/`delete`/`list` to
  one Sanity dataset, obtained once per call site instead of a `dataset:
string` argument repeated on every individual call — `search/index-manifest.ts`'s
  five functions take the scoped handle and read `.dataset` off it, so one
  function body can no longer build one key against one dataset and
  another against a different one by accident (the #2833 failure class).

Before #2873, three modules bypassed the port entirely because it had no
TTL-less write, no `list`, and no dataset-scoping concept — `sync/psd-sanity-sync.ts`
(11+ raw calls), `search/index-manifest.ts` (five exported functions taking
`kv: KVNamespace` as a parameter), and their call sites in
`search/sanity-index-sync.ts` and `search/vectorize.ts`. All of them now go
through `KvCacheService.durable`.

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
- **Every PSD call takes a gate token — the scheduled paths too, not just the request path.** Both PSD clients (`psd/service.ts` for reads, `sync/psd-team-client.ts` for the nightly sync) open `countedFetch` with `gate.acquireToken`, and every layer that provides either one must also provide `PsdGateLive`. The sync shipped without it (#2867): its fan-out runs members+staff at concurrency 2 over pages at concurrency 3, so ~6 calls sat outside the ≤5/s worldwide budget. This is now enforced by the type system — dropping `PsdGateLive` from a layer that builds `PsdTeamClientLive` fails `type-check` — so a new PSD client only needs the same `acquireToken` opening to inherit the guarantee.
- **A gate token is pacing, not observability — PSD incident alerting still does not cover the scheduled paths, by design.** `gate.reportOutcome` (the call that opens/closes a PSD incident and fires the Slack ping from #2329) is invoked from the `TypedKvCache` refresh path in `cache/kv-cache.ts` and nowhere else. The nightly sync's PSD-fetch layer (`sync/psd-team-client.ts`) touches `KvCacheService` only for `increment()`; `sync/psd-sanity-sync.ts`'s `runSync` itself goes through `KvCacheService.durable` for its cursor/checkpoint/accumulation state (#2873). Neither touchpoint ever calls `reportOutcome`, so the nightly sync never reaches one, and this is intentional: the read path reads `incidentOpen` back to escalate its serve-stale logs `WARN→ERROR`, so routing a scheduled-job failure through `reportOutcome` would make request-path logs shout — and fire a "PSD outage started" Slack ping — while the site serves visitors from cache perfectly fine. A sync failing at 02:00 is not the same event as PSD being down for visitors, and `IncidentTracker` must never model it. **Decided in #2870 (Option B over Option A):** Option A (routing scheduled-job failures through `reportOutcome`) was rejected for exactly that read-path blast radius, and it could not have covered the `30 2 * * *` search-index cron anyway — its failures are Workers AI / Vectorize / Sanity, not PSD, so there is no PSD incident for it to open. Instead, `psd/job-alert.ts` runs a second, parallel state machine — `reportScheduledJobOutcome` — that never imports `psd/incident.ts` or `psd/gate.ts`. It persists a per-job state in KV (`job-alert:{job}`, shaped like the drift nudge's `nudge:{key}` marker) and debounces the same way `IncidentTracker` does: alert on the first failure after healthy and keep retrying on every subsequent failure until Slack actually confirms delivery (`postSlack` now returns whether the POST landed, not just whether it was attempted — a dropped webhook POST used to debounce a whole outage into announcing it zero times, not once), then stay silent for the rest of that streak; alert once on the first recovery after ≥1 failures (best-effort — a dropped recovery POST still resets the streak, since losing one "recovered" ping is far less costly than losing the outage ping). `psd/slack-alert.ts` gained a third message builder, `buildJobAlertMessage` (alongside `buildIncidentMessage` and `buildDriftMessage`), reusing the same `postSlack`. Both `scheduled()` branches in `index.ts` call `reportScheduledJobOutcome("psd-sanity-sync", …)` / `reportScheduledJobOutcome("sanity-index-sync", …)` strictly after their sync work settles (never inside its own `try`, so a reporting hiccup can't be mistaken for — or falsely alert — a sync failure, and never before the `0 2 * * *` branch's wall-clock log, so the report's own KV/Slack I/O doesn't inflate the number #2900 measures against the Cron Trigger ceiling) — additive to the existing `console.error`, not a replacement.
  - **`runSanityIndexSync` degrades every embedding/upsert failure internally** (`embedDoc`, `upsertBatched`, `deleteBatched` in `search/sanity-index-sync.ts` each `catchAll` and log-and-skip, so one bad document never aborts the sweep), which used to mean the whole function resolved successfully even when Workers AI or Vectorize rejected every single call — the job-alert signal would have called that run healthy. It now fails (and the job-alert signal sees it) only on the unambiguous bar: there was content to index and **none** of it landed across all three phases combined (responsibility paths + articles + pages). A partial failure — some documents land, others don't — still resolves successfully and stays a WARN/ERROR log, not a job failure; that's a deliberate, narrower bar than "any degradation", not an oversight.
  - **Known remaining gap, not built here:** if the `0 2 * * *` invocation is killed at the 15-minute Cron Trigger wall-clock ceiling (the #2900 failure mode this job is designed around), neither the `catch` nor the post-sync report ever runs — no alert fires, and a counter already at "failing" from an earlier night stays there silently forever. Catching that needs a heartbeat / dead-man's-switch (write "started" on entry, clear on success) — a different mechanism, out of scope for #2870.
- **Never rate-limit off `Date.now()` inside the `PsdGate` Durable Object.** A DO advances its clock only on I/O, so while every caller is sleeping inside the gate no time passes: a wall-clock token bucket accrues nothing and starves forever (this pinned every fan-out — `matches:window`, `match:detail:*` — at its Jul 30 snapshot until the 7-day hard TTL). Pace with relative sleeps only (`GateLogic.acquireToken`). The failure is silent: a cancelled `waitUntil` sets no negative marker and reports no outcome, so SWR just keeps serving stale.

## PSD Schema & Transform Rules

- **Audit existing schema declarations before writing a new field.** When adding a field that appears on multiple PSD endpoints, grep `schemas.ts` for the field name first. `competitionType` appears in both `PsdGameBaseFields` (seasons endpoint) and the match detail general schema (match detail endpoint) — they must stay in sync.
- **Null before typeof.** When dispatching on `typeof value` for a nullable union field, always guard `if (val == null)` first — `typeof null === "object"` silently routes null into the object branch (e.g. `null?.type ?? "UNKNOWN"` → literal `"UNKNOWN"`). Pattern: `if (ct == null) return undefined; if (typeof ct === "string") ...; return /* object path */`.
- **Best-effort enrichment fetches run after the mandatory empty/not-found guard.** Any fetch that only enriches the response (e.g. `/teams` for team labels) must be placed after the primary empty-check and wrapped in `Effect.catchAll(() => Effect.succeed(undefined))` — an enrichment failure must never abort the primary response.
- **Status guard before every W/D/L aggregation.** When computing win/draw/loss counts over a match list, explicitly guard `m.status === "finished"` before each increment — scheduled, postponed, and forfeited matches must not count.
- **Schema change + transform change = one commit.** Fixing a schema field (e.g. adding `S.Union(PsdCompetitionType, S.String)`) without simultaneously updating every transform that reads that field creates a broken intermediate state. Both changes belong in the same commit.
- **Club names get `normaliseClubName()` at the emission site, never at decode time** (#2336 — rationale in its JSDoc). Match-side names go through `toMatchTeam`, which normalises by construction; `team_name` on the ranking transform is the one hand-wired site. Consumers must not re-case — the web app owned two local copies and they drifted. `CLUB_ABBREVIATIONS` is a hand-maintained allowlist: add a token when a club is reported wrong, not a name→name exception map.
