# Phase 3 — Sanity CMS Design

**Date:** 2026-03-05
**Issue:** #724 (child of #720)
**Status:** Design approved, pending implementation plan

## Goal

Replace Drupal as the content backend with Sanity CMS. Set up `apps/studio/` in the monorepo, define schemas for all content types, migrate existing Drupal content, and switch `apps/web` data fetching from `DrupalService` to Sanity incrementally per content type.

Additionally: introduce a nightly PSD → Sanity sync via Cloudflare Worker cron to auto-manage player and team data (replacing the manual Drupal cron), and clean up the coach-as-player hack by unifying all staff into a proper `staffMember` type.

## Architecture Decision

**Option chosen: Cloudflare Worker cron + phased scope (A + C)**

- Nightly PSD → Sanity sync runs as a `scheduled` handler in the existing `apps/api` Cloudflare Worker
- Phase 3 scope: players + teams (confirmed PSD endpoints). Coaching staff sync deferred to Phase 4 (pending PSD endpoint investigation)
- Cloudflare free plan: 5 cron triggers per account, 10ms CPU time limit (safe — sync is I/O bound, not CPU bound)
- Upgrade path: Cloudflare Workers Paid ($5/month) trivially unlocks 15min cron CPU if dataset ever grows large enough to matter

Rejected alternatives:

- GitHub Actions sync: valid fallback but splits infrastructure unnecessarily now that BFF already lives in Cloudflare
- Manual player management: ruled out — editors need all players visible in Studio automatically

## Sanity Datasets

```
Sanity project
  ├── dataset: production   ← live site
  └── dataset: staging      ← migration validation + development
```

`SANITY_DATASET` env var controls which dataset the Worker cron and web app target. Migration script targets staging first, then production. Promote via `sanity dataset copy staging production`.

---

## Schema Design

Validated against existing Effect schemas in `apps/web/src/lib/effect/schemas/` and component utils in `apps/web/src/app/(main)/team/[slug]/utils.ts`.

### PSD-synced documents

#### `player`

| Field                      | Source    | Notes                                              |
| -------------------------- | --------- | -------------------------------------------------- |
| `psdId`                    | PSD sync  | Primary key for upserts                            |
| `firstName`, `lastName`    | PSD sync  |                                                    |
| `jerseyNumber`             | PSD sync  |                                                    |
| `positionPsd`              | PSD sync  | Short code: k/d/m/a/j — may be null                |
| `birthDate`, `nationality` | PSD sync  |                                                    |
| `height`, `weight`         | PSD sync  |                                                    |
| `joinDate`, `leaveDate`    | PSD sync  |                                                    |
| `psdImageUrl`              | PSD sync  | Fallback image URL (not transparent)               |
| `transparentImage`         | Editorial | Sanity image asset                                 |
| `celebrationImage`         | Editorial | First-team Instagram shares                        |
| `positionOverride`         | Editorial | Full Dutch name, takes priority over `positionPsd` |
| `bio`                      | Editorial | Portable Text                                      |

#### `team`

| Field                                                      | Source              | Notes                                                                         |
| ---------------------------------------------------------- | ------------------- | ----------------------------------------------------------------------------- |
| `psdId`                                                    | PSD sync            | Primary key                                                                   |
| `name`, `slug`                                             | PSD sync            | Slug auto-generated, used for nav + URLs                                      |
| `leagueId`, `league`, `division`, `divisionFull`, `season` | PSD sync            |                                                                               |
| `players`                                                  | PSD sync            | Array of `player` references                                                  |
| `tagline`                                                  | Editorial           | Short motto or division label override                                        |
| `body`                                                     | Editorial           | Portable Text — team description                                              |
| `contactInfo`                                              | Editorial           | Portable Text                                                                 |
| `teamImage`                                                | Editorial           | Sanity image asset                                                            |
| `trainingSchedule`                                         | Editorial           | Array of sessions: `{ day, time, location, type }`                            |
| `staff`                                                    | Editorial (Phase 3) | Array of `staffMember` references — PSD sync if endpoints confirmed (Phase 4) |

Note: `fbId`, `fbId2`, `vvId`, `vvId2` intentionally omitted — PSD ID is the single join key. Add later if needed; schema changes are non-destructive in Sanity.

### Editorial-only documents

#### `staffMember`

Unifies Drupal's split between `node--player` (coaches stored as players with `field_position_short`) and `node--staff` (board members). Single clean type in Sanity.

