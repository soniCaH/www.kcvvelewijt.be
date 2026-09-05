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

### Pitch-Reservation Placeholder

A fixture where both sides are the same club (`home_team.id === away_team.id`). The association's device for "this team has something on the calendar that day, the details aren't settled yet" — used for the club's own youth tournaments and for external tournaments/friendlies alike (#2606). Not a bug in the feed; not derivable from `competition`/`competitionType` (a genuine tournament fixture with a real opponent carries the same values).

| Code                    | Notes                                                                                                                                                    |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Match.is_placeholder`  | Contract field (optional boolean), computed by the BFF from club-id equality                                                                             |
| `ScheduleReservation`   | Web view-model — the `kind: "reservation"` member of `ScheduleRow`, carrying one `team` (never `homeTeam`/`awayTeam`) and no score (#2688)               |
| `UpcomingReservation`   | Web view-model — the `UpcomingRow` reservation member, used by the homepage's other-teams agenda (#2688)                                                 |
| `CalendarReservation`   | Web view-model — the `CalendarMatch` reservation member on `/kalender`, carrying one `club` (#2802). Replaced the flat `isPlaceholder: boolean` route VM |
| `reservationView()`     | `apps/web/src/lib/utils/match-display.ts` — the shared subject/status derivation every renderer of a reservation uses                                    |
| `reservationRowLabel()` | `apps/web/src/lib/utils/match-display.ts` — the shared accessible-name sentence every reservation row's `aria-label` builds from (#2688)                 |

**Render rule:** never a second crest, a score slot, a home/away side, a reason line for the missing opponent, or a click-through link — the row/page states only what it has (date, subject, real time). `<TeamAgendaRow>` (#2606) is the prior art every other surface (`<MatchStripView>`, `<UpcomingMatchesClient>`, `/kalender`'s three view modes, `/wedstrijd/[matchId]`) matches rather than re-deriving (#2688).

**Enforcement (as of [#2802]):** all three row families — `ScheduleRow`, `UpcomingRow` and `/kalender`'s `CalendarMatch` — are three-member discriminated unions over a literal `kind` (`"match"` / `"reservation"` / `"reduced"`), built once by the three adapters (`components/match/transform.ts`, `app/(main)/kalender/utils.ts`, `lib/mappers/match.mapper.ts`). The reservation and reduced members do not carry `homeTeam`/`awayTeam`/scores at all, so a renderer reaching for the scoreboard without narrowing `kind` fails to compile rather than printing "KCVV Elewijt — KCVV Elewijt". The wire contract itself (`packages/api-contract`, `apps/api/src/psd/transforms.ts`) stays untouched by this — `transforms.ts` documents the byte-size half of why (`|| undefined` sparing every KV-cached payload), but the sharper reason this union is strictly a web-side boundary is deploy safety: a `Match`/`MatchDetail` shape change decoded against payloads a still-warm KV cache wrote under the old shape risks a wave of decode failures landing at once, each one re-fetching PSD and stampeding it with 429s.

`isPlaceholder` stays on every member and still answers its own question (is this a self-match), but it no longer separates every case: a reduced row carries `false` too, so `kind` is the discriminant for the three-way split.

Two surfaces stay deliberately outside the union, both `noindex` and unlinked, both reading the raw contract `Match`: `/share`'s `MatchOption` and `/scheurkalender`'s `ScheurkalenderMatch` ([#2699] decision 2 — a KCVV-vs-KCVV row there is ugly, not wrong). `MatchHeroProps` keeps a plain `isPlaceholder: boolean` plus `competitionType`, and derives the reduced register through the shared predicate; it is fed field-by-field from `MatchDetail`, not by an adapter. Both of `/nieuws/[slug]`'s public `MatchDetail` surfaces are covered the same way: `toHeroMatchData` (`nieuws/[slug]/utils.ts`) returns `null` for either reduced state, and the article `SportsEvent` JSON-LD (`nieuws/[slug]/page.tsx`) is gated on the same `isReducedMatchRow` check `/wedstrijd/[matchId]` applies to its own `SportsEvent`. "Never a click-through" is locked by the table-driven test in `app/__tests__/reservation-never-links.test.tsx` ([#2801]).

### Reduced Row

The **register** a row/page renders in when it has no confirmed two-sided fixture to show: one crest, a mono subject line, the real time, no score slot, no home/away side, no link. Distinct from the two **states** that render in it — a [Pitch-Reservation Placeholder](#pitch-reservation-placeholder) (no opponent exists) and a not-yet-played tournament fixture (an opponent exists but PSD does not say whether the named club hosts the tournament or merely shares its bracket, #2696).

| Code                   | Notes                                                                                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `isReducedMatchRow()`  | `apps/web/src/lib/utils/match-display.ts` — the one predicate deciding the register. Gated on a scoreline existing, not on `isPlayedMatch` (#2696) |
| `ScheduleReducedMatch` | The `kind: "reduced"` member of `ScheduleRow` — one `team` (the other club, by club id), no `homeTeam`/`awayTeam`/scores (#2802)                   |
| `UpcomingReducedMatch` | The same member on the homepage other-teams agenda ([#2802])                                                                                       |
| `CalendarReducedMatch` | The same member on `/kalender`, carrying one `club` ([#2802])                                                                                      |

**A reduced row is not a permanent classification.** The three adapters re-ask `isReducedMatchRow()` on every call, so the moment PSD publishes a scoreline the same fixture id transforms into the `"match"` member and the row reverts to the full scoreboard — the club really was the opponent after all. That transition is asserted in all three adapters' tests ([#2802]).

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
| `TOURNAMENT`      | Tornooi           | Tournament fixture                                             |

**Open:** PSD also returns `competitionType.name` (e.g. "Beker van Brabant"). This should be mapped to a Dutch display label. See PRD.

### Reeks

The specific division a team is placed in for a competition — `3de Afdeling Voetb Vl A`, `Gewestelijke U13`. Distinct from [Competition](#competition), which is the _kind_ of tournament.

A reeks is named in **two vocabularies** and both are correct: the federation's (PSD `competition.name`, prefixed `Voetbal : <bond> -` plus a trailing space) and the club's (Sanity `divisionFull`). `3de Afdeling Voetb Vl A` and `3e Nationale VV A` are the same reeks. The club's name wins on anything a human reads; PSD's fills the gap where no editorial value is set (#2589).

**Only PSD carries a reeks per competition.** A match carries none — the fixture feed knows only `OFFICIAL`/`CUP`/`FRIENDLY`/`TOURNAMENT`. Sanity carries one per _team_, which cannot name two phases.

### Competition Phase

A youth season is split in two by the winter break, and **the second half is frequently a different reeks with different opponents** — not a return round. Measured over 2025-2026: U13 shared **0 of 7** opponents between its phases, U17 shared 4 of 7, and U7 had no autumn competition at all. Senior teams do not have this: the A-team plays one continuous home-and-away league (14 of 15 opponents shared).

**Consequences:** a team can hold more than one ranking table in a single season, so a table is identified by PSD `competition_id`, never by its name or its position in the array. Phases are named `Najaar` and `Voorjaar`, and only when the fixtures prove the ordering — see #2589. PSD exposes no phase field; the association's own convention encodes it in the reeks _code_ (`G15BS` → a `2` appears in the second phase), which is not a contract and is not parsed.

### Season

Which football year it currently is (e.g. "25/26"). **Not a datum any document stores.** Every season label the site renders is derived client-side from a date the surface already holds, never read from a stored "current season" field:

| surface                                          | derives from         |
| ------------------------------------------------ | -------------------- |
| `MatchHero.formatSeasonLabel(date)`              | the match's own date |
| `groupBySeason()` (`lib/utils/season.ts`)        | each match's date    |
| `/scheurkalender` `seasonLabel(matches[0].date)` | the first fixture    |

**Removed:** `team` used to carry a `season` field (`readOnly`, "gesynchroniseerd vanuit PSD"). It never had a writer — absent from `PsdTeam`, never written by `psd-sanity-sync.ts` — so it went dark on all 26 production documents and stayed that way through an entire redesign. Deleted in #2567 along with every reader of it: a `TeamHero` meta pill, `TeamHero`'s decorative artefact-column stub, both `TeamFlagship` cards on `/ploegen`, `PlayerHero`'s ticket-stub on `/spelers/[slug]` (fed by `team.season` through the player query's `currentTeam` projection, not a player-owned field), and that GROQ projection itself. None of the five moved a pixel when the field went. If a future feature needs "what season is it right now" as a genuine input (not derived from a date already in hand), it needs a real writer — PSD's own `/seasons` endpoint is an internal id-resolver, not a display source — before the field comes back. See **The Writer Rule** in `apps/web/CLAUDE.md` for the general principle this follows.

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
- `displayName` — Editorial override for the [Team Display Name](#team-display-name). Optional; empty on all 18 teams, so every heading currently comes from the slug-derived fallback
- `age` — Age group: `"A"` (seniors) or `"U{N}"` (youth, e.g. `"U17"`)
- `gender` — `"mannen"` or `"mixed"`
- `footbelId` — Federation registration (null for unregistered youth teams)
- `division` / `divisionFull` — The club's own name for the team's [Reeks](#reeks): short code and long form (`3 VV A` / `3e Nationale VV A`). Measured in production 2026-08-13: set on **exactly the 3 senior docs**, null on all 16 youth. Not a team-variant label — a "U9 - Wit" style distinction lives in the team's own name.
- `showInNavigation` — Single visibility flag: controls nav, team listings, **and** match widget inclusion

**Removed fields:** `league`, `leagueId` — dead fields, never synced, never rendered. `season` — never had a writer; see [Season](#season) (#2567).

### Team Display Name

What a team is **called** on any surface a human reads — the page heading, the browser tab, the share card, a listing row. Distinct from `name`, which is the team's registered identity as PSD holds it.

| Code                | Dutch        | Notes                                             |
| ------------------- | ------------ | ------------------------------------------------- |
| `displayName`       | Weergavenaam | Editorial override on the Team document; optional |
| `teamDisplayName()` | —            | The single helper every human-facing surface uses |

**Resolution order:** `displayName` → a label derived from the team's slug → `name`.

**Why an editorial field and not `name`:** `name` is PSD-owned. It is `readOnly` in the Studio and re-patched on every sync, so an edit there does not survive. Renaming in PSD works but the **slug is derived from the name**, so a reword moves the team's URL.

**Not used for:** JSON-LD. `SportsTeam.name` is a machine-readable claim about a federation-registered entity and stays on `name`.

**Vocabulary rule:** an Age Group is never a display name — see below.

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

**Replaces:** the misnamed `round` field. Currently hardcoded (`teamId 1 → "A-ploeg"`).

**Should resolve via [Team Display Name](#team-display-name)** — it is the same question ("what is this team called?") asked in a match context, and answering it twice is how the naming rules drifted apart in the first place (#2539).

### Age Group

The age category of a team, from PSD.

| Value                           | Meaning                 |
| ------------------------------- | ----------------------- |
| `"A"`                           | Seniors (eerste elftal) |
| `"U21"`, `"U17"`, `"U15"`, etc. | Youth (jeugd)           |

Multiple teams can share the same age group (e.g. three U9 teams distinguished by `division`). Measured in production 2026-08-13: `A` is shared by four teams, `U17` by two, `U10` by two.

**An age group is a competition band, not an identity.** It answers "which competition does this team play in?", never "which team is this?". Using it as a display name is what published three team pages under another team's heading (#2539) — the data was correct throughout. Anything a human reads resolves through [Team Display Name](#team-display-name).

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
2. `position` (editorial, manual) → one of the enum values, **including `Speler`**
3. `positionPsd` (from PSD `bestPosition`) → free text
4. Neither set → **absent**, not defaulted

Code no longer fills an unset position with a generic literal — see **The Writer Rule** in `apps/web/CLAUDE.md`. `PlayerHero`'s meta row and `PlayerCard`'s label both render an unset position as absent, distinguishable from an authored one (#2567). `SquadGrid`'s trailing group is different: its `"Spelers"` heading is a **UI label for "unmapped or unauthored"**, not a rendering of the datum itself, so a player who was deliberately authored `Speler` and a player with no position at all land under the identical heading — measured 2026-08-17, that catch-all holds 184 of 231 active players (80%). The rule's "distinguishable from an authored one" guarantee holds at the field and at the two labelled surfaces above; it does not extend to this grouping heading.

`Speler` itself is **not removed from the dropdown** — it stays a deliberate, authored choice (`packages/sanity-schemas/src/player.ts`'s `position` enum), distinct from an unset field. It is the honest answer for U6–U9, where no finer position exists yet (#2535): an editor picking `Speler` for a young player and an editor never opening the field are now distinguishable, which is the whole point of removing the code-level default.

| Code                             | Dutch        |
| -------------------------------- | ------------ |
| `goalkeeper`                     | Keeper       |
| `defender`                       | Verdediger   |
| `midfielder`                     | Middenvelder |
| `forward`                        | Aanvaller    |
| `player` (editorial, e.g. U6–U9) | Speler       |

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

### Competitive Block

The `#klassement` + `#wedstrijden` pair on a team page, gated as **one unit** rather than two independent sections. What it shows is keyed to the data — never to the age group, and never to last season.

