# Locked — matchPreview / matchRecap article body (5.d-mat)

**Status:** Locked 2026-06-05 · **Issue:** #1791 · **Drill:** `5d-mat/` (rounds 1–3)
**Builds in:** #1470 (article variants) · **Sibling:** #1914 (match-page `<MatchArticleLinkCard>`)

## Decision summary

The `matchPreview` / `matchRecap` article **does not re-render** lineups, the
full event timeline, or stats — those stay canonical on `/wedstrijd/[matchId]`
(Phase 6.B). The article body is **editorial prose + a compact card that links
to the match**, plus (recap only) a **goals-only** scorer list.

Composition (top → bottom):

```text
<EditorialHero variant="matchPreview|matchRecap">   ← announcement-shape hero,
                                                       kicker VOORBESCHOUWING /
                                                       MATCHVERSLAG (per #1470)
<ArticleBody>                                        ← editorial prose
<MatchCard>                                          ← Round 1 = Variant C
[recap only] <Doelpunten>                            ← Round 2 = V3, sided
```

## Round 1 — match card = **Variant C (taped result card)**

A `<TapedCard>`-based card, whole-card link to `/wedstrijd/[matchId]`:

- Washi **tape** strip on the top-left corner; slight paper rotation (`-0.6°`);
  `shadow-paper-lift`; canonical **press-down hover**
  (`hover:shadow-none hover:translate-x-1 hover:translate-y-1`, `duration-300`).
- **Top:** mono kicker `competition · short-date`. `<MatchStatusBadge>` as a
  **corner stamp** top-right (it self-hides for `scheduled`, so preview shows none).
- **Middle:** symmetric 3-col row — `[home crest + name] [score|time] [name + away crest]`.
  Recap → `font-display-big` score (e.g. `2–1`); preview → kickoff `15:00` (or `vs`).
- **Foot:** `venue` (left) · `naar wedstrijd →` mono CTA (right).
- **Reuse:** `<TapedCard>`, `<MatchStatusBadge>`, `<Crest>`, `<MonoLabel>` — no new primitive.
- Distinct from `<MatchTeaser>` (date-stub-led, asymmetric) by being **symmetric + tape-led**.

## Round 2 — recap goalscorers = **V3, sided "Doelpunten" block**

Below card C on **recap only** (preview has no goals → card C alone):

- A `Doelpunten.` `<EditorialHeading>`-style italic display heading + 2px ink rule.
- The list **reuses `<MatchEvents filter="goals">`** — its Option-F sided rows
  (home left / away right, central football glyph, minute on the far left).
  Goals-only (no cards/subs) keeps it lighter than and distinct from the match
  page's full timeline.
- KCVV scorers rendered in `jersey-deep`; opponent in ink. Penalty / own-goal
  carry a small mono `pen` / `e.d.` tag (from `event.isPenalty` / `isOwnGoal`).
- **Football glyph = the existing `<MatchEvents>` goal SVG (cream ball + ink
  pentagons), NOT an emoji** (icons-over-emojis rule).

## Data reality (audited — drives the "no inline duplication" decision)

`MatchDetail` (BFF, `getMatchDetail`) provides: teams (+logo, +score), date,
venue, competition, status, optional `lineup`, optional `events` (goals/cards/
subs w/ minute + player), `hasReport`. **No statistics** (possession/shots/xG)
exist in the schema. Previews have **no** score/events/lineup (not played yet).
→ A preview can only show fixture basics; a recap can show score + goals. Mocking
"preview lineups" or a "stats grid" would fabricate data (forbidden).

## Implementation notes (for #1470)

- The card + Doelpunten are **presentational** (props-only) so they're Storybook/
  VR-able; the page server-fetches via `BffService.getMatchDetail(linkedMatch)`
  and feeds them. Article renders without the card if the match 404s.
- `matchPreview`/`matchRecap` excluded from `generateStaticParams` (on-demand ISR)
  so match data renders server-side without per-article PSD hits at build.
- Goals for the roll-call = `events.filter(type === "goal")`.

## Reuse map

| Element | Reuses |
| --- | --- |
| Card shell | `<TapedCard>` (tape, rotation, press-down) |
| Status stamp | `<MatchStatusBadge>` |
| Team crests | `<Crest>` |
| Kicker / labels | `<MonoLabel>` |
| Doelpunten rows | `<MatchEvents filter="goals">` |

## Mockups

- `5d-mat/round-1-card-shape-comparisons.html` — A/B/C card directions.
- `5d-mat/round-2-goalscorer-rollcall.html` — V1/V2/V3 roll-call attachments.
- `5d-mat/round-3-final-locked.html` — locked composition (card C + sided Doelpunten), recap + preview.
