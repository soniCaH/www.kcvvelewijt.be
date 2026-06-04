# ProSoccerData Club API Reference

> **Full spec:** `docs/psd-club-api-spec.json` (Swagger 2.0, 387KB)
> **Swagger UI:** https://kcvv.prosoccerdata.com/api/v2/swagger-ui.html?urls.primaryName=club-api
> **Base URL:** `https://clubapi.prosoccerdata.com`

## Authentication (required on every request)

```http
x-api-key:       <PSD_API_KEY>
x-api-club:      <PSD_API_CLUB>
Authorization:   <PSD_API_AUTH>
Accept-Language: nl-BE
Content-Type:    application/json
```

---

## Endpoints used by KCVV BFF

### Seasons

#### `GET /seasons/current`

Returns the current active season. No params needed.

```typescript
Season {
  id: number
  name: string   // e.g. "2024-2025"
  start: string  // ISO date
  end: string    // ISO date
}
```

#### `GET /seasons`

Returns `Season[]` — full list. Use `/seasons/current` instead.

---

### Games / Matches

#### `GET /games/team/{teamId}`

Get all games for a team (current season, paginated).

**Query params:**

- `page`: page number
- `size`: page size
- `since`: filter updated since (dd-MM-yyyyHH:mm:ss)
- `until`: filter updated until (dd-MM-yyyyHH:mm:ss)

Returns `GameVO` (paginated wrapper). Use this for the match list — no season ID needed.

#### `GET /games/team/{teamId}/seasons/{seasonId}`

Get games for a specific season. Returns `Game`.

**Note from Lambda code:** response is `{ content: [Game] }` (paginated, despite spec showing single `Game`).

#### `GET /games/{id}`

Get a single game. Returns full `Game` object.

#### `GET /games/{id}/info`

Get full game information. Returns `GameInformation`.

```typescript
GameInformation {
  id: number
  gameId: number
  game: Game
  season: Season
  team: Team
  gameFormations: GameFormation[]  // tactical lineup with positions
  gameSubstitutions: GameSubstitution[]
  gameHighlights: GameHighlightDTO[]
  isLegacy: boolean  // true = old { general, lineup, substitutes, events } format
  legacy: boolean
  reportGeneral: string
  // ... more report fields
}
```

**Note:** The Lambda used `{ general, lineup, substitutes, events }` which is the **legacy format** from an older PSD API version. Use the new `GameInformation` format for new development.

#### `GET /games/{id}/gameselections?includeMemberPositions=true`

Get squad selection with player positions for **both teams**. `teamId` is optional — omit it to get home + away lineups in one call, which is what you want for the match detail page.

**This is the solution for keeper/position identification.**

Returns `GameSelectionWithMemberPositionsDTO[]`:

```typescript
GameSelectionWithMemberPositionsDTO {
  id: number
  member: MemberMinimal  // includes keeper: boolean ← solves keeper issue!
  status: string         // e.g. "BASIS", "BANK", "INVALLER", "NIET_GESELECTEERD"
  captain: boolean
  number: number         // shirt number
  minutesPlayed: number
  memberPositions: MemberPosition[]
  team: TeamMinimal
  // ...
}

MemberMinimal {
  id: number
  firstName: string
  lastName: string
  shirtNumber: number
  keeper: boolean        // ← TRUE for goalkeepers
  profilePictureURL: string
  // ...
}

MemberPosition {
  id: number
  memberId: number
  position: Position
  best: boolean
}

Position {
  id: number
  name: string           // e.g. "Keeper", "Centrale verdediger", "Aanvaller"
  type: PositionType
}
```

#### `GET /games/{gameId}/{gameInformationId}/formations`

Tactical formations with x/y coordinates. For showing formation visually.

```typescript
GameFormation {
  id: number
  formationName: string   // e.g. "4-3-3"
  formationFormat: number
  period: number
  startMinute: number
  endMinute: number
  formation: Formation
  players: GameFormationPlayer[]
}

GameFormationPlayer {
  id: number
  player: Member
  fieldPosition: FieldPosition
  x: number   // x-coordinate on pitch
  y: number   // y-coordinate on pitch
}

FieldPosition {
  id: number
  name: string   // e.g. "GK", "LB", "CB", "ST"
  defaultName: string
  x: number
  y: number
}
```

---

### Ranking

#### `GET /teams/{id}/rankings`

Returns `RankingCompetitionVO[]`:

