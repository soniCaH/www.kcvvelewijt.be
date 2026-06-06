# Locked — matchPreview / matchRecap article body (5.d-mat)

**Status:** Locked 2026-06-05 · **Issue:** #1791 · **Drill:** `5d-mat/` (rounds 1–5)
**Builds in:** #1470 (article variants) · **Sibling:** #1914 (match-page `<MatchArticleLinkCard>`)

## Decision summary

The `matchPreview` / `matchRecap` article **does not re-render** lineups, the
full event timeline, or stats — those stay canonical on `/wedstrijd/[matchId]`
(Phase 6.B). The **hero carries the matchup** (score-forward, H3); the body is
**editorial prose**, plus (recap only) a **goals-only** scorer list, then a link
to the match.

> **Round 4–5 reconciliation (supersedes the round-1 body card):** the matchup
> moved into the hero (H3). The standalone body "card C" is **dropped** — keeping
> both would duplicate teams + score. The match link is now a plain text CTA.

Composition (top → bottom):

```text
<EditorialHero variant="matchPreview|matchRecap">   ← H3 score-forward hero:
                                                       kicker VOORBESCHOUWING /
                                                       MATCHVERSLAG + score bar
                                                       on the cover (see below)
<ArticleBody>                                        ← editorial prose
[recap only] <Doelpunten>                            ← Round 2 = V3, sided goals
"naar wedstrijd →"                                   ← plain text link to /wedstrijd
```

## Hero (rounds 4–5) — **H3, score-forward**

`<EditorialHero variant="matchPreview|matchRecap">` keeps the editorial shell
(kicker + display H1 + lead + cover) and adds a **score bar** straddling the
cover's lower edge — the same overlay idiom as the `event` variant's day-block.

- **Score bar:** a centred, balanced `crest · score · crest` pill (cream, `border-2 border-ink`,
  `shadow-paper-sm`). Score is `font-display-big`, tabular, with a fixed min-width so
  `2 – 1` and `15:00` stay centred. Recap appends an `<MatchStatusBadge>` (`FT`);
  preview shows the **kickoff time** (or `vs`) and no badge.
- **Kicker:** `VOORBESCHOUWING` (preview) / `MATCHVERSLAG` (recap) `· competition · date`.
- **Desktop:** editorial column + cover side-by-side (the existing hero grid). The
  bar sits bottom-centre of the cover.
- **Mobile:** cover on top (full-bleed) with the score bar straddling its lower edge,
  editorial (kicker + H1 + lead) below.
- **Reuse:** the `event`-variant cover-overlay mechanism, `<Crest>`, `<MatchStatusBadge>`.
- Because the hero carries the matchup, there is **no standalone body match card**
  (the round-1 "card C" is dropped — see the reconciliation note above).

## Round 2 — recap goalscorers = **V3, sided "Doelpunten" block**

After the prose on **recap only** (preview has no goals → no Doelpunten):

- **Gap above Doelpunten: `30px`** (`mt-[30px]`) — the scorer list reads as a
  distinct section.
- A `Doelpunten.` `<EditorialHeading>`-style italic display heading + 2px ink rule.
- The list **reuses `<MatchEvents filter="goals">`** — its Option-F rows
  (minute on the far left, then a **sided** glyph: home events render their glyph
  on the **left**, away events on the **right**; the opposite side stays empty).
  Goals-only (no cards/subs) keeps it lighter than and distinct from the match
  page's full timeline.
- **Scorer names render in `text-ink` italic display** (MatchEvents' default — it
  does **not** tint per team). Highlighting KCVV scorers in `jersey-deep` is a
  desired delta that requires a small `highlightTeam` prop addition to
  `<MatchEvents>` in #1470; it is **not** free from the current component.
- **Penalty → `(strafschop)`** and **own-goal → `(e.d.)`** render as
  parenthesized text after the name (from `event.isPenalty` / `event.isOwnGoal`);
  own-goal uses `text-alert` (red), penalty uses `text-ink-muted` — **not** a mono tag.
