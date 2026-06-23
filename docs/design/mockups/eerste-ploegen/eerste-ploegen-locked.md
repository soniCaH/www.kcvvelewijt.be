# "Eerste ploegen" homepage block — locked design (#2211)

Visual record: [`04-b3-ia.html`](./04-b3-ia.html) (orientation B is the locked render).
Exploration of alternatives: [`01-directions.html`](./01-directions.html), [`03-matchday-desk-variants.html`](./03-matchday-desk-variants.html).

## Placement

Homepage spine (`app/(landing)/page.tsx`), in a new section **immediately after the
`uitgelicht` featured row** and before `featuredEventSection`.

## Voice — B3 "matchday desk", full-width rows

- Full-bleed `bg-jersey-deep-dark` band, **`StripedSeam colorPair="cream-jersey-deep"` top + bottom**
  (the band below — `FeaturedEventBand` — is a flat `bg-jersey-deep` with no seam, so the bottom
  seam is needed to break cleanly between the two greens).
- Header on the dark field: warm mono kicker **"Eerste ploegen"** + `EditorialHeading` **"Dit weekend."**
  - **"Volledige kalender →"** (warm) → `/kalender`.

## Per team — one full-width row

`[ team label ] · [ result card ] · [ fixture card ]`

- **Team label** (non-interactive): "A-ploeg" / "B-ploeg" + division (`divisionFull ?? division`).
- **Result card** → `/wedstrijd/{resultId}` (own press-down target). Dark, cream border,
  `--shadow-paper-sm-soft`. Outcome word + **official home–away scoreline** (KCVV bold, crests L↔R) +
  outcome underline (`getResultColor` → win = jersey-deep mix, loss = alert mix, draw = none) + `thuis/uit · date`.
- **Fixture card** → `/wedstrijd/{fixtureId}` (own press-down target). Cream stub: date tear-off +
  opponent crest/name + home/away + kickoff time.
- **Two independent press targets per row** (not one row group) — links split per the owner decision.

## Scoreline orientation

Official **home–away** (matches `TeamAgendaRow` site convention), KCVV bolded wherever it sits.

## Graceful skip

- Missing result → result card replaced by "Nog geen uitslag" placeholder (non-interactive).
- Missing fixture → fixture card replaced by "Geen geplande wedstrijd".
- A team's whole row is dropped only if it has **neither** result nor fixture.

## Plumbing

- `BffService.getMatches(psdId)` per senior team (A/B from `TeamRepository`, `age` not `U*`); split
  client-side into last result (latest played) + next fixture (earliest upcoming). No new BFF call.
- Filter A/B (senior `psdId`s) **out of** the "Komende wedstrijden" `UpcomingMatches` agenda.
- `MatchStrip` (A-team band) untouched.
- Analytics: `match_card_click` `{ team_slug, match_id, source: "first_teams_result" | "first_teams_fixture" }`
  (all params already in `scripts/analytics-taxonomy.mjs`; `match_` prefix already covered).
- Story (`Features/Home/*`, `tags: ["autodocs","vr"]`, local imagery) + VR baseline in the same PR.
