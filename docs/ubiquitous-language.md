# KCVV Elewijt — Ubiquitous Language

> Canonical glossary for every concept in the KCVV monorepo.
> **Rule:** English in code, Dutch in UI (labels, slugs, display values).
> Each concept lists the **code term** and the **Dutch UI term** where applicable.

---

## Core Domain

### Match

A single football game between two sides. The canonical term throughout the codebase — never "game" or "fixture."

| Code          | Dutch           | Notes                                         |
| ------------- | --------------- | --------------------------------------------- |
| `Match`       | Wedstrijd       | Basic match data (date, teams, score, status) |
| `MatchDetail` | Wedstrijddetail | Extended with lineup, events, report flag     |

**Route:** `/wedstrijd/[matchId]` (see [#819])

**Source:** PSD API (`PsdGame` is a raw implementation detail in the BFF, never exposed).

### Match Status

The lifecycle state of a match.

| Code        | Dutch      | Meaning                                          |
| ----------- | ---------- | ------------------------------------------------ |
| `scheduled` | Gepland    | Not yet played, no score                         |
| `finished`  | Afgelopen  | Played, final score available                    |
| `forfeited` | Forfait    | Awarded by forfeit (FF)                          |
| `postponed` | Uitgesteld | Cancelled/rescheduled (AFG or `cancelled: true`) |
| `stopped`   | Gestaakt   | Ended prematurely (STOP), may be replayed        |

**Status derivation:** PSD numeric code + `cancelled` boolean + presence of goals → `MatchStatus`. See `mapGameStatus()` in `apps/api/src/psd/transforms.ts`.

### Match Side

A participant in a match — either the home or away side. Could be a KCVV team or an opponent.

| Code                      | Notes                                     |
| ------------------------- | ----------------------------------------- |
| `MatchTeam`               | Value object: `{ id, name, logo, score }` |
| `home_team` / `away_team` | Fields on `Match`                         |

**Not a standalone entity.** Opponents only exist within match context. The `id` comes from PSD's club registry and can be used to link matches against the same opponent (future feature).

### Lineup

The players selected for a specific match, with their match-level roles.

| Code                | Dutch      | Notes                                                      |
| ------------------- | ---------- | ---------------------------------------------------------- |
| `MatchLineup`       | Opstelling | `{ home: MatchLineupPlayer[], away: MatchLineupPlayer[] }` |
| `MatchLineupPlayer` | —          | Individual player in a lineup                              |

### Lineup Status

A player's role within a single match lineup.

| Code          | Dutch        | Meaning                    |
| ------------- | ------------ | -------------------------- |
| `starter`     | Basisspeler  | In the starting eleven     |
| `substitute`  | Wisselspeler | On the bench, did not play |
| `substituted` | Gewisseld    | Started, was taken off     |
| `subbed_in`   | Ingevallen   | Came on as a replacement   |
| `unknown`     | Onbekend     | Status not determinable    |

### Card Type

A disciplinary card shown during a match.

| Code            | Dutch       |
| --------------- | ----------- |
| `yellow`        | Geel        |
| `red`           | Rood        |
| `double_yellow` | Tweede geel |

### Competition

The type of tournament a match belongs to. Stored on `Match.competition`.

| Code (PSD `type`) | Dutch label       | Notes                                                          |
| ----------------- | ----------------- | -------------------------------------------------------------- |
| `LEAGUE`          | Competitie        | Regular league play                                            |
| `CUP`             | Beker             | Cup tournament (specific name from PSD `competitionType.name`) |
| `FRIENDLY`        | Vriendschappelijk | Friendly match                                                 |

**Open:** PSD also returns `competitionType.name` (e.g. "Beker van Brabant"). This should be mapped to a Dutch display label. See PRD.

---

## Team & Squad

### Team

A KCVV team registered with the club and (usually) with the football federation.

| Code                     | Dutch | Notes                                        |
| ------------------------ | ----- | -------------------------------------------- |
| `team` (Sanity document) | Ploeg | Full entity: roster, training, staff, league |
| `PsdTeam`                | —     | Raw PSD shape (BFF implementation detail)    |

**Properties:**

- `psdId` — PSD identifier
- `name` — Official name (from PSD)
- `age` — Age group: `"A"` (seniors) or `"U{N}"` (youth, e.g. `"U17"`)
- `gender` — `"mannen"` or `"mixed"`
- `footbelId` — Federation registration (null for unregistered youth teams)
- `division` / `divisionFull` — Editorial subdivision label (e.g. "U9 - Wit", "Eerste Elftal A - 3e Nationale A")
- `showInNavigation` — Single visibility flag: controls nav, team listings, **and** match widget inclusion

**Removed fields:** `league`, `leagueId` — dead fields, never synced, never rendered.

### Squad

The group of players registered to a team for the current season. Represented as `team.players[]` in Sanity.

| Code  | Dutch           | Notes                     |
| ----- | --------------- | ------------------------- |
| Squad | Selectie / Kern | Season-level player group |

**Not a standalone entity** — it's the `players[]` reference array on a Team document. Changes when players are added/removed between seasons or transfer windows.

**Distinct from Lineup:** Squad = season scope, Lineup = match scope.

### Squad Label

A display label identifying which KCVV team a match belongs to. Shown in match widgets when displaying matches across multiple teams.

| Code         | Dutch         | Notes                                           |
| ------------ | ------------- | ----------------------------------------------- |
| `squadLabel` | Ploeg (label) | Derived from team name, e.g. "A-ploeg", "U15 A" |

**Replaces:** the misnamed `round` field. Currently hardcoded (`teamId 1 → "A-ploeg"`); should derive from Sanity team name.

### Age Group

The age category of a team, from PSD.

| Value                           | Meaning                 |
| ------------------------------- | ----------------------- |
| `"A"`                           | Seniors (eerste elftal) |
| `"U21"`, `"U17"`, `"U15"`, etc. | Youth (jeugd)           |

Multiple teams can share the same age group (e.g. three U9 teams distinguished by `division`).

### Youth Division (Afdeling)

The three-tier grouping of youth teams used by the club internally and by parents. Derived client-side from the age group — not stored in any data source.

| Code / Label   | Dutch      | Age range | Teams                    |
| -------------- | ---------- | --------- | ------------------------ |
| `"Bovenbouw"`  | Bovenbouw  | U17–U21   | U21, U19, U17            |
| `"Middenbouw"` | Middenbouw | U12–U16   | U16, U15, U14, U13, U12  |
| `"Onderbouw"`  | Onderbouw  | U6–U11    | U11, U10, U9, U8, U7, U6 |

**Implementation:** `getYouthDivision()` in `apps/web/src/lib/utils/group-teams.ts`. Used for section headers on `/ploegen` and `/jeugd`, and as a badge on individual team detail pages.

**Vocabulary rule:** Always use Bovenbouw/Middenbouw/Onderbouw — never the older terms "scholieren" or "duiveltjes."

---

## Player

### Player

An athlete registered with the club. Synced from PSD, editorially enriched in Sanity.

| Code                             | Dutch  | Notes                         |
| -------------------------------- | ------ | ----------------------------- |
| `player` (Sanity document)       | Speler | PSD-synced + editorial fields |
| `PsdMember` (status: `"speler"`) | —      | Raw PSD shape                 |

**PSD-synced fields (read-only):** `psdId`, `firstName`, `lastName`, `birthDate`, `nationality`, `keeper`, `positionPsd`, `psdImage`

**Editorial fields:** `jerseyNumber`, `height`, `weight`, `position`, `transparentImage`, `celebrationImage`, `bio`

**No player status concept.** Players are either on a squad (referenced from team) or not. No injured/suspended/transferred tracking.

### Position

A player's playing position. Determined by fallback hierarchy:

1. `keeper === true` → **Keeper**
2. `position` (editorial, manual) → one of the enum values
3. `positionPsd` (from PSD `bestPosition`) → free text
4. Fallback → **Speler**

| Code                | Dutch        |
| ------------------- | ------------ |
| `goalkeeper`        | Keeper       |
| `defender`          | Verdediger   |
| `midfielder`        | Middenvelder |
| `forward`           | Aanvaller    |
| `player` (fallback) | Speler       |

---

## Staff & Organisation

### Staff Member

A non-playing member of the club (coaches, board, admin). Synced from PSD, editorially enriched in Sanity.

| Code                            | Dutch   | Notes                         |
| ------------------------------- | ------- | ----------------------------- |
| `staffMember` (Sanity document) | Staflid | PSD-synced + editorial fields |
| `PsdMember` (status: `"staff"`) | —       | Raw PSD shape                 |

### Role

What a staff member does. The canonical term for staff function — **"position" is reserved for players only.**

| Field                                   | Purpose                                                         |
| --------------------------------------- | --------------------------------------------------------------- |
| `role`                                  | Controlled enum (canonical): `hoofdtrainer`, `voorzitter`, etc. |
| `roleLabel` (currently `positionTitle`) | Free-text display override for organigram                       |
| `roleCode` (currently `positionShort`)  | Short badge code, editorial (e.g. "T1", "VP")                   |

**PSD provides:** `functionTitle` (free text) — stored but not displayed.

### Department

Organisational grouping for staff members.

| Code           | Dutch        | Meaning                                         |
| -------------- | ------------ | ----------------------------------------------- |
| `hoofdbestuur` | Hoofdbestuur | Main board                                      |
| `jeugdbestuur` | Jeugdbestuur | Youth board                                     |
| `algemeen`     | Algemeen     | Catch-all for staff not clearly in either board |

### Organigram

The hierarchical org chart of staff members. Built from `parentMember` references. Visualised at `/club/organigram`.

---

## Content

### Article

A news article published on the website.

| Code                        | Dutch                   | Notes |
| --------------------------- | ----------------------- | ----- |
| `article` (Sanity document) | Artikel / Nieuwsbericht | —     |

**Visibility:** Time-bound. Visible when `publishedAt ≤ now ≤ unpublishAt`.

**Route:** `/nieuws/[slug]` (see [#819])

### Event

A club event or announcement.

| Code                      | Dutch     | Notes |
| ------------------------- | --------- | ----- |
| `event` (Sanity document) | Evenement | —     |

**Visibility:** Date-driven. Shown until `dateEnd` has passed (or `dateStart` if no end date).

### Sponsor

A partner or sponsor of the club.

| Code                        | Dutch   | Notes |
| --------------------------- | ------- | ----- |
| `sponsor` (Sanity document) | Sponsor | —     |

**Visibility:** Manually toggled via `active` boolean.

**Sponsor packages** (current, subject to change):

| Code       | Dutch    |
| ---------- | -------- |
| `crossing` | Crossing |
| `training` | Training |
| `white`    | Wit      |
| `green`    | Groen    |
| `panel`    | Paneel   |
| `other`    | Andere   |

These are **package names, not a ranked hierarchy.** The ordering and naming may change when sponsor packages are redesigned.

### Page

A generic static content page.

| Code                     | Dutch  | Notes                             |
| ------------------------ | ------ | --------------------------------- |
| `page` (Sanity document) | Pagina | Title + slug + portable text body |

### Banner

A promotional image shown on the homepage in designated slots (A, B, C).

### Responsibility

A help/guidance topic that directs users to the right contact person. Displayed at `/hulp`.

| Code                               | Dutch                | Notes                                             |
| ---------------------------------- | -------------------- | ------------------------------------------------- |
| `responsibility` (Sanity document) | Verantwoordelijkheid | Currently `responsibilityPath` — to be simplified |

**Visibility:** Manually toggled via `active` boolean.

**Indexed for semantic search** via Cloudflare Vectorize (nightly sync).

### Audience

Who a responsibility is relevant for. User-facing, Dutch.

| Code        | Dutch     |
| ----------- | --------- |
| `speler`    | Speler    |
| `ouder`     | Ouder     |
| `trainer`   | Trainer   |
| `supporter` | Supporter |
| `niet-lid`  | Niet-lid  |
| `andere`    | Andere    |

### Category

Topic classification for responsibilities. User-facing, Dutch.

| Code             | Dutch          |
| ---------------- | -------------- |
| `medisch`        | Medisch        |
| `sportief`       | Sportief       |
| `administratief` | Administratief |
| `gedrag`         | Gedrag         |
| `algemeen`       | Algemeen       |
| `commercieel`    | Commercieel    |

---

## Statistics & Ranking

### Player Stats

Season-level statistics for a player within a team.

| Field                        | Meaning                |
| ---------------------------- | ---------------------- |
| `matches_played`             | Total appearances      |
| `goals`                      | Goals scored           |
| `assists`                    | Assists (if available) |
| `yellow_cards` / `red_cards` | Disciplinary record    |
| `minutes_played`             | Total minutes on pitch |

### Team Stats

Aggregated season statistics for a team.

| Field                             | Meaning                           |
| --------------------------------- | --------------------------------- |
| `total_matches`                   | Matches played                    |
| `wins` / `draws` / `losses`       | Results breakdown                 |
| `goals_scored` / `goals_conceded` | Goal record                       |
| `clean_sheets`                    | Matches without conceding         |
| `top_scorers`                     | `PlayerStats[]` — leading scorers |

### Ranking Entry

A row in the league standings table.

| Field                                             | Meaning                         |
| ------------------------------------------------- | ------------------------------- |
| `position`                                        | League position (1st, 2nd, ...) |
| `team_id` / `team_name`                           | The team in this row            |
| `played` / `won` / `drawn` / `lost`               | Match record                    |
| `goals_for` / `goals_against` / `goal_difference` | Goal record                     |
| `points`                                          | Total points                    |

---

## Infrastructure

### BFF (Backend For Frontend)

The Cloudflare Worker in `apps/api/`. Transforms raw PSD data into normalised `@kcvv/api-contract` schemas. Handles caching, search, and PSD↔Sanity sync.

**Term:** Always "BFF" — distinguishes from PSD API (external) and Drupal API (deprecated).

### PSD API (ProSoccerData)

External sports data provider. Source of truth for matches, rankings, statistics, players, teams, and staff membership.

### Sanity CMS

Content management system. Source of truth for editorial content (articles, events, sponsors, pages, responsibilities) and editorially-enriched player/team/staff data.

### Footbalisto

Legacy name for the PSD API integration layer in the BFF, now renamed to `PsdService` in `apps/api/src/psd/`. The `footbalisto.be` domain is still owned and may be used as a custom Worker domain. **Do not use "Footbalisto" for new code — use "PSD" or "BFF".**

### PSD↔Sanity Sync

Nightly cron job that synchronises player, team, and staff data from PSD into Sanity documents. Cursor-based: one team per invocation, full rotation over N nights.

**Rule:** Sync only writes PSD-owned fields. Editorial fields (position, images, bio, training schedule, etc.) are never overwritten.

---

## Navigation Concepts

### Club

A **navigation grouping**, not a domain entity. The `/club` route prefix collects pages about the club's organisation: board, organigram, contact, history.

**Needs:** a landing page at `/club` (currently 404).

### Youth (Jeugd)

A **navigation section** for youth teams. Route: `/jeugd`.

---

## Visibility Rules

Each content type has its own visibility logic. There is no universal "published" concept.

| Type                       | Visible when...                            |
| -------------------------- | ------------------------------------------ |
| Article                    | `publishedAt ≤ now ≤ unpublishAt`          |
| Event                      | `dateEnd ≥ now` (or `dateStart` if no end) |
| Sponsor                    | `active === true`                          |
| Responsibility             | `active === true`                          |
| Team (nav + match widgets) | `showInNavigation === true`                |

---

## Naming Conventions

### Casing

| Context                  | Convention          | Example                         |
| ------------------------ | ------------------- | ------------------------------- |
| API contract fields      | `snake_case`        | `home_team`, `goals_for`        |
| TypeScript types/classes | `PascalCase`        | `MatchDetail`, `RankingEntry`   |
| Sanity document fields   | `camelCase`         | `firstName`, `showInNavigation` |
| URL slugs                | `kebab-case`, Dutch | `/wedstrijd/`, `/nieuws/`       |
| Effect Schema classes    | `PascalCase`        | `Match`, `PlayerStats`          |

### Prefixes

| Prefix    | Meaning                                               |
| --------- | ----------------------------------------------------- |
| `Psd*`    | Raw PSD API shape (BFF implementation detail)         |
| `Match*`  | Match-scoped concept                                  |
| `Sanity*` | Web-layer view model projected from Sanity GROQ query |

[#819]: https://github.com/soniCaH/www.kcvvelewijt.be/issues/819