| Code                   | Dutch surface  | Meaning                                                                                                                                                                                                       |
| ---------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `not-in-competition`   | status line    | The club has no official league fixture for this team this season. Neither section renders.                                                                                                                   |
| `fixtures-unavailable` | status line    | The **fixtures** read failed **permanently**. Without fixtures there is no way to tell the team is in competition at all, so neither section renders — the same collapse as `not-in-competition`.             |
| `ranking-unavailable`  | failure notice | The **ranking** read failed **permanently** while the fixtures read fulfilled ([#2795]). `#wedstrijden` renders in full; only the klassement slot is replaced, by a failure notice, not `<StandingsSection>`. |
| `no-table`             | De reeks       | In competition; the association has published no row yet.                                                                                                                                                     |
| `numberless`           | De reeks       | In competition; every published entry reads zero played and zero points.                                                                                                                                      |
| `live`                 | Klassement     | At least one published table carries real numbers.                                                                                                                                                            |

**The gate** is at least one fixture whose competition type is `league` in the current season — never "the ranking has rows" (the ranking arrives months after the fixtures) and never the phase's association code.

**`ranking-unavailable` is not `no-table`.** `no-table` is a _value_: the ranking read fulfilled with zero rows. `ranking-unavailable` is the read never fulfilling a value at all. Conflating the two would report a broken read as "not published yet," which is false.

**Rule: a failure is not a section.** The two status-line states, plus `ranking-unavailable`'s klassement-slot failure notice, carry no `<h2>`, no `id` and no sticky-nav chip for that slot. This is the one deliberate exception to the team page's rule that every nav chip leads to a section that renders — `ranking-unavailable`'s `#wedstrijden` chip is unaffected, since that section still renders in full.

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

### Permanent vs Transient Read Failure

Every BFF read failure is one of exactly two kinds, and the kind decides what the page does. This split is the reason a broken team page degrades instead of going dark forever.

| Kind          | Meaning                                                                                                     | What the page does                                                         |
| ------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| **Permanent** | A stale or mistyped PSD id, or a response this deploy can no longer decode. Every retry fails the same way. | Degrade to a value and render. There is no last-good page to fall back to. |
| **Transient** | A timeout, a 502/503, a network blip. The next regeneration will probably succeed.                          | Let it reject, so the render throws and ISR serves the last-good page.     |

**Rule:** one list owns the split (`PERMANENT_BFF_TAGS`). Nothing hand-types a second copy — a tag added to only one copy would silently disagree, with no compiler or test signal.

**Known hole:** a permanent classification is inferred from the error tag, and one tag is ambiguous — a response that fails to decode looks the same whether PSD changed its shape (genuinely permanent) or the Worker died mid-response (transient). Tracked in [#2782].

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
[#2699]: https://github.com/soniCaH/www.kcvvelewijt.be/issues/2699
[#2782]: https://github.com/soniCaH/www.kcvvelewijt.be/issues/2782
[#2795]: https://github.com/soniCaH/www.kcvvelewijt.be/issues/2795
[#2801]: https://github.com/soniCaH/www.kcvvelewijt.be/issues/2801
[#2802]: https://github.com/soniCaH/www.kcvvelewijt.be/issues/2802
