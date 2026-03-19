# PRD: Sync Reconciliation — Deactivate Departed Players, Staff, and Teams

**Issue**: #771
**Status**: Ready for implementation
**Date**: 2026-03-19

---

## 1. Problem Statement

`runSync` only upserts — it never removes or deactivates documents. When a player leaves the club, their Sanity document stays forever: appearing in team rosters, player listings, and navigation. Over multiple seasons, orphan documents accumulate silently.

**Concrete failure modes:**

- A player transferred out last season still appears in the team roster
- A dissolved youth team still shows in navigation (unless someone manually sets `showInNavigation: false`)
- A staff member who left still appears in GROQ query results
- No automated signal that a document is stale — editors must notice and manually intervene

**Important naming distinction:** PSD's own `active` field indicates whether a person has logged into the PSD platform — it is NOT a club membership indicator. The sync ignores PSD's `active` field entirely (all `status="speler"` members are synced regardless). This PRD introduces a separate, sync-owned field to track club membership.

## 2. Scope

**Packages touched**: `apps/api` (sync logic, SanityWriteClient), `apps/studio` (schema changes)

**In scope**:

- Add `archived` boolean field (default: absent/false, readOnly, hidden in Studio) to `player`, `team`, `staffMember` Sanity schemas
- Reconciliation logic in `runSync`: at end of full cycle (`nextCursor === 0`), compare current PSD roster against Sanity documents, set `archived: true` on orphans
- Reactivation: upsert always sets `archived: false` — a returning player is automatically un-archived
- Rate limit awareness: reconciliation fetches from Sanity (not PSD) and patches in bulk — no additional PSD API calls
- Update GROQ queries to filter `archived != true` (backward-compatible: existing docs without the field are treated as not archived)

**Out of scope**:

- Hard deletion of documents — references would break; deactivation preserves links
- PSD's `active` field — never used, never will be
- Sanity image cleanup for archived players — images stay (low cost, no user impact)
- `apps/web` component changes beyond GROQ query updates

## 3. Design

### Field: `archived`

```typescript
// apps/studio/schemaTypes/player.ts (also team.ts, staffMember.ts)
defineField({
  name: "archived",
  title: "Archived",
  type: "boolean",
  description:
    "Set automatically by sync when member is no longer in PSD. Do not edit manually.",
  readOnly: true,
  hidden: true,
});
```

- **Sync-owned**: only `runSync` writes this field
- **Hidden**: editors don't see it in Studio
- **Default absent**: existing documents without `archived` are treated as active (`archived != true` in GROQ)

### Reconciliation Logic

Runs once per full sync cycle, when `nextCursor` wraps to `0`:

```
1. Collect all PSD member IDs seen during this cycle (players + staff, across all teams)
2. Fetch all Sanity player docs where archived != true → get their psdIds
3. Fetch all Sanity staffMember docs where archived != true → get their psdIds
4. Diff: orphanPlayerIds = sanityPlayerPsdIds - psdPlayerPsdIds
5. Diff: orphanStaffIds = sanityStaffPsdIds - psdStaffPsdIds
6. Batch patch: set archived: true on all orphan docs
7. Log: "Reconciliation: archived X players, Y staff"
```

### Team Reconciliation

Teams use a dual-field model:

- `archived` (sync-owned): set `true` when team disappears from PSD entirely
- `showInNavigation` (editorial): set by editors to hide non-affiliated teams (e.g., Weitse Gans)

GROQ for team listings: `archived != true && showInNavigation != false`

This ensures:

- Weitse Gans: `showInNavigation: false` (editorial), `archived: false` (still in PSD) → hidden from nav, still synced
- Dissolved youth team: `archived: true` (not in PSD), `showInNavigation: true` (default) → hidden from nav automatically

### Reactivation

Every `upsertPlayer`, `upsertStaff`, and `upsertTeam` call sets `archived: false` in the patch. If a returning player is upserted, they are automatically un-archived.

### Rate Limiting

Reconciliation makes **zero additional PSD API calls**. It only:

- Reads from Sanity (`*[_type == "player" && archived != true] { psdId }`) — free, no PSD quota
- Patches Sanity documents — free, no PSD quota
- The PSD member/staff data was already fetched during normal sync runs — reconciliation uses the IDs accumulated during the cycle

### Accumulated IDs Strategy

Since `runSync` processes one team per invocation, the reconciliation needs IDs from ALL teams — but those were fetched across N separate cron runs. Two approaches:

- **A — KV accumulation**: Each run appends its player/staff IDs to a KV key (`sync:cycle-player-ids`). At cursor wrap, read the full set and reconcile.
- **B — Fresh fetch at wrap**: When `nextCursor === 0`, do one additional `getRawTeams()` call + fetch members for all teams. Costs ~N+1 PSD API calls but gets fresh data.

