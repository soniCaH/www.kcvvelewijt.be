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
    └── staff-gaps-check.ts   ← weekly Slack nudge for staff/coordinator gaps (#3561)
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
| `PSD_ONDEMAND_DAILY_BUDGET`  | `wrangler.toml [vars]` / `[env.staging.vars]` | `"600"` — PSD calls per UTC day after which a cold miss fails fast; see "Ceilings inside the worker" (#3468). Unset → no budget; `"0"` → every cold miss refused (kill switch)                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `CACHE_LONG_TTL`             | `wrangler.toml [env.staging.vars]`            | Overrides hardTtl to 365d                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `PSD_API_CLUB`               | `wrangler secret put` / CF dashboard          | Never in toml                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `RESEND_API_KEY`             | `wrangler secret put` / CF dashboard          | Never in toml — see `docs/prd/email-delivery.md`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `SLACK_ALERT_WEBHOOK_URL`    | `wrangler secret put` / CF dashboard          | Never in toml — Slack incoming-webhook for PSD incident/drift alerts (#2329). **Production only** — deliberately unset on staging, where `CACHE_LONG_TTL` makes every key drift by design; absent → alerting no-ops                                                                                                                                                                                                                                                                                                                                                                            |
| `SEARCH_INDEX_NAME`          | `wrangler.toml [vars]` / `[env.staging.vars]` | Public, safe to commit — mirrors the `SEARCH_INDEX` binding's `[[vectorize]].index_name` for the same environment. Wrangler never exposes a binding's target index name to the worker at runtime, so this is the value the webhook's dataset/index guard (`webhooks/index-handler.ts`, #2833) reads instead. Keep it in sync with the `index_name` on the matching `[[vectorize]]` block by hand — nothing else enforces the pairing except the guard's own hardcoded `EXPECTED_INDEX_BY_DATASET` map                                                                                          |
| `SEARCH_INDEX_PRUNE_DRY_RUN` | `wrangler.toml [vars]` / `[env.staging.vars]` | Public, safe to commit — `"false"` since #2857, so the nightly sweep's prune step (`search/sanity-index-sync.ts`, #2831) calls `deleteByIds` for real. It shipped as `"true"`, which logs the ids it would delete instead; the release check on 2026-09-10 found the KV manifest, the live `kcvv-search` index and the current Sanity set all at the same 166 ids, so the delete set was empty and the flip carried no blast radius. Set it back to `"true"` to re-arm dry-run. Anything other than the literal string `"false"` is treated as dry-run — fails safe on a typo or an absent var |

### Releasing a stuck prune safety cap

The sweep refuses to prune (and logs a WARN) when a sweep's delete set exceeds `max(PRUNE_SAFETY_FLOOR, previousManifest.length × PRUNE_SAFETY_CAP_FRACTION)` (`search/sanity-index-sync.ts`) — a truncated fetch and a genuine bulk deactivation look identical from inside the sweep. **This does not self-heal**: the same input recomputes the same refusal every night until something changes.

**The Sanity dashboard webhook's GROQ filter must list every type `ALLOWED_TYPES` accepts** (`webhooks/index-handler.ts`: `responsibility`, `article`, `page`, `photoGallery`, #3338). The filter lives in the Sanity project, not in this repo — without `photoGallery` in it a gallery save never reaches the handler, and only the nightly sweep indexes it.

**The refusal alerts (#2855).** A cap refusal — or a prune that ran but had every delete rejected by Vectorize after retries — now reports a failed outcome through `reportScheduledJobOutcome` (`psd/job-alert.ts`) under its own job name, `search-index-prune` — separate from `sanity-index-sync`, because the sweep itself still succeeded (it did index) and conflating the two would mark a healthy indexing run as failed.

`runSanityIndexSync()` resolves with a tri-plus-state `prunePhase` (`search/sanity-index-sync.ts`), not a boolean: `"not-run"` (reconciliation was skipped wholesale this sweep — a degraded fetch or a failed manifest read; the cap may still be latched from a prior night and this sweep proves nothing about it), `"refused"` (the safety cap tripped — carries the orphan/active counts and the ratio, so the alert message conveys magnitude instead of a fixed string), `"zero-confirmed"` (the delete ran, wasn't refused, but Vectorize confirmed 0 deletes — the index still holds every id it should have pruned), or `"ok"` (nothing to prune, or a prune that landed). `index.ts`'s `scheduled()` handler maps that through `pruneJobOutcome` (`search/prune-outcome.ts`) and reports it strictly after the sweep settles, the same way it reports `sanity-index-sync` itself.

**A `"not-run"` sweep reports nothing at all — not a recovery, not a failure.** This is the one behavior worth being explicit about: a degraded-fetch sweep (e.g. the Sanity 503 class the owner decision cited, 2026-09-18 run 35318911017) resolves successfully and skips reconciliation, but that says nothing about whether a prior refusal released. Reporting `ok: true` there would fire a false "recovered" Slack ping and clear the debounce streak while the cap stays latched — the next sweep would then refuse again, alert-flapping on the one signal this issue exists to make trustworthy. The same "report nothing" rule covers an outright sweep failure (`sanity-index-sync`'s own failure report already covers that, and whether the prune step even ran is unknown). Only `"refused"`, `"zero-confirmed"`, and `"ok"` are ever reported — so the release lever below is something you're told to act on, not something you have to discover by reading logs, and a green "recovered" ping means the prune genuinely ran clean, not merely that the sweep didn't crash.

After investigating and confirming the delete set is legitimate (not a truncated/regressed fetch), release it with:

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

### PSD sync rotation, cycle-end guard and manual runs (#3465)

`runSync` indexes the cursor into PSD's team list **sorted by numeric id**, not in response order, so PSD reordering or dropping a team no longer skips an existing team (the one skipped team and its players used to be archived at cycle end, under the 0.3 orphan cap). The first cycle after the sort shipped may be incomplete; the guard below covers it.

- **Cycle-end guard.** A team is archived only when it is in neither the team accumulator nor this run's live `getRawTeams()` ids. If any live team id is missing from the team accumulator the cycle is **incomplete**: player and staff reconciliation are skipped (WARN `cycle INCOMPLETE`), the accumulators are still cleared.
- **Zero roster.** PSD returns 0 players for a team Sanity lists players for (`SanityProjection.getTeamPlayerPsdIds`): no `upsertTeam`, the team and its existing player ids are accumulated, and `sync:empty-roster:<teamId>` is written. A second consecutive empty roster is trusted (`players: []`, marker deleted); a non-empty roster deletes the marker. Never "don't accumulate" — that turns player reconciliation off.
- **Member isolation.** Each member's upsert and image sync is isolated. The team is still written, the cursor still advances, then the run **fails** naming the failed psd ids (`SyncIncompleteError`), because `reportScheduledJobOutcome` only sees ok/fail. A failed member with no doc yet is left out of the team's strong `players`/`staff` references but stays in the accumulator. A `getRawMembers`/`getRawStaff` failure advances the cursor without accumulating the team, then fails. A cursor write that fails at cycle end fails the run (mid-cycle it is still only logged).
- **Manual runs.** `SYNC_MANUAL_RUN=1` (`WorkerEnv`, set by `scripts/trigger-psd-sync.sh` through `wrangler dev --var`; never in `wrangler.toml`) skips cycle-end reconciliation and every accumulator and marker write/clear. The cursor still moves. The script's index is a position in id-sorted order, and its `--preview` KV is staging's real namespace (`preview_id` equals the staging `id`).

### PSD portraits and personal data (#3469)

The sync owns `psdImage` + `psdImageUrl` on `player` and `staffMember` documents, so it also removes them.

- **No portrait in PSD → none on the site.** `syncMemberImage` calls `SanityMutation.unsetPlayerImage` / `unsetStaffImage` when PSD has no `profilePictureURL` **and** the stored `psdImageUrl` is set; otherwise it is a no-op, so documents that never had a portrait are not patched nightly. The PSD placeholder (`PSD_PLACEHOLDER_IMAGE_SHA1`, #1895) counts as "no portrait": `uploadMemberImage` calls the same unset when the downloaded bytes match it. A failed unset returns `false` from `syncMemberImage`, so the member is not checkpointed and retries.
- **Superseded assets are deleted.** After an unset, or after a re-upload that landed a different asset, the previous asset is deleted only when `count(*[references($assetId)]) == 0` (`deleteAssetIfUnreferenced`). The just-uploaded asset is never a candidate (Sanity dedups identical bytes to one id). A failed delete is logged (`logWarning`) and never fails the member's sync; `scripts/sanity-ops` `psd-privacy:cleanup` sweeps what is left.
- **Portrait downloads take a gate token.** `uploadMemberImage` runs `gate.acquireToken` before the PSD `fetch`, like both PSD clients. `SanityMutationLive` therefore requires `PsdGateService`: every layer that builds it must provide `PsdGateLive` (in `buildAppLayer` it sits below `SanityMutationLive` for that reason). Type-check fails if one does not.
- **Staff birth dates are not stored.** `transformStaff` emits no `birthDate` and `staffMember` has no such field. Player `birthDate` is unchanged: `PlayerHero` needs the full date for an exact age (owner decision, 2026-10-15). The `production` dataset has been private since 2026-10-14.

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

## Weekly staff-gaps nudge (#3561)

Cron `0 6 * * 1` (Monday 06:00 UTC, production only — staging keeps `crons = []`) runs `runStaffGapsCheck` (`sync/staff-gaps-check.ts`) from its own `scheduled()` branch, never inside the `0 2 * * *` sync and its 15-minute ceiling. One GROQ read, `SanityProjection.getStaffGaps()`, returns three groups, and `buildStaffGapsMessage` (`psd/slack-alert.ts`) turns them into one Slack message with a count per group and a Studio link per item:

- **Staff without a role** — a `team.staff[]` entry with an **empty** role on a non-archived team with a `psdId`. `andere` is a real answer and is never reported; empty means "not done yet" (#3560).
- **Staff without a photo** — a `staffMember` on those teams with neither `photo` nor `psdImage`.
- **Coordinator positions not filled** — an `organigramNode` with roleCode `TVJO`, `JC-OB`, `JC-MB` or `JC-BB` that is not `active == true` or has no member.

Nothing to report → no message. `SLACK_ALERT_WEBHOOK_URL` unset → the job returns before the read. A failed read, or a Slack POST that is not confirmed, fails the run, which reports through `reportScheduledJobOutcome` under the job name **`staff-gaps-check`** — never through `gate.reportOutcome`. Its job-alert state TTL is the shared 3 days, shorter than the weekly interval, so a failure alerts every week it recurs instead of once per streak.

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

Every request reaches the worker through the website, and the website is a
door for every visitor. These ceilings bound what a script can spend.

### `/search` (`handlers/search.ts`, `search/ai-answer.ts`)

In request order:

1. **`SEARCH_IP_LIMITER`** — `[[ratelimits]]`, 10 requests / 60 s, key
   `ip:{x-kcvv-client-ip}` (`ip:unknown` without the header). Runs before
   the cache, so a cached query still counts. The Next route
   (`apps/web/src/app/api/search/route.ts`) sends `x-kcvv-client-ip`
   (`CLIENT_IP_HEADER`) from the first `x-vercel-forwarded-for` value, else
   `x-real-ip`. The worker trusts it only because the BFF key proves the
   caller is the Next server.
2. **Response cache** — the whole `SearchResponse`, `answer` included, for
   `TTL.SEARCH` (1 h) under `search:v1:{type ?? "all"}:{limit}:{sha256(q)}`,
   where `q` is the query trimmed, lowercased, whitespace collapsed, and the
   SHA-256 is hex — so a query of any length fits KV's 512-byte key limit. A
   hit makes no Embedding, Vectorize or AI call. Plain `KvCacheService`
   get/set, no SWR: an entry expires, it is never refreshed in the
   background. A response is stored only when no answer was asked for (top
   score under `LLM_SCORE_THRESHOLD`) or an answer came back; one whose answer
   was dropped (daily cap, LLM failure or timeout) is not, so the next search
   can still get one.
3. **`SEARCH_GLOBAL_LIMITER`** — `[[ratelimits]]`, 120 / 60 s, key `global`.
   Runs on a cache miss only.
4. **AI daily cap** — `AiAnswerServiceLive` reads KV counter
   `ai:answers:{YYYY-MM-DD UTC}` (2-day expiry) before `ai.run`, and adds one
   after a successful answer. At or over `AI_ANSWER_DAILY_CAP` the answer is
   skipped: `/search` returns `results` with no `answer`, and one
   `Effect.logError` per day (`ai:answers:capped:{day}` marker). Approximate
   — KV is not atomic — which is fine for a ceiling. The answer call also
   passes `max_tokens: 256`.

Either limit hit → `429` (`HttpTooManyRequests`), body error
`Too many searches, try again in a minute`, no AI call. A limiter binding
that throws fails **open** (logged): search stays up and the AI cap is the
backstop. A search failure is `503` with the fixed text
`Search service unavailable`; the real message goes to `Effect.logError` only.

**Namespace ids are account-wide** and both workers share one account:
production uses `1001`/`1002`, staging `2001`/`2002`. Named envs do not
inherit `[[ratelimits]]`, so both blocks are declared twice
(`webhooks/wrangler-config.test.ts` pins this).

### PSD (`cache/kv-cache.ts`, `psd/service.ts`)

- **Not-found cache.** In `TypedKvCache.getOrFetch`, a cold miss that fails
  with `ResourceNotFoundError` stores a marker `{ notFound: {...} }` under the
  same key for `NOT_FOUND_TTL` (1 h). A hit on the marker fails with the same
  error and makes no PSD call. Every other error stays uncached. Each id-keyed
  route ends cached on an unknown id (`psd/unknown-id-ceilings.test.ts`):
  `/matches/:teamId` (PSD answers `200 []` → cached empty),
  `/match/:matchId/detail` and `/statistics/player/:memberId` (empty `200`
  body → `emptyBodyIsNotFound` → marker), `/ranking/:teamId` (PSD `404` →
  marker) and `/matches/opponent/:teamId/:clubId` (no matches → marker).
- **`/seasons`** is cached for `TTL.SEASONS` (24 h) under `psd:seasons`
  (`getAllSeasons`). Opponent lookups and `getCurrentSeason` read it.
- **On-demand daily budget.** Before a psdBacked cold miss fetches,
  `getOrFetch` reads today's PSD-call count from the `PsdGate` Durable Object
  (`gate.getDailyCount`, #3490). At or
  over `PSD_ONDEMAND_DAILY_BUDGET` it fails fast with
  `UpstreamUnavailableError` and makes no PSD call. A key with a value — even
  a stale one — still serves it, and its background refresh still runs. The
  nightly sync never comes through `getOrFetch`, so it always runs. The
  count is one per `gate.acquireToken` grant — every PSD call (sync and
  portrait downloads included) takes a token first, so the cron's calls count
  toward the day. A DO failure reads `0` (fail-open: the budget never refuses
  on a gate hiccup). One Slack alert per UTC day (`psd:budget-alert:{day}`,
  `buildPsdBudgetMessage`) through `SLACK_ALERT_WEBHOOK_URL`, plus an
  `Effect.logError` per refusal.
- **Where the daily count lives (#3490).** In the `PsdGate` Durable Object, in
  `ctx.storage` under `daily-count` (`{ day: "YYYY-MM-DD" (UTC), count }`),
  so it survives eviction and restart. `GateLogic.acquireToken` bumps it at
  every grant, atomically (one DO, no await between read and write); a new UTC
  day starts at 0. Read it with `gate.getDailyCount` (`PsdGate.getDailyCount()`
  over RPC) — read-only, takes no token. The budget check is deliberately
  **not** inside `acquireToken`: that would block the nightly sync and the
  background refresh, which must always run. There is no `record(n)`: every PSD
  call — read path, sync, portrait download — takes a token first, so the
  grant is the count. Add a PSD call site without `acquireToken` and it goes
  uncounted. The old KV key `psd:calls:YYYY-MM-DD` (a non-atomic
  get/+1/put that lost increments) is gone; leftovers expire on their own.
- **How the budget was chosen.** The rule: the peak of the last 14 days of
  daily PSD calls × 1.5, rounded up to the next 50, never above 1 000 (half of
  PSD's shared 2 000/day). The DO keeps **today only**, so no 14-day history
  exists — the value is the ticket's no-history default, **600**. To
  re-measure, persist one count per day first.

### `/related` (`handlers/related.ts`)

The `id` must match `/^[A-Za-z0-9._-]{1,128}$/` (`packages/api-contract`,
`api/related.ts`); anything else is a `400`. An empty `[]` result is returned
but never stored; a non-empty result keeps `TTL.RELATED`.

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

Every KV access in this worker goes through `KvCacheService` — there are no
callers left that reach `env.PSD_CACHE` directly. The interface has two
halves with deliberately different error contracts:

- **The SWR read path** — `get`/`set`/`delete` — swallows every
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

Values are stored as `{ value, fetchedAt, partial? }` wrappers. On deploy, existing cache entries without the wrapper trigger a one-time cold start.

### Drift observability (#2335)

A background (SWR) refresh runs in `waitUntil`, which Cloudflare cancels ~30 s after the invocation ends. A **killed** refresh — unlike a **failed** one — runs none of its handlers: no negative marker, no incident report, no drift nudge. The value then drifts toward the 7-day hard-expiry cliff behind a clean `200` and a clean log. Two guards close that gap:

- **`BG_REFRESH_TIMEOUT_MS` (12 s)** bounds the background refresh fetch so a slow one takes the normal failure path (negative marker + escalating log) instead of being killed. **The binding ceiling is `GateLogic.leaseMs` (15 s), not the `waitUntil` budget** — a refresh that outruns the lease loses single-flight, so the next reader forks a second full fan-out under exactly the load that made the first one slow, (its `endFlight` carries the owner token `beginFlight` returned, so a lapsed leader can no longer end the newer leader's flight, #3467). A unit test pins `BG_REFRESH_TIMEOUT_MS < 15 s`; keep them coupled. `getOrFetch`'s `backgroundTimeoutMs` option exists so tests can drive it with a small value — no production caller overrides it. A timed-out refresh deliberately does **not** call `gate.reportOutcome` — a slow fan-out under load is not proof PSD is down, and reporting it would open spurious outage pings. Note the timeout abandons the fan-out but does not cancel it: the in-flight PSD calls keep running until each finishes or hits its own 8 s abort (below).
- **A read-path drift check** evaluates stale age on every stale serve, before the negative-marker early-return, so a key whose marker keeps being re-set still surfaces. It is the only signal that does not depend on a refresh path executing at all.

There is **no blocking refresh** (#3467). A stale read always serves the stale value and runs the single-flight, `BG_REFRESH_TIMEOUT_MS`-bounded refresh — through the runner, or inline when none is wired (tests only). The former "block on a past-kickoff stale value" option and its unguarded foreground refresh are gone: with N concurrent stale reads after a kickoff they ran N unguarded foreground fan-outs (~19 PSD calls each) behind the 5/s gate. The cold-miss leader is capped as a whole too: `MISS_FETCH_TIMEOUT_MS` (12 s, `fetchTimeoutMs` in tests, pinned `< 15 s`) fails the read with `UpstreamUnavailable`, releases the flight and reports nothing to the gate. `gate.beginFlight` returns an owner token (`null` = follower) and `endFlight(key, token)` is a no-op for any other token.

**PSD fetches are bounded and partial fan-outs are cached briefly (#3489).** `fetchJson` (`psd/service.ts`) passes `signal: AbortSignal.timeout(8000)` — one signal for the request and its body read — so a hung PSD call fails with `UpstreamUnavailable` (stale-servable) after 8 s instead of holding its caller. An abort that lands while the body streams is mapped to `UpstreamUnavailable` too, never to a decode error. The match-team index build (`getMatchTeamIndex`, ~21 calls) runs under a gate flight on `flight:match-team-index`: one caller builds, the rest `awaitFlight` and re-read the cache, so N concurrent callers on an expired index cost one build. A fan-out where at least one team (or, for opponent history, one season) failed still returns what loaded, but `getNextMatches`, `getMatchesWindow` and a non-empty `getOpponentHistory` tag it with `markPartial`; the handler passes `isPartial: isPartialFanout` to `getOrFetch`, which stores `partial: true` in the wrapper and treats the entry as stale after `TTL.PARTIAL_FANOUT` (5 min) instead of its full soft TTL. The tag is by object identity (a `WeakSet`), read right after the fetch, so the values stay plain contract types. A complete fan-out keeps its TTL; an all-failed one still fails.

**Drift is measured as time past the soft TTL, not absolute age**: `staleForMs = (now − fetchedAt) − softTtl`, compared against `DRIFT_NUDGE_THRESHOLD` (24 h) — "this key has failed to refresh for a day". An absolute rule would fire the instant a healthy 24 h-softTtl key (`matches:team:{id}`, `ranking:team:{id}`) goes stale on a perfectly normal refresh cycle. The same rule governs `keepStale`'s WARN→ERROR escalation. Slack still reports **absolute** age + time-to-cliff.

While drifting: `ERROR` on every stale serve (the `wrangler tail` trace), Slack nudge once per day per key (`nudge:{key}`, `NUDGE_MARKER_TTL`). The drift decision is pure arithmetic, so the normal stale path costs no extra I/O; the nudge's KV dedup read + Slack POST are forked into `waitUntil` rather than run inline, because this is the serve-stale-instantly path. `keepStale` keeps a fallback nudge for the case where the read-path write did not land — it is the only one carrying the failing HTTP status.

| Key pattern                          | softTtl                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | hardTtl |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| `psd:current-season-id`              | 24 h                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 7 days  |
| `matches:team:{id}`                  | 24 h — capped at 15 min while any match is past kickoff but still `scheduled` (result pending, 48h grace window), so scores land on list surfaces (kalender, homepage, team agenda) minutes after PSD publishes them. See `teamMatchesTtl` in `handlers/matches.ts`.                                                                                                                                                                                                                                   | 7 days  |
| `matches:next`                       | 4 h — capped at 15 min once any listed kickoff is in the past ("next" is computed at fetch time). The stored list is never edited: `getNextMatchesHandler` drops every match whose kickoff has passed **on each serve** (fresh, stale or just fetched, #3467), so a started match never shows even while the refresh is pending; a stale read is served at once and one single-flight background refresh recomputes the list. See `nextMatchesTtl` and the serve-time filter in `handlers/matches.ts`. | 7 days  |
| `match:detail:{id}`                  | proximity-based: 7 days (settled ≥48h ago w/ report) · 15 min (<3h of kickoff) · 15 min (<24h) · 1 h (<7d) · 24 h (distant). Report-pending override: a past match still missing its report (PSD `hasReport` set, or <48h since kickoff) is capped at 15 min so the report self-heals instead of being pinned. See `matchDetailTtl` in `handlers/matches.ts`.                                                                                                                                          | 7 days  |
| `ranking:team:{id}`                  | 24 h                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 7 days  |
| `stats:team:{id}`                    | 24 h                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 7 days  |
| `stats:player:{memberId}:{seasonId}` | 6 h                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | 7 days  |
| `psd:seasons`                        | 24 h (`TTL.SEASONS`, plain KV get/set, #3468)                                                                                                                                                                                                                                                                                                                                                                                                                                                          | —       |
| `search:v1:{type}:{limit}:{q}`       | 1 h (`TTL.SEARCH`, plain KV get/set, expires — no SWR, #3468)                                                                                                                                                                                                                                                                                                                                                                                                                                          | —       |
| any TypedKvCache key, not-found      | 1 h (`NOT_FOUND_TTL` marker in place of the value, #3468)                                                                                                                                                                                                                                                                                                                                                                                                                                              | 1 h     |
| `ai:answers:YYYY-MM-DD`              | 48 h (daily AI-answer counter, #3468)                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | —       |

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
- **Never rate-limit off `Date.now()` inside the `PsdGate` Durable Object.** A DO advances its clock only on I/O, so while every caller is sleeping inside the gate no time passes: a wall-clock token bucket accrues nothing and starves forever (this pinned every fan-out — `matches:window`, `match:detail:*` — at its Jul 30 snapshot until the 7-day hard TTL). Pace with relative sleeps only (`GateLogic.acquireToken`). The failure is silent: a cancelled `waitUntil` sets no negative marker and reports no outcome, so SWR just keeps serving stale.

## PSD Schema & Transform Rules

- **Audit existing schema declarations before writing a new field.** When adding a field that appears on multiple PSD endpoints, grep `schemas.ts` for the field name first. `competitionType` appears in both `PsdGameBaseFields` (seasons endpoint) and the match detail general schema (match detail endpoint) — they must stay in sync.
- **Null before typeof.** When dispatching on `typeof value` for a nullable union field, always guard `if (val == null)` first — `typeof null === "object"` silently routes null into the object branch (e.g. `null?.type ?? "UNKNOWN"` → literal `"UNKNOWN"`). Pattern: `if (ct == null) return undefined; if (typeof ct === "string") ...; return /* object path */`.
- **Best-effort enrichment fetches run after the mandatory empty/not-found guard.** Any fetch that only enriches the response (e.g. `/teams` for team labels) must be placed after the primary empty-check and wrapped in `Effect.catchAll(() => Effect.succeed(undefined))` — an enrichment failure must never abort the primary response.
- **Status guard before every W/D/L aggregation.** When computing win/draw/loss counts over a match list, explicitly guard `m.status === "finished"` before each increment — scheduled, postponed, and forfeited matches must not count.
- **Schema change + transform change = one commit.** Fixing a schema field (e.g. adding `S.Union(PsdCompetitionType, S.String)`) without simultaneously updating every transform that reads that field creates a broken intermediate state. Both changes belong in the same commit.
- **Club names get `normaliseClubName()` at the emission site, never at decode time** (#2336 — rationale in its JSDoc). Match-side names go through `toMatchTeam`, which normalises by construction; `team_name` on the ranking transform is the one hand-wired site. Consumers must not re-case — the web app owned two local copies and they drifted. `CLUB_ABBREVIATIONS` is a hand-maintained allowlist: add a token when a club is reported wrong, not a name→name exception map.
