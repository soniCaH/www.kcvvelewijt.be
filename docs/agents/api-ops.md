# API operations: runbooks for `apps/api`

Moved out of `apps/api/CLAUDE.md` (#3716) so the rules file stays short. The rules stay there; this file holds the procedures, the numbers behind them, and the reasoning. Read the section a pointer in `apps/api/CLAUDE.md` names. Every procedure here changes production state or reads it; check which dataset and environment you target first.

## Releasing a stuck prune safety cap

The sweep refuses to prune (and logs a WARN) when a sweep's delete set exceeds `max(PRUNE_SAFETY_FLOOR, previousManifest.length × PRUNE_SAFETY_CAP_FRACTION)` (`search/sanity-index-sync.ts`) — a truncated fetch and a genuine bulk deactivation look identical from inside the sweep. **This does not self-heal**: the same input recomputes the same refusal every night until something changes.

**The Sanity dashboard webhook's GROQ filter must list every type `ALLOWED_TYPES` accepts** (`webhooks/index-handler.ts`: `responsibility`, `article`, `page`, `photoGallery`, #3338). The filter lives in the Sanity project, not in this repo — without `photoGallery` in it a gallery save never reaches the handler, and only the nightly sweep indexes it.

**The refusal alerts (#2855).** A cap refusal — or a prune that ran but had every delete rejected by Vectorize after retries — now reports a failed outcome through `reportScheduledJobOutcome` (`psd/job-alert.ts`) under its own job name, `search-index-prune` — separate from `sanity-index-sync`, because the sweep itself still succeeded (it did index) and conflating the two would mark a healthy indexing run as failed.

The PSD sync has the same pattern under the job name `psd-sanity-sync-cleanup` (#3564) — see "The cleanup alerts" below, after the orphan-cap release lever.

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

## The search-index manifest's ADD side is owned by `VectorizeServiceLive`; the array itself stays the sweep's alone (#2855)

The manifest (`index-manifest.ts`) is a single KV array, `search-index:manifest:{dataset}`, of ids the index is believed to hold. It has exactly **one** writer of that array: the nightly sweep (`search/sanity-index-sync.ts`). That was already true before #2855 and remains true after it — this is deliberate, not an oversight, because Workers KV cannot support a second writer safely (see "Why not a read-modify-write" below).

What #2855 changed is who is responsible for _getting an id to the sweep_ in the first place:

- **Adding an id is now structural.** `VectorizeServiceLive.upsert` (`search/vectorize.ts`) records every successfully upserted id as a put-only pending marker (`index-manifest.ts`'s `addToManifest`/`listPendingIds`) as an internal side effect — a caller cannot upsert through this service without a marker following. Previously only the webhook remembered to make this call itself; now every caller (the webhook, and the nightly sweep's own upsert phases) gets it for free, and a future third caller inherits it automatically too.
- **The nightly sweep still absorbs those markers into the array**, exactly as before: it lists every pending marker (`listPendingIds`), folds them into `previousManifest` before diffing against its freshly-fetched current ids, writes the merged array back once (`writeManifest`, the array's single write per sweep), and deletes the marker keys it just absorbed. This is why a document whose entire visible life fits between two sweeps (published and unpublished the same day) still gets pruned — the webhook's marker registers it even though no sweep ever saw it as "current."
- **Deleting an id is NOT symmetric, on purpose.** `VectorizeServiceLive.deleteByIds` does not touch the manifest or any marker at all. Pre-#2855, a webhook delete never updated the manifest either — the array only ever drops an id via the sweep's own confirmed-delete reconciliation (`reconcileOrphans` + `deleteBatched`'s returned _confirmed_ subset), and that was already the manifest's only removal path with nothing to consolidate. Mirroring the add side with a parallel "pending delete" marker would be new complexity #2855 was never asked to build — the issue's own text explicitly frames "manifest growth" (a deleted id lingering one extra sweep) as **not a bug**: the next sweep's `deleteByIds` call for an already-absent id is a documented no-op, and the manifest converges within that one sweep regardless of which side deletes registered on.

**Why not a read-modify-write on the array itself, from the service.** An earlier version of this change moved BOTH the add and the confirmed-delete bookkeeping into `VectorizeServiceLive`, replacing the per-id marker with a `readManifest` → `writeManifest` pair called directly from `upsert`/`deleteByIds`. This does not work on Workers KV: `get` is served from a colo cache and is documented as taking up to **60 seconds** to reflect a preceding `put` (not read-your-writes), and a single key is throttled to roughly **1 write/second**. A sweep's own phases alone call this at least four times (once per upsert batch, once per delete chunk) — the article phase's read can return the pre-responsibility-phase value and clobber it, and a concurrent webhook racing either one loses the same way. That is precisely the #2856 defect the original put-only marker design exists to prevent by construction (no shared read, so nothing to race on) — read-modify-write reintroduces it. Keep the marker.

Manifest keys — and marker keys — stay dataset-scoped exactly as before (`manifestKey(dataset)` / `pendingKey(dataset, id)`, both keyed off `env.SANITY_DATASET`), so a staging worker and a production worker sharing one `PSD_CACHE` namespace never touch each other's state. Getting this scoping wrong is exactly what #2833 was about.

**Known, accepted trade-off:** the marker write now happens inside `VectorizeService.upsert`'s own Effect, awaited by the webhook before it responds (a single KV `put`, retried on a transient failure) — pre-#2855 the webhook deferred this same write via `ctx.waitUntil` so it couldn't add latency to the response. Restoring that deferral would require either leaking Cloudflare's `ExecutionContext` into `VectorizeService`'s general interface (which the sweep's scheduled invocation has no use for and shouldn't need to satisfy), or building a background-runner seam generalized beyond the PSD-specific one that already exists (`psd/background.ts`). Neither was judged worth it for a single low-latency put; flagged here for a human to weigh in on if it matters in practice.

## The shared orphan-reconciliation guard (`reconciliation.ts`, #2854)

`reconcileOrphans` (`src/reconciliation.ts`) is the one shared implementation of the four-step orphan-reconciliation pattern both sync jobs need: diff the tracked set against the current set, handle the none-case, apply a ratio-based safety cap before acting, then act (calling a caller-supplied archive/delete function and returning the **confirmed** removed subset — not merely a completion signal, since a caller like the search-index sweep needs to know exactly what landed before touching its own manifest).

Every call passes a config object with a **required** `releaseLeverHint` — the pointer an operator sees in the cap-refusal WARN telling them where THIS caller's release lever lives. It's required, not defaulted, on purpose: the two callers have different levers documented in different sections below, and a shared default previously pointed every refusal at the search-index-only manifest-delete lever, which would tell an operator investigating a PSD refusal to delete the search-index manifest instead (#2854 review). `logPrefix` (optional, default `""`) is prepended to every log line the call emits, so a log query scoped to a caller's own prefix (e.g. `[search-sync]`) still finds its reconciliation outcome, refusal included.

- **`sync/psd-sanity-sync.ts`**'s `reconcileEntity` is a thin adapter over it — same public signature as before this refactor, still used by its three cycle-end callers (players, staff, teams). It always passes `floor: 0` (the default), which reproduces the pre-refactor bare-ratio behaviour (`ratio > MAX_ORPHAN_RATIO`) exactly — see the latching note below for why this means PSD sync's latching behaviour is unchanged, not fixed.
- **`search/sanity-index-sync.ts`**'s manifest-diff prune calls it directly, passing its existing `PRUNE_SAFETY_CAP_FRACTION`, `PRUNE_SAFETY_FLOOR`, and `logPrefix: "[search-sync] "` — unchanged from before this refactor except for the prefix, which restores what a log query scoped to `[search-sync]` used to see. The excluded-ids deletes (stateless, authoritative) are **not** routed through this helper — they're scoped independently and must never be subject to the manifest-diff's cap (see the block comment above the call site). Before deleting, they're also filtered against whatever the manifest-diff call just confirmed removed, so an id that is simultaneously a manifest orphan and an excluded id is not sent to `deleteByIds` twice in the same sweep and does not get double-counted across the two "Pruned N" log lines.

**A floor-less ratio latches.** A bare `ratio > threshold` check with no floor refuses forever once tripped against a small tracked set: the same input recomputes the same refusal every run, with no state change and no release lever, until something external changes the underlying data.

**This is NOT fixed for PSD sync by the refactor itself.** `reconcileEntity`'s three production callers pass `floor: 0` — the compatibility guarantee — so `max(0, activeCount × ratioThreshold)` is mathematically identical to the bare ratio check they always had. PSD sync's latching behaviour is **unchanged**: a genuinely stuck cap still recomputes the same refusal every cycle. What #2854 actually gives PSD sync is not immunity to latching but a **manual lever to break it** — the one-shot override key below — where before there was no documented way to clear a stuck refusal at all. Do not read "the shared helper supports a floor" as "PSD sync's small id sets are now protected"; they aren't, by design (see the AC in #2854: the three callers must behave identically to today).

## PSD sync rotation, cycle-end guard and manual runs (#3465)

`runSync` indexes the cursor into PSD's team list **sorted by numeric id**, not in response order, so PSD reordering or dropping a team no longer skips an existing team (the one skipped team and its players used to be archived at cycle end, under the 0.3 orphan cap). The first cycle after the sort shipped may be incomplete; the guard below covers it.

- **Cycle-end guard.** A team is archived only when it is in neither the team accumulator nor this run's live `getRawTeams()` ids. If any live team id is missing from the team accumulator the cycle is **incomplete**: player and staff reconciliation are skipped (WARN `cycle INCOMPLETE`), the accumulators are still cleared.
- **Zero roster.** PSD returns 0 players for a team Sanity lists players for (`SanityProjection.getTeamPlayerPsdIds`): no `upsertTeam`, the team and its existing player ids are accumulated, and `sync:empty-roster:<teamId>` is written. A second consecutive empty roster is trusted (`players: []`, marker deleted); a non-empty roster deletes the marker. Never "don't accumulate" — that turns player reconciliation off.
- **Member isolation.** Each member's upsert and image sync is isolated. The team is still written, the cursor still advances, then the run **fails** naming the failed psd ids (`SyncIncompleteError`), because `reportScheduledJobOutcome` only sees ok/fail. A failed member with no doc yet is left out of the team's strong `players`/`staff` references but stays in the accumulator. A `getRawMembers`/`getRawStaff` failure advances the cursor without accumulating the team, then fails. A cursor write that fails at cycle end fails the run (mid-cycle it is still only logged).
- **Change-only writes (#3709).** `upsertPlayer`, `upsertStaff` and `upsertTeam` read the stored document and send no mutation when every PSD-owned field already holds its value (absent counts as `null`: Sanity drops `null` on write). A no-op patch keeps `_updatedAt`, but it still fires the web app's revalidate webhook, which busts the whole `players` / `staff` / `teams` cache tag. Without this check, every nightly run marked every tagged page stale (ISR writes, #3708).
- **Manual runs.** `SYNC_MANUAL_RUN=1` (`WorkerEnv`, set by `scripts/trigger-psd-sync.sh` through `wrangler dev --var`; never in `wrangler.toml`) skips cycle-end reconciliation and every accumulator and marker write/clear. The cursor still moves. The script's index is a position in id-sorted order, and its `--preview` KV is staging's real namespace (`preview_id` equals the staging `id`).

## PSD portraits and personal data (#3469)

The sync owns `psdImage` + `psdImageUrl` on `player` and `staffMember` documents, so it also removes them. It is not the only writer: the Studio action `RemovePsdImageAction` clears them by hand (below).

- **No portrait in PSD → none on the site.** `syncMemberImage` calls `SanityMutation.unsetPlayerImage` / `unsetStaffImage` when PSD has no `profilePictureURL` **and** the stored `psdImageUrl` is set; otherwise it is a no-op, so documents that never had a portrait are not patched nightly. The PSD placeholder (`PSD_PLACEHOLDER_IMAGE_SHA1`, #1895) counts as "no portrait": `uploadMemberImage` calls the same unset when the downloaded bytes match it. A failed unset returns `false` from `syncMemberImage`, so the member is not checkpointed and retries.
- **A portrait removed behind an unchanged URL is not detected.** PSD keeps the same `profilePictureURL` and redirects it to its placeholder, and `needsUpload()` compares URLs only, so the placeholder SHA-1 check never runs. An editor clears it with the Studio action "Verwijder PSD-foto" (`RemovePsdImageAction`, `packages/sanity-studio/src/actions/remove-psd-image.tsx`, #3703): it unsets both fields on the published document and the open draft, then deletes the asset by the same `count(*[references($assetId)]) == 0` rule. The empty `psdImageUrl` makes the next sync re-download the image, match the placeholder and no-op.
- **Superseded assets are deleted.** After an unset, or after a re-upload that landed a different asset, the previous asset is deleted only when `count(*[references($assetId)]) == 0` (`deleteAssetIfUnreferenced`). The just-uploaded asset is never a candidate (Sanity dedups identical bytes to one id). A failed delete is logged (`logWarning`) and never fails the member's sync; `scripts/sanity-ops` `psd-privacy:cleanup` sweeps what is left.
- **Portrait downloads take a gate token.** `uploadMemberImage` runs `gate.acquireToken` before the PSD `fetch`, like both PSD clients. `SanityMutationLive` therefore requires `PsdGateService`: every layer that builds it must provide `PsdGateLive` (in `buildAppLayer` it sits below `SanityMutationLive` for that reason). Type-check fails if one does not.
- **Staff birth dates are stored again (#3570).** #3469 dropped them; the birthday post (below) is now their reader. `transformStaff` writes `birthDate` with the time part stripped, like `transformMember`, and `staffMember.birthDate` is a read-only `date` that the site never shows. Player `birthDate` is unchanged: `PlayerHero` needs the full date for an exact age (owner decision, 2026-10-15). The `production` dataset has been private since 2026-10-14.

## Releasing a stuck PSD sync orphan-cap refusal

Unlike the search-index prune, PSD sync's cap isn't evaluated against a persisted manifest — it's recomputed fresh every rotation cycle from the current Sanity-active ids and the freshly-accumulated PSD ids, so there's no stored state to delete. The release lever is a one-shot KV bypass key instead, **scoped to a single entity type per use** — an operator who investigated and confirmed a genuine `players` refusal has verified nothing about that same cycle's staff or team fetch, so a blanket bypass would also wave through an unrelated, uninvestigated refusal. The key is read and deleted **upfront**, before any reconciliation leg runs, so it is always consumed on observation — whether or not the leg it was meant for actually runs that cycle (e.g. a failed club-wide staff fetch skips staff reconciliation entirely; a staff-scoped override set for that cycle is still consumed and must be re-armed).

Value is a comma-separated list of `players`, `staff`, `teams`, or the literal `all` (`1` also works, as a quick blanket override):

```bash
# Release a players-only refusal (production; SANITY_DATASET=production)
wrangler kv key put "sync:orphan-cap-override" "players" --binding=PSD_CACHE

# Release every entity type at once (staging; SANITY_DATASET=staging)
wrangler kv key put "sync:orphan-cap-override" "all" --binding=PSD_CACHE --env staging
```

Only set this after confirming the refusal is a false positive (a genuine mass roster change, not a truncated/regressed PSD fetch) — see the WARN log `reconciliation: SKIPPED — …` for the counts that tripped it, and `reconciliation: orphan-cap override consumed — …` for confirmation of what the key actually bypassed.

**The cleanup alerts (#3564).** The cycle-end cleanup (archiving players, staff and teams that left PSD) reports under its own job name, `psd-sanity-sync-cleanup` — the sibling of `search-index-prune`, and separate from `psd-sanity-sync` because the sync did its work and a skipped cleanup must not mark it failed. `runSync` resolves with `{ cleanup }`, a `CleanupOutcome` (`sync/psd-sanity-sync.ts`) shaped like `prunePhase`: `"not-run"` (no cycle end tonight — the rotation ends a cycle only every N nights — or a manual run, or no teams), `"ok"`, or `"skipped"` with one entry per reason: cycle INCOMPLETE (a live team never accumulated), the club-wide staff fetch failed, or an orphan-cap refusal for `players`, `staff` or `teams` (with its orphan/active counts). `scheduled()` maps it through `cleanupJobOutcome` (`sync/cleanup-outcome.ts`) and reports it strictly after `psd-sanity-sync`'s own report. The Slack text names each skip with its numbers and, for a cap refusal, points at the `sync:orphan-cap-override` lever above. **A night with no cycle end reports nothing** — not a recovery — so the streak stays open until a later cycle end cleans up (one "recovered" ping then). A run killed at the 15-minute ceiling, or one that fails after the cycle end (a failed member, a failed cursor write), resolves no outcome and reports no cleanup status; both stay covered by `psd-sanity-sync`'s own failure report.

## Weekly staff-gaps nudge (#3561)

Cron `0 6 * * MON` (Monday 06:00 UTC — named, because Cloudflare numbers weekdays `1` = Sunday; the string is `STAFF_GAPS_CRON`, and `index.scheduled.test.ts` asserts `wrangler.toml` carries it; production only — staging keeps `crons = []`) runs `runStaffGapsCheck` (`sync/staff-gaps-check.ts`) from its own `scheduled()` branch, never inside the `0 2 * * *` sync and its 15-minute ceiling. One GROQ read, `SanityProjection.getStaffGaps()`, returns three groups, and `buildStaffGapsMessage` (`psd/slack-alert.ts`) turns them into one Slack message with a count per group and a Studio link per item:

- **Staff without a role** — a `team.staff[]` entry with an **empty** role on a non-archived team with a `psdId`. `andere` is a real answer and is never reported; empty means "not done yet" (#3560).
- **Staff without a photo** — a `staffMember` on those teams with neither `photo` nor `psdImage`.
- **Coordinator positions not filled** — an `organigramNode` with roleCode `TVJO`, `JC-OB`, `JC-MB` or `JC-BB` that is not `active == true` or has no **live** member (an archived or dangling member reference does not count — the web's TeamCard hides that box too), and any of those role codes that no organigram node carries at all.

Nothing to report → no message. `SLACK_ALERT_WEBHOOK_URL` unset → the job returns before the read. A failed read, or a Slack POST that is not confirmed, fails the run, which reports through `reportScheduledJobOutcome` under the job name **`staff-gaps-check`** — never through `gate.reportOutcome`. Its job-alert state TTL is the shared 3 days, shorter than the weekly interval, so a failure alerts every week it recurs instead of once per streak — and it **never sends a "recovered" ping**: by the next run the failure state has expired, so a success finds nothing to recover from. A missing Monday message after a failure alert therefore means either "fixed" or "nothing to report"; check the run log.

## Daily birthday post (#3570)

Cron `0 7 * * *` (07:00 UTC, 08:00/09:00 in Brussels; the string is `BIRTHDAY_CRON`, and `index.scheduled.test.ts` asserts `wrangler.toml` carries it; production only — staging keeps `crons = []`) runs `runBirthdayPost` (`sync/birthday-post.ts`) from its own `scheduled()` branch. It replaces Drupal's `kcvv_birthdays_*` jobs.

- **One read, zero PSD calls.** `SanityProjection.getBirthdayPeople()` returns every non-archived `player` and `staffMember` with a `birthDate` who is on a non-archived, nav-visible team or, for staff, a member of an active organigram node. The label is the team's `derivePsdTeamLabel(name, age)` (`U11`, `A-Ploeg`, #3598), else the staff function.
- **Dates are Belgian wall-clock** (Europe/Brussels). Each day posts "Vandaag jarig"; a Monday also posts "Verjaardagen deze week" (Monday to Sunday). Born 29 February → 28 February in a non-leap year. An empty day posts nothing.
- **`SLACK_BIRTHDAY_WEBHOOK_URL`** (wrangler secret, `#general`) unset → the job returns before the read. A Slack POST that is not confirmed fails the run, which reports under the job name **`birthday-post`** through `reportScheduledJobOutcome`.

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

### `/search/team-guess` (`teamGuessWithCeilings`, `AiAnswerService.guessTeam`)

The `/hulp` team card's AI fallback (#3559): `{ query, ages }` →
`{ age: one of ages | null }`. Same order and the same four ceilings as
`/search` — the two limiters (one shared budget per visitor), the cache under
its own prefix `teamguess:v1:{sha256(ages joined "," + "|" + q)}` for
`TTL.SEARCH`, and the same `ai:answers:{day}` counter against
`AI_ANSWER_DAILY_CAP` (`max_tokens: 8`). The model's reply counts only as a
bare code on the list (`allowedAge`); anything else is `null`. The cap or an
AI failure is `age: null` too — never a 5xx — and is not cached; a pick and
a "none" are. The web calls it only when the rules matched no team and the
query holds a youth hint word.

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
- **How the budget was chosen (re-set 2026-10-19).** It shipped at 600, the
  ticket's no-history default. That missed that the count includes the
  nightly sync: on go-live day the sync's share plus overnight crawler traffic
  hit 804 by 08:00 UTC, and every cold miss was refused for the rest of the
  day (a `/tegenstander` page 500'd on it). Re-set from measurement: the
  worker's outgoing calls in the 02:00 UTC hour (Cloudflare GraphQL
  `workersInvocationsAdaptive`, `subrequests`, 12–18 Oct) were 199–283, an
  upper bound on the sync's PSD calls since Sanity writes count too. Our half
  of PSD's 2 000/day (the old AWS app still uses the other half until #3580)
  is ~1 000; minus the sync (300) and a 20% margin leaves ~550 for visitors.
  The cap counts both, so **850**. Never above 1 000 while AWS still calls
  PSD. The DO keeps today only; to re-measure, use the GraphQL query above.

### `/related` (`handlers/related.ts`)

The `id` must match `/^[A-Za-z0-9._-]{1,128}$/` (`packages/api-contract`,
`api/related.ts`); anything else is a `400`. An empty `[]` result is returned
but never stored; a non-empty result keeps `TTL.RELATED`.

## `KvCacheService` owns KV, in full (#2873)

Every KV access in this worker goes through `KvCacheService` — there are no
callers left that reach `env.PSD_CACHE` directly. The interface has two
halves with deliberately different error contracts:

- **The SWR read path** — `get`/`set`/`delete` — swallows every
  KV failure to `null`/`undefined`, on purpose: a cache blip must never
  break a read. This is what `TypedKvCache` (`apps/api/CLAUDE.md` → Cache) uses.
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

## Drift observability (#2335)

A background (SWR) refresh runs in `waitUntil`, which Cloudflare cancels ~30 s after the invocation ends. A **killed** refresh — unlike a **failed** one — runs none of its handlers: no negative marker, no incident report, no drift nudge. The value then drifts toward the 7-day hard-expiry cliff behind a clean `200` and a clean log. Two guards close that gap:

- **`BG_REFRESH_TIMEOUT_MS` (12 s)** bounds the background refresh fetch so a slow one takes the normal failure path (negative marker + escalating log) instead of being killed. **The binding ceiling is `GateLogic.leaseMs` (15 s), not the `waitUntil` budget** — a refresh that outruns the lease loses single-flight, so the next reader forks a second full fan-out under exactly the load that made the first one slow, (its `endFlight` carries the owner token `beginFlight` returned, so a lapsed leader can no longer end the newer leader's flight, #3467). A unit test pins `BG_REFRESH_TIMEOUT_MS < 15 s`; keep them coupled. `getOrFetch`'s `backgroundTimeoutMs` option exists so tests can drive it with a small value — no production caller overrides it. A timed-out refresh deliberately does **not** call `gate.reportOutcome` — a slow fan-out under load is not proof PSD is down, and reporting it would open spurious outage pings. Note the timeout abandons the fan-out but does not cancel it: the in-flight PSD calls keep running until each finishes or hits its own 8 s abort (below).
- **A read-path drift check** evaluates the `stale-since:{key}` marker's age on every stale serve, before the negative-marker early-return, so a key whose marker keeps being re-set still surfaces. It is the only signal that does not depend on a refresh path executing at all — a killed refresh leaves the marker in place, so it pings after 24 h like a failing one.

There is **no blocking refresh** (#3467). A stale read always serves the stale value and runs the single-flight, `BG_REFRESH_TIMEOUT_MS`-bounded refresh — through the runner, or inline when none is wired (tests only). The former "block on a past-kickoff stale value" option and its unguarded foreground refresh are gone: with N concurrent stale reads after a kickoff they ran N unguarded foreground fan-outs (~19 PSD calls each) behind the 5/s gate. The cold-miss leader is capped as a whole too: `MISS_FETCH_TIMEOUT_MS` (12 s, `fetchTimeoutMs` in tests, pinned `< 15 s`) fails the read with `UpstreamUnavailable`, releases the flight and reports nothing to the gate. `gate.beginFlight` returns an owner token (`null` = follower) and `endFlight(key, token)` is a no-op for any other token.

**PSD fetches are bounded and partial fan-outs are cached briefly (#3489).** `fetchJson` (`psd/service.ts`) passes `signal: AbortSignal.timeout(8000)` — one signal for the request and its body read — so a hung PSD call fails with `UpstreamUnavailable` (stale-servable) after 8 s instead of holding its caller. An abort that lands while the body streams is mapped to `UpstreamUnavailable` too, never to a decode error. The match-team index build (`getMatchTeamIndex`, ~21 calls) runs under a gate flight on `flight:match-team-index`: one caller builds, the rest `awaitFlight` and re-read the cache, so N concurrent callers on an expired index cost one build. A fan-out where at least one team (or, for opponent history, one season) failed still returns what loaded, but `getNextMatches`, `getMatchesWindow` and a non-empty `getOpponentHistory` tag it with `markPartial`; the handler passes `isPartial: isPartialFanout` to `getOrFetch`, which stores `partial: true` in the wrapper and treats the entry as stale after `TTL.PARTIAL_FANOUT` (5 min) instead of its full soft TTL. The tag is by object identity (a `WeakSet`), read right after the fetch, so the values stay plain contract types. A complete fan-out keeps its TTL; an all-failed one still fails. `getMatchDetail` uses the same tag for one case only: its `/teams` read (for `kcvv_team_label`, #3705) failed or passed its 3 s cap, so the label-less detail heals in minutes. The two club-wide fan-outs (`getNextMatches`, `getMatchesWindow`) take each visible team's id, name and age from the cached `psd:teams-by-id` map (`getVisibleTeams`, #3631), so a warm map costs them no `/teams` call; a cold map whose `/teams` fails still fails the fan-out, as before.

**A played match with no result never waits two visits (2026-10-19).** A stale read serves stale and refreshes behind it, so a page read once in a while lags a whole visit (a U17 forfeit kept its preview for 36 h). `getOrFetch`'s `refreshInline` option runs that same single-flight, bounded refresh in the foreground for values it flags and serves the result, falling back to stale on any failure; `getMatchDetailHandler` flags a detail past kickoff that is still `scheduled` (`needsInlineRefresh`). `getOpponentHistoryHandler`'s soft TTL drops from `TTL.OPPONENT_HISTORY` (7 days) to `TTL.MATCH_DETAIL_MATCHDAY` for 48 h while a match in the history is past kickoff but still `scheduled`, then to `TTL.MATCHES_TEAM` (daily) until the 7-day TTL (`opponentHistoryTtl`): a refresh is a whole season fan-out. It also flags those same histories for `refreshInline`: the lower TTL alone left Erpe-Mere's page "Gepland" after the deploy, because the first read served the stale copy and ISR kept that render for 15 min.

**Drift is measured from the first stale read that did not get fixed (#3566), not from the soft TTL.** The first stale read of a key writes `stale-since:{key}` (value `Date.now()`, TTL = the key's hard TTL) if none exists; **every successful write of the key — a landed refresh or a cold fetch (`persist`) — deletes it**. The read-path check pings when `now − stale-since > DRIFT_NUDGE_THRESHOLD` (24 h). The earlier rule (`now − fetchedAt − softTtl`) fired on the first read of a page nobody had opened for two days: the refresh that read started then succeeded, and Slack got nine "drifting" pings from one crawler visit. Idleness is not drift; refreshes that keep failing or keep being killed are. A marker dated before the value's `fetchedAt` belongs to an earlier stale spell (its delete failed or was raced) and is treated as absent and rewritten, so it cannot make a fresh stale spell look drifted. The first-read marker write is forked through the background runner like the nudge, so the serve-stale-instantly path never waits on it. The same marker age governs `keepStale`'s WARN→ERROR escalation, and the fallback nudge. Slack still reports **absolute** age + time-to-cliff, plus `not refreshed for {marker age} of reads`; the message says "Cached data" for a cache with `psdBacked: false` (`related:*`) and "PSD data" otherwise.

While drifting: `ERROR` on every stale serve (the `wrangler tail` trace), Slack nudge once per day per key (`nudge:{key}`, `NUDGE_MARKER_TTL`). The marker read sits on the stale path only, next to the negative-marker read — the fresh path stays I/O-free — and the first stale read pays one extra KV write; the nudge's KV dedup read + Slack POST are forked into `waitUntil` rather than run inline, because this is the serve-stale-instantly path. `keepStale` keeps a fallback nudge for the case where the read-path write did not land — it is the only one carrying the failing HTTP status.

| Key pattern                          | softTtl                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | hardTtl  |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| `psd:current-season-id`              | 24 h                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 7 days   |
| `matches:team:{id}`                  | 24 h — capped at 15 min while any match is past kickoff but still `scheduled` (result pending, 48h grace window), so scores land on list surfaces (kalender, homepage, team agenda) minutes after PSD publishes them. See `teamMatchesTtl` in `handlers/matches.ts`.                                                                                                                                                                                                                                   | 7 days   |
| `matches:next`                       | 4 h — capped at 15 min once any listed kickoff is in the past ("next" is computed at fetch time). The stored list is never edited: `getNextMatchesHandler` drops every match whose kickoff has passed **on each serve** (fresh, stale or just fetched, #3467), so a started match never shows even while the refresh is pending; a stale read is served at once and one single-flight background refresh recomputes the list. See `nextMatchesTtl` and the serve-time filter in `handlers/matches.ts`. | 7 days   |
| `match:detail:{id}`                  | proximity-based: 7 days (settled ≥48h ago w/ report) · 15 min (<3h of kickoff) · 15 min (<24h) · 1 h (<7d) · 24 h (distant). Report-pending override: a past match still missing its report (PSD `hasReport` set, or <48h since kickoff) is capped at 15 min so the report self-heals instead of being pinned. See `matchDetailTtl` in `handlers/matches.ts`.                                                                                                                                          | 7 days   |
| `ranking:team:{id}`                  | 24 h                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 7 days   |
| `stats:team:{id}`                    | 24 h                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 7 days   |
| `stats:player:{memberId}:{seasonId}` | 6 h                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | 7 days   |
| `psd:seasons`                        | 24 h (`TTL.SEASONS`, plain KV get/set, #3468)                                                                                                                                                                                                                                                                                                                                                                                                                                                          | —        |
| `search:v1:{type}:{limit}:{q}`       | 1 h (`TTL.SEARCH`, plain KV get/set, expires — no SWR, #3468)                                                                                                                                                                                                                                                                                                                                                                                                                                          | —        |
| any TypedKvCache key, not-found      | 1 h (`NOT_FOUND_TTL` marker in place of the value, #3468)                                                                                                                                                                                                                                                                                                                                                                                                                                              | 1 h      |
| `stale-since:{key}`                  | none — written on a key's first stale read, deleted by every successful write; TTL = that key's hard TTL (#3566)                                                                                                                                                                                                                                                                                                                                                                                       | hard TTL |
| `ai:answers:YYYY-MM-DD`              | 48 h (daily AI-answer counter, #3468)                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | —        |