Recommendation: **A** (KV accumulation) — zero extra PSD calls, fits within existing rate budget.

## 4. Tracer Bullet

Add `archived` field to `player` schema + reconciliation for players only (not staff/teams yet):

- `archived` field added to `player` schema in Studio
- `upsertPlayer` patches `archived: false` on every upsert
- At cursor wrap (`nextCursor === 0`): read accumulated player IDs from KV, diff against Sanity, archive orphans
- One new `SanityWriteClient` method: `archivePlayers(psdIds: string[])`
- `PLAYERS_QUERY` updated: `archived != true` filter added
- One boundary test: given 3 players in Sanity, 2 in PSD → 1 archived
- `pnpm --filter @kcvv/api check-all` passes

## 5. Phases

```
Phase 0 (tracer bullet): archived field on player + player reconciliation + GROQ filter → #900
Phase 1: Staff reconciliation + team reconciliation + GROQ filters → #901
```

> **Note**: Phase 2 (KV accumulation) may be merged into Phase 0 if the implementation is straightforward. Listed separately in case the KV serialization adds complexity.

### Prerequisites

Sync testing (#869–871 in `psd-sync-pipeline-tests` milestone) should be completed first — reconciliation builds on a tested sync foundation.

## 6. Acceptance Criteria

### Phase 0 — Player reconciliation

- [ ] `archived: boolean` field added to `player` schema in `apps/studio/schemaTypes/player.ts` (readOnly, hidden)
- [ ] `upsertPlayer` patches `archived: false` on every call
- [ ] `SanityWriteClient` gains `getActivePlayerPsdIds(): Effect<string[]>` and `archivePlayers(psdIds: string[]): Effect<void>`
- [ ] At `nextCursor === 0`: accumulated player PSD IDs (from KV) compared against Sanity → orphans get `archived: true`
- [ ] KV key `sync:cycle-player-ids` stores JSON array of seen player PSD IDs; cleared at start of new cycle
- [ ] `PLAYERS_QUERY` in `apps/web/src/lib/sanity/queries/players.ts` (or future `PlayerRepository`) adds `&& archived != true` filter
- [ ] `PLAYER_BY_PSD_ID_QUERY` does NOT filter by archived — direct links to archived players still work
- [ ] Boundary test: 3 players in Sanity (none archived), 2 in PSD IDs set → reconciliation archives 1
- [ ] Boundary test: archived player re-upserted → `archived` set back to `false`
- [ ] `pnpm --filter @kcvv/api check-all` passes

### Phase 1 — Staff + team reconciliation

- [ ] `archived` field added to `staffMember` and `team` schemas
- [ ] `upsertStaff` and `upsertTeam` patch `archived: false`
- [ ] `SanityWriteClient` gains equivalent methods for staff and teams
- [ ] At `nextCursor === 0`: staff and team orphans archived
- [ ] Team GROQ queries: `archived != true && showInNavigation != false` — editorial `showInNavigation` preserved
- [ ] Staff GROQ queries: `archived != true` filter added to listings (org chart uses `inOrganigram` independently)
- [ ] Boundary tests for staff and team reconciliation
- [ ] `pnpm --filter @kcvv/api check-all` && `pnpm --filter @kcvv/web check-all` pass

### Phase 2 — KV accumulation

- [ ] Each `runSync` invocation appends current team's player/staff PSD IDs to `sync:cycle-player-ids` and `sync:cycle-staff-ids` in KV
- [ ] At cycle start (first team after cursor wrap): KV accumulation keys are cleared
- [ ] At cycle end (`nextCursor === 0`): full ID sets read from KV for reconciliation
- [ ] Boundary test: simulate 3 cron runs (3 teams), verify accumulated IDs include all members from all teams
- [ ] KV keys expire after 30 days (safety net in case cycle never completes)

## 7. Open Questions

- `[ ]` **Phase 2 vs Phase 0 merge**: Is KV accumulation simple enough to include in the tracer bullet? If `JSON.parse`/`JSON.stringify` of a string array in KV is reliable, merge it in.
- `[ ]` **Team ID accumulation**: Teams are fetched once per run (`getRawTeams()`), not accumulated. Should team reconciliation simply re-fetch the team list at cursor wrap (one extra PSD call) instead of accumulating?
- `[ ]` **Archived player detail pages**: Should `/players/[slug]` show a banner like "Deze speler is niet meer actief bij KCVV Elewijt" or silently render as normal? Product decision — not needed for Phase 0 but worth deciding.
- `[ ]` **#430 overlap**: The reconciliation will reduce #430's `responsibility_no_results` events for departed staff. No action needed, just noting the interaction.

## 8. Discovered Unknowns

_Filled during implementation._
