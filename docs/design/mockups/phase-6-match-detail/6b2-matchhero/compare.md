# 6.B.d2 · MatchHero — primitive comparison map

**Round 1.** First visual drill of Phase 6.B. Sets the structural + tonal shape of the page's hero band, which subsequent drills (lineup, events, article-link card) compose below.

Visual artifact: `round-1-matchhero-comparisons.html` — three variants, each rendered in **both** the upcoming and finished states so state-handling is judged alongside layout shape.

## Reference locks consumed

- `data-reality-locked.md` (6.B.d0) — score/teams/date/venue/competition + status all available; no per-match photo, no editorial fields
- `page-composition-locked.md` (6.B.d1) — Variant A; `<MatchHero state="upcoming|finished" />` is state-aware
- Phase 5 `<EditorialHero>` vocabulary — `apps/web/src/components/article/EditorialHero/EditorialHero.tsx`
- Phase 3.C MatchStrip's "ticket-stub" precedent
- Phase 4.5 R9 photo-treatment system (newsprint filter + paper grain) — applies to club shields but only optionally

## Variants

- **A — Editorial card.** Single `<TapedCard>` hero. Mono kicker → home + score + away on one row → date/venue/competition mono row. Same shape upcoming + finished, just different score-region content (kickoff time vs final score). Reuses Phase 5 EditorialHero vocabulary directly.
- **B — Ticket-stub band.** Full-bleed dark band with the date/venue printed along a left ticket-stub edge (perforated-line motif). Teams + score dominate the right side of the band. More distinctive, more chrome — reads like a printed matchday ticket. Differentiates strongly from article-hero vocabulary.
- **C — Two-team polaroids.** Editorial "pair of polaroid clippings" — home + away each rendered as their own `<TapedFigure>`-style card with shield + name, big NumberDisplay score (or "vs") between them. Most graphic; leans hardest into the fanzine aesthetic. Cost: heavier visual weight on the shields, which are PSD-sourced and inconsistent in quality.

## Vocabulary deltas summary

| Variant | Δ count | Severity | Cost | Notes |
| ------- | ------- | -------- | ---- | ----- |
| **A** | 0 | Low | Pure composition of TapedCard + EditorialHeading + NumberDisplay + MonoLabelRow | Reuses every primitive we already ship. Maps 1:1 onto a `<EditorialHero variant="match">` if we ever want to merge the article + match hero into one component. |
| **B** | 1 | Medium | New `<TicketStubBand>` primitive (perforated-edge motif, full-bleed dark band) | Distinctive but adds vocabulary. The perforated-edge geometry is non-trivial. Reusable later for transfer-window banners, season-pass-style chrome. |
| **C** | 0 | Low | Pure composition of TapedFigure + NumberDisplay + MonoLabelRow | No new primitive, but visual weight on shields whose quality varies (PSD-sourced, some clubs have low-res or off-brand crests). Most editorial-flavored. |

## Cross-state behaviour

All three variants render meaningfully in both states. The score region is the only visually-state-aware element:

- **Upcoming:** "vs" (or the kickoff time, e.g. `14:30`)
- **Finished:** numeric score (e.g. `3 — 1`) + a small status badge ("FT" / "FF" / "AFG" / "STOP")

Editorial copy ("VOORBESCHOUWING" / "MATCHVERSLAG") rides as the kicker in all variants. State badge logic is the same across variants — only its placement varies (kicker vs corner stamp vs inline).

## Things this drill does NOT decide

- Lineup + events layout — 6.B.d3
- ArticleLinkCard visual treatment — 6.B.d4
- `<MatchStatusBadge>` Direction-D audit — 6.B.d5
- `<MatchTeaser>` (the match-card primitive consumed by sliders / sidebars / recent-matches grids) — 6.B.d6, separate cross-cutting drill
- Photo treatment — 6.B.d0 already locked NO per-match photo source; this drill respects that constraint
- Mobile collapse — variants in the mockup are desktop-only; mobile-specific drill happens in a round 2 if needed