- **Goal glyph = the existing `<MatchEvents>` goal SVG (cream ball + ink
  pentagons), NOT an emoji** (icons-over-emojis rule).

## Data reality (audited — drives the "no inline duplication" decision)

`MatchDetail` (BFF, `getMatchDetail`) provides: teams (+logo, +score), date,
venue, competition, status, optional `lineup`, optional `events` (goals/cards/
subs w/ minute + player), `hasReport`. **No statistics** (possession/shots/xG)
exist in the schema. Previews have **no** score/events/lineup (not played yet).
→ A preview can only show fixture basics; a recap can show score + goals. Mocking
"preview lineups" or a "stats grid" would fabricate data (forbidden).

## Implementation notes (for #1470)

- The hero score bar + Doelpunten are **presentational** (props-only) so they're
  Storybook/VR-able; the page server-fetches via `BffService.getMatchDetail(linkedMatch)`
  and feeds them. Article renders the editorial hero **without** the score bar if the
  match 404s (graceful).
- `matchPreview`/`matchRecap` excluded from `generateStaticParams` (on-demand ISR)
  so match data renders server-side without per-article PSD hits at build.
- Goals for the roll-call = `events.filter(type === "goal")` → `<MatchEvents filter="goals">`.
- KCVV-in-`jersey-deep` highlight needs a small `highlightTeam` prop added to
  `<MatchEvents>` (it currently renders all names in ink) — see Round 2.
- **No standalone match card** to build (card C dropped). The match link is a plain
  text CTA after the body.

## Reuse map

| Element         | Reuses                                                                 |
| --------------- | ---------------------------------------------------------------------- |
| Hero shell      | `<EditorialHero>` (new `matchPreview`/`matchRecap` variants)           |
| Cover score bar | `event`-variant cover-overlay idiom + `<Crest>` + `<MatchStatusBadge>` |
| Doelpunten rows | `<MatchEvents filter="goals">` (+ a `highlightTeam` prop)              |

## Mockups

- `5d-mat/round-1-card-shape-comparisons.html` — body card directions A/B/C (C chosen, later superseded).
- `5d-mat/round-2-goalscorer-rollcall.html` — V1/V2/V3 roll-call attachments (V3, sided).
- `5d-mat/round-3-final-locked.html` — body composition with card C (superseded by rounds 4–5).
- `5d-mat/round-4-hero-composition.html` — hero options H1/H2/H3.
- `5d-mat/round-5-hero-h3-final.html` — H3 hero (aligned score + mobile).

## Build refinements (5.d-mat-refine, #1470 review)

After shipping the H3 build, the owner refined three surfaces (mockups in
`5d-mat-refine/round-1-refinements.html` + `round-2-hero-positioning.html`):

- **Hero score bar → two-tier, inside the cover (variant D @ P3).** Supersedes
  the single-row straddling pill. Top row = `crest · score · crest` (+ `FT` on
  recap); a hairline subline carries `competition · matchDate`. The bar now sits
  **inside** the cover's lower third (not straddling the edge — the two-tier
  bar split awkwardly across it). Because the bar carries competition + date,
  the **kicker collapses to the bare type label** (`VOORBESCHOUWING` /
  `MATCHVERSLAG`); it only falls back to the article date when the match 404s
  and the bar is absent.
- **Article-foot CTA → centered paper-stamp button (Foot A).** Replaces the
  bare `naar wedstrijd →` text link with a centered `<LinkButton variant="primary" withArrow>` ("Bekijk de wedstrijd") above a thin ink rule.
- **News-index cards → match type kicker (Card B).** matchPreview/matchRecap
  cards gain a jersey-deep dot + type label (`Voorbeschouwing` / `Matchverslag`)
  ahead of the category badge. Cards stay generic on data (no per-card PSD
  score/date fetch); this is type-signal only. Required adding `articleType` to
  the paginated `/nieuws` GROQ projection. Extending a type kicker to the other
  article types is a separate card-semantics decision (deferred).