| Field                   | Source             | Notes                                                                                                               |
| ----------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `psdId`                 | PSD sync (Phase 4) | Optional until staff endpoints confirmed                                                                            |
| `firstName`, `lastName` | Editorial / PSD    |                                                                                                                     |
| `role`                  | Editorial          | Enum: `hoofdtrainer / assistent / keeperstrainer / tvjo / ploegdelegatie / afgevaardigde / coach / bestuur / other` |
| `birthDate`, `joinDate` | Editorial          |                                                                                                                     |
| `photo`                 | Editorial          | Sanity image asset                                                                                                  |
| `bio`                   | Editorial          | Portable Text                                                                                                       |

#### `article`

`title`, `slug`, `body` (Portable Text), `coverImage`, `tags` (string array), `featured` (bool), `relatedArticles` (refs), `publishAt`, `unpublishAt`

#### `sponsor`

`name`, `logo`, `url`, `type` (`crossing / training / white / green / panel / other`), `active` (bool)

Sponsor types map 1:1 to existing Drupal values — no remapping needed during migration.

#### `event`

`title`, `dateStart`, `dateEnd` (optional), `externalLink` (`{ url, label }`), `coverImage`

Note: no `location` field — not present in current Drupal data.

#### `page`

`title`, `slug`, `body` (Portable Text) — for static club pages

---

## Data Flow

### A — Nightly sync (PSD -> Sanity)

```
Cloudflare Worker scheduled handler (02:00 daily)
  -> fetch teams from PSD API
  -> fetch players per team from PSD API
  -> S.decodeUnknown(PsdTeam / PsdPlayer)   <- existing api-contract schemas
  -> upsert into Sanity via @sanity/client
      patch by psdId: setIfMissing + set on PSD fields only
      never touches editorial fields (transparentImage, bio, trainingSchedule...)
  -> log result to Cloudflare Worker logs
```

### B — Runtime: roster pages (Sanity only)

```
Next.js page (ISR, revalidate: 3600)
  -> sanityClient.fetch(GROQ)
  -> team + embedded players + staff in one query
  -> no Drupal, no BFF call for roster display
```

### C — Runtime: team page with live match data (Sanity + BFF)

```
Next.js team page
  -> parallel:
      sanityClient.fetch(team + roster)     <- editorial + roster
      BffService.getMatches(psdTeamId)      <- live results + schedule
      BffService.getRanking(psdTeamId)      <- standings
  -> merge in page: team/roster from Sanity, matches/ranking from BFF
  -> psdId on Sanity team doc is the join key -- no BffService changes needed
```

### D — Studio: "Needs enrichment" view

```groq
*[_type == "player" && !defined(transparentImage)] | order(lastName asc)
```

Pinned as a custom list in Studio desk structure. No plugin — GROQ filter in desk structure config only.

---

## Migration Strategy

One-time script in `scripts/drupal-to-sanity/`. Runs locally, writes to remote Sanity dataset via API.

**Migration order (lowest risk first):**

| Step | Content type      | Notes                                                               |
| ---- | ----------------- | ------------------------------------------------------------------- |
| 1    | `sponsor`         | No relations, simple fields                                         |
| 2    | `event`           | No relations, small dataset                                         |
| 3    | `article`         | Largest dataset — rich text needs manual Studio review after import |
| 4    | `staffMember`     | Merge `node--player` coaches + `node--staff` board into one type    |
| 5    | `team` + `player` | Not migrated by script — first cron run is the source of truth      |

**Rich text:** Drupal `body.processed` (HTML) -> Portable Text via `@portabletext/to-portable-text`.

**Images:** Download from Drupal CDN -> re-upload to Sanity asset pipeline in migration script.

---

## Incremental cutover in `apps/web`

For each content type, after staging is verified:

1. Add `SanityService` method for the type
2. Update the page to read from `SanityService` instead of `DrupalService`
3. Delete the Drupal schema file and `DrupalService` method for that type
4. Deploy and verify on production

---

## Decommission

Phase 3 complete when:

- All 5 content types served from Sanity
- `DrupalService.ts` deleted
- All Drupal Effect schema files deleted (`article`, `event`, `sponsor`, `staff`, `team`, `player`, `media`, `file`, `taxonomy`...)
- `DRUPAL_BASE_URL` removed from Vercel env vars
- Drupal hosting cancelled

The `drupal-api-analyzer` skill stays in `.claude/skills/` as historical reference until decommission is confirmed complete.

---

## Open questions (Phase 4 investigation)

- Does PSD expose coaching staff endpoints? (`team -> staff`, `staff -> profile`)
- If yes: extend cron to sync `staffMember` docs and link to teams automatically
- If no: `staffMember` stays editorial-only permanently
