# 6.B.d0 · Match Detail — Data Reality LOCKED

**Drill round 1.** First drill of the Phase 6.B (match detail) design
series. Establishes which data the redesign can render today and which
fields would require new data work, so subsequent visual drills compose
within a known data-truth box.

**Status:** LOCKED 2026-05-22. Variant C — design within today's BFF
data; defer editorial enrichment to dependent issues.

---

## Surface

- Route: `/wedstrijd/[matchId]`
- States in scope: **upcoming** (`status === "scheduled"`) and
  **finished** (`status === "finished"`)
- States out of scope: live (no BFF feed) + `forfeited` / `postponed` /
  `stopped` (rare edge states; render as a degraded "finished" view
  with a status badge, no special design treatment)

The master plan's §6.3 locks the page as a 2-state surface per the
2026-05-22 update (`feat/phase-6b-kickoff-docs`).

---

## Data source map

### 1. BFF `getMatchDetail` (`/match/:matchId/detail`) → `MatchDetail`

The only authoritative data source for match-specific fields. Schema
defined in `packages/api-contract/src/schemas/match.ts`.

| Field | Type | Per-state availability | Notes |
| --- | --- | --- | --- |
| `id` | number | both | PSD match id |
| `date` | Date | both | parsed via `DateFromStringOrDate` |
| `time` | string? | both | e.g. `"14:30"` |
| `venue` | string? | both | free-text from PSD |
| `competition` | string? | both | e.g. `"3e Provinciale A"` |
| `home_team.{id, name, logo, score}` | MatchTeam | both (score 0/0 for upcoming) | logo URL from PSD |
| `away_team.{id, name, logo, score}` | MatchTeam | both (score 0/0 for upcoming) | logo URL from PSD |
| `status` | MatchStatus | both | one of `scheduled / finished / forfeited / postponed / stopped` |
| `squadLabel` | string? | both | e.g. `"A-Ploeg"`, `"U21"` |
| `kcvv_team_id` | number? | both | which KCVV team plays |
| `kcvv_team_label` | string? | both | human label for kcvv_team_id |
| `is_home` | boolean? | both | computed by BFF from kcvv_team_id |
| `lineup.{home, away}` | MatchLineup? | **finished: usually; upcoming: rarely** | rosters typically lock at kickoff |
| `events` | MatchEvent[]? | **finished only** | goals / cards / substitutions |
| `hasReport` | boolean | both (only `true` for some finished) | indicates an external PSD report exists |

`MatchLineupPlayer` carries: `id?, name, number?, minutesPlayed?, isCaptain, isKeeper?, position?, status (starter/substitute/substituted/subbed_in/unknown), card?`.

`MatchEvent` carries: `id, type (goal/yellow_card/red_card/substitution), minute, team (home/away), player?, playerIn?, playerOut?, isPenalty?, isOwnGoal?`.

### 2. Sanity — `article` document type with `matchPreview` / `matchRecap` articleType (per #1470)

Editorial long-form content ABOUT a match. Lives at `/nieuws/[slug]`,
NOT on `/wedstrijd/[matchId]`. Currently unimplemented (#1470 ships
Phase 6.B-adjacent). When it lands, the linkage between an article and
a specific match is via an `articleMatch` reference field (TBD shape).

**Implication for 6.B:** the match-detail page can OPTIONALLY surface
"there's a written preview/recap for this match → read it" as a single
link card. It does NOT render the article body in-line. Editorial body
content lives on the article page; the match page links to it.

### 3. No other sources

- **No Sanity match document type.** Matches aren't authored in
  Sanity; they're PSD-synced read-only via the BFF.
- **No per-match Sanity image.** No coach quote, no tactical-notes
  field, no head-to-head metadata.
- **No live data feed.** Confirmed per the 2026-05-22 docs update.
- **No head-to-head BFF endpoint.** `getRecentMatchesForTeam`-style
  calls exist for team rosters but not for cross-team H2H derivation.

---

## What the original master-plan §6.3 spec asked for vs what's available

