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

## Outcome word — amended by #2404

The lock called for an **outcome word** on the result card. The #2301 unification onto the
shared `<TeamAgendaRow>` dropped it, leaving the two cards told apart only by cream-vs-green
and by which column they sat in, and the win/loss tint carried by hue alone.

It is back, in the row's mono caption rather than beside the scoreline — the caption already
renders there, so it costs no height, and the centre column stays free for the score (#2397).
`<TeamAgendaRow>` resolves it most-informative-first:

| state                               | caption opens with                                         |
| ----------------------------------- | ---------------------------------------------------------- |
| settled (`finished` / `forfeited`)  | `Winst` / `Gelijkspel` / `Verlies`                         |
| a status the layout can't speak for | nothing — the `PP` / `AFG` / `STOP` marker already says it |
| result slot, kicked off, no score   | `Uitslag volgt` — and `–` in the score slot (#2587)        |
| otherwise, if a slot was given      | the slot's own word: `Uitslag` / `Volgende`                |

The words live in `OUTCOME_WORD` / `MATCH_KIND_WORD` / `RESULT_PENDING_WORD`
(`lib/utils/match-display.ts`), beside the `OUTCOME_UNDERLINE` they de-colour.

**The two layouts are named differently, because they need different amounts of help.**

The **desktop scoreboard** prints both clubs either side of the score, in home–away order, with
KCVV among them — "K Lyra-Lierse 4 – 0 KCVV Elewijt" already says who lost. A word there restates
the row, and down a season of results it stacks into a column of the same word. So desktop names a
row only when the host surface asks, via `kind`. Owner call, 2026-08-13: the labels were tried on
every agenda surface first and read as noise.

The **mobile column** shows the opponent alone. The same scoreline arrives as "4 – 0" beside
"K Lyra-Lierse" and a bus glyph, so reading KCVV's 0 out of it means knowing the score is
home–away _and_ decoding the glyph. There the outcome word is not gated.

The accessible name always carries the more informative of the two: it has no layout to restate,
so the desktop argument for staying quiet does not apply to it.

The `kind` prop stays opt-in either way — `<TeamMatchesSection>` heads its featured row
"Eerstvolgende", `/kalender` groups rows under a date, and `/ploegen/<slug>/wedstrijden` bands its
rows by month, so all three would otherwise say it twice.

**The slot is the caller's answer, never derived from `match.status`.** `pickLastResult` puts a
match whose kickoff has passed into the result column even while PSD still calls it `scheduled` —
the `AwaitingResult` state this lock's "graceful skip" section already anticipates. A status-derived
word labelled that column "Volgende", the same word as the fixture card beside it.

## Scoreline orientation

Official **home–away** (matches `TeamAgendaRow` site convention), KCVV bolded wherever it sits.

## Graceful skip

- Missing result → result card replaced by "Nog geen uitslag" placeholder (non-interactive).
- Missing fixture → fixture card replaced by "Geen geplande wedstrijd".
- A team's whole row is dropped only if it has **neither** result nor fixture.
- **Amended by #2399:** when that leaves _no_ rows, the band no longer disappears. Chrome
  (seams, kicker, heading, "Volledige kalender →") stays and the rows region holds its shape
  open with a dashed notice — #2427's tier-2 register. A vanished band made a PSD outage
  indistinguishable from a club that never posted the result, so the notice names which it is.
- **Amended by #2505/#2844:** the no-rows notice grew from two states to six, driven by the
  Studio-authored `matchesSliderPlaceholder` (off-season countdown, mededeling, optional highlight
  image) still rendering inside this same dashed frame. The BFF-outage line always wins and
  suppresses the image with it:
  - BFF read failed → "Uitslagen en wedstrijden zijn even niet beschikbaar. Probeer het later opnieuw."
  - Kickoff authored, in the future, with a mededeling → "Nog N dagen tot de aftrap. `<mededeling>`"
  - Kickoff authored, in the future, no mededeling → "Nog N dagen tot de aftrap."
  - Kickoff authored, today → "Vandaag de aftrap van het nieuwe seizoen."
  - Kickoff past/unset, mededeling authored → the mededeling itself (linked when `announcementHref`
    is set)
  - Nothing authored → "Nog geen wedstrijden ingepland." (the original #2399 copy, unchanged)

## Plumbing

- `BffService.getMatches(psdId)` per senior team (A/B from `TeamRepository`, `age` not `U*`); split
  client-side into last result (latest played) + next fixture (earliest upcoming). No new BFF call.
- Filter A/B (senior `psdId`s) **out of** the "Komende wedstrijden" `UpcomingMatches` agenda.
- `MatchStrip` (A-team band) untouched.
- Analytics: `match_card_click` `{ team_slug, match_id, source: "first_teams_result" | "first_teams_fixture" }`
  (all params already in `scripts/analytics-taxonomy.mjs`; `match_` prefix already covered).
- Story (`Features/Home/*`, `tags: ["autodocs","vr"]`, local imagery) + VR baseline in the same PR.