```typescript
RankingCompetitionVO {
  id: number
  name: string           // e.g. "3de Nationale A"
  ranking: RankingVO[]
}

RankingVO {
  id: number
  rankingPosition: number
  clubId: number
  clubName: string
  clubAbbreviation: string
  clubLogo: string       // URL to logo (direct, no CDN needed)
  played: number
  win: number
  draw: number
  lose: number
  goalsScored: number
  goalsConceded: number
  points: number
  yellowCards: number
  redCards: number
  cleansheet: number
  // ...plus home/away splits for most fields
}
```

**Note:** Lambda used `GET /teams/{teamId}/ranking` (no 's') with `PSD_API_CLUB` as club filter. The spec shows `GET /teams/{id}/rankings`. Both may work; use `/rankings`.

---

### Statistics

#### `GET /statistics/team/{teamId}/from/{from}/to/{to}`

Team statistics for a date range. `from`/`to` format: `ddMMyyyy` (e.g. `01082024`).

Returns `TeamStatistics`:

```typescript
TeamStatistics {
  squadPlayerStatistics: PlayerStatistics[]
  otherPlayerStatistics: PlayerStatistics[]
  goalsScored: GoalStatistics[]
  goalsAgainst: GoalStatistics[]
}

PlayerStatistics {
  playerId: number
  firstName: string
  lastName: string
  gamesPlayed: number
  goals: number
  assists: number
  yellowCards: number
  redCards: number
  minutes: number
  rating: number
  cleanSheets: number
  mainTeam: boolean
  squadPlayer: boolean
}
```

#### `GET /statistics/player/{memberId}/from/{dateFrom}/to/{dateTo}`

Individual player statistics.

---

### Teams

#### `GET /teams/all`

Returns all teams for the club. Used to build the team list for "next matches" logic.

#### `GET /teams/{id}/members`

Squad/members for a team.

---

## Key schema: `Game` object

Returned by `/games/team/{teamId}` and `/games/{id}`:

```typescript
Game {
  id: number
  date: string          // "YYYY-MM-DD HH:mm"
  time: string          // start time
  status: number        // 0=scheduled, 1=finished, 2=live, 3=postponed, 4=cancelled
  homeClub: Club
  awayClub: Club
  goalsHomeTeam: number
  goalsAwayTeam: number
  homeTeam: string      // team-designation code per side (NOT the club name):
  awayTeam: string      //   the queried club's own side is its numeric team id
                        //   ("1", "2", "21"); the opponent is an alpha code
                        //   ("A", "B", "U21", "U23"). Surfaced as MatchTeam.team_label
                        //   (numeric self-codes are dropped). homeTeamName/awayTeamName
                        //   exist but are typically null.
  homeGame: boolean
  competition: string   // competition id/slug ("official", "friendly", "11") — NOT a name
  competitionType: CompetitionType  // { id, name, type } — `name` is null for cups
  round: GameRound      // { id, name }
  season: Season
  cancelled: boolean
  homeWinner: boolean
  scoreFinal: string    // e.g. "3-1"
  // ...many more fields
}

Club {
  id: number
  name: string
  logo: string          // logo URL (direct from PSD — no CloudFront CDN needed for new API)
  logoBig: string
  logoSmall: string
  abbreviation: string
}
```

**Important:** The new PSD API includes `logo` URLs directly on `Club` — no CloudFront CDN workaround needed for clubs. `FOOTBALISTO_LOGO_CDN_URL` was a workaround for the legacy Lambda format.

**Competition names (cups):** on the games-list endpoint a cup's `competitionType.name`
is `null`, so the specific name ("Beker van Brabant", "Croky Cup") is only resolvable
via `GET /competitions`, where it lives in `labelTranslations` (prefer `language: "nl"`,
fall back to `"vls"`) keyed by the same competition id. The BFF caches an
id → label map and resolves it in `transformPsdGame`. The match-detail endpoint
(`/games/{id}/info`) already inlines the resolved string (e.g. `"Croky Cup"`), so the
lookup is only needed for the list path.

---

## Legacy vs New format

The Lambda stored data in this legacy format from an older PSD API version:

```json
{ "general": {...}, "lineup": [...], "substitutes": [...], "events": [...] }
```

The new `GameInformation` from `/games/{id}/info` has `isLegacy: boolean`. For new implementations, use:

- `/games/{id}/info` for game report/summary
- `/games/{id}/gameselections?includeMemberPositions=true` for lineup with keeper/position data
- `/games/{gameId}/{gameInformationId}/formations` for tactical formation visualization