| Section spec'd in master plan §6.3 | Data needed | Data available today? |
| --- | --- | --- |
| **Upcoming — `<EditorialHero variant="match-preview">`** with date / venue / two shields / "VOORBESCHOUWING" kicker | teams, date, venue, competition | ✓ (BFF) |
| **Upcoming — tactical notes** | editorial prose | ✗ — would need `matchPreview` article (#1470) |
| **Upcoming — recent form via `<TapedCardGrid>`** | last N matches per team | ✗ — no H2H endpoint; would require new BFF endpoint |
| **Finished — "MATCHVERSLAG" hero** with score + 16:9 match photo | teams, score, status | partial: score ✓, photo ✗ |
| **Finished — 16:9 match photo via `<TapedFigure aspect="landscape-16-9">`** | per-match image | ✗ — no source |
| **Finished — score + final-whistle ephemera** | score, lineup, events | ✓ (BFF) |
| **Finished — key moments** | `events` array | ✓ (BFF — derive from goals + cards) |
| **Finished — `<PullQuote>` coach reaction** | editorial quote | ✗ — would need `matchRecap` article (#1470) |
| **Finished — `<RecentMatchesGrid>` of head-to-head history** | H2H matches | ✗ — no H2H endpoint |

---

## Locked decision — Variant C (design within today's data)

Mirror 6.A.d0's Variant C call: scope the 6.B design to fields the BFF
already surfaces. Editorial-derived sections (tactical notes, coach
quotes, match photos, H2H grids) are **out of 6.B scope** and become
explicit dependents on:

- **#1470** (matchPreview / matchRecap article variants) — when authored,
  surface a single "READ THE FULL PREVIEW/RECAP →" card on
  `/wedstrijd/[matchId]` linking to the article. No body content
  rendered on the match page.
- **Future H2H endpoint** — out of Phase 6.B. If a recent-form / H2H
  surface becomes a hard requirement during a later drill, file a
  separate BFF issue and design with placeholder pending data.

### Page composition shape (locked at this drill, refines in 6.B.d1)

```text
SiteHeader
MatchStrip (top — if route opts in per Phase 3.C lock; TBD in d1)
<MatchHero>                          ← upcoming OR finished hero
  ├── meta row (squadLabel · competition · date · venue · status badge)
  ├── teams + score (or "vs" for upcoming)
  └── status-aware kicker (VOORBESCHOUWING / FINAL / FORFAIT / etc.)
StripedSeam
<MatchBody>                          ← state-dependent
  ├── upcoming:  match-meta panel + (optional) link card → matchPreview article
  └── finished:  lineup section + events timeline + (optional) link card → matchRecap article
RelatedArticlesSection               ← reuse existing primitive, query by articleMatch ref
FooterSafeArea
```

The detailed visual drill of `<MatchHero>` lives in 6.B.d2; lineup +
events layout in 6.B.d3; the article-link card in 6.B.d4. This doc
only locks the data-truth box.

---

## What this lock unblocks

After 6.B.d0 lands, the visual drills can proceed without re-litigating
data scope. Each subsequent drill mockup MUST render only fields listed
in the "Data source map" above; any new field requires either an
update to this lock OR a new dependent BFF / Sanity issue.

### Drill sequence (queued)

| Drill | Subject | Status |
| --- | --- | --- |
| 6.B.d0 | Data reality | **LOCKED (this doc)** |
| 6.B.d1 | Page composition + MatchStrip placement | queued |
| 6.B.d2 | `<MatchHero>` (upcoming + finished variants) | queued |
| 6.B.d3 | Lineup + events visual treatment | queued |
| 6.B.d4 | Article-link card (matchPreview / matchRecap) | queued |
| 6.B.d5 | `<MatchStatusBadge>` Direction-D audit | queued |
| 6.B.d6 | `<MatchTeaser>` reskin (default + compact) | queued — cross-cutting per #1528 |
| 6.B.d7 | `<MatchResultRow>` reskin | queued — cross-cutting per #1528 |
| 6.B.d8 | `<MatchStripClient>` audit | queued — cross-cutting per #1528 |

---

## Cross-references

- Phase 6 epic: #1528
- Phase 6.A lock pattern: `docs/design/mockups/phase-6-player-profile/data-reality-locked.md`
- Master plan §6.3 (updated 2026-05-22 to drop live): `docs/plans/2026-04-27-redesign-master-design.md`
- Phase 6.A brief cross-reference: `docs/design/phase-6-player-profile-brief.md` §4
- Article-variant dependency: #1470 (matchPreview / matchRecap article types)
- BFF schema: `packages/api-contract/src/schemas/match.ts`
- Current page: `apps/web/src/app/(main)/wedstrijd/[matchId]/page.tsx`
- Current view component: `apps/web/src/components/match/MatchDetailView/`
