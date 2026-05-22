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

Editorial copy ("VOORBESCHOUWING" / "MATCHVERSLAG") rides as the kicker in Variants A and C; **Variant B** uses a corner stamp instead (the full-bleed dark band leaves no natural kicker slot). Match-status badge logic is also variant-specific: A and C surface it as a small corner stamp on finished only, while B reuses the corner-stamp slot — placing the editorial kicker and the status badge in the same anchor.

## Round 2 — A+B hybrids

After round 1 owner direction: **C eliminated**, A and B both still on the table, with a request to explore hybrid concepts pulling B's ticket-stub identity into A's calmer paper-card chrome. Round 2 ships three hybrids in `round-2-matchhero-comparisons.html`:

- **H1 — Ticket-card.** Single card split into two zones by a perforated dashed border. Left zone (~110px) is a "ticket stub" with big display date + venue. Right zone is the editorial body (kicker / teams + score / competition). Most matchday-flavored of the hybrids. **Δ: +1 small primitive** (perforated dashed line + punch-out circles).
- **H2 — Card + matchday stamp.** A's card unchanged, with a tilted "matchday stamp" artefact in the upper-right corner carrying the big display date. Pure styled element, zero new primitive. Most A, least B. Lightest hybrid. **Δ: 0**.
- **H3 — Card with ticket-footer.** A's body unchanged; the meta row at the bottom gets promoted to a ticket-stub footer (cream-soft tint, dashed top border, punch-out circles at the corners). Reads like the tear-strip of a printed ticket. **Δ: +1 small primitive** (perforated-edge wrapper + corner circles, narrower than H1's because it only applies to the footer).

| Hybrid | Δ primitives | Where the ticket motif lives | Tradeoff vs pure A |
| --- | --- | --- | --- |
| **H1** | +1 (perforated line + circles) | Full left edge inside the card | Loses ~110px of horizontal space; mobile collapse non-trivial |
| **H2** | 0 | Upper-right corner stamp | Smallest visual change; least matchday-flavored |
| **H3** | +1 (footer perforated edge + circles) | Bottom footer of the card | Cream-on-cream tonal split is subtle; can be missed on some monitors |

If none of the hybrids feel right, **fallback is pure A from round 1**.

## Round 3 — H1 separator treatment

After round 2 owner direction: **H1 (Ticket-card) picked**, with a question on whether the perforation punch-out circles are necessary. Round 3 isolates the separator treatment — same H1 shape across all three variants, only the divider between stub + body varies:

- **T1 — Full perforations** (as round 2 H1): 2px dashed ink line + 18px punch-out circles top + bottom. Strongest matchday-ticket cue. +1 small primitive.
- **T2 — Dashed only**: just `border-right: 2px dashed ink` on the stub. No punch-outs. Cleanest; zero new primitive. Reads more "two-zone card" than "ticket".
- **T3 — Subtle perforations**: 1.5px dashed ink-muted line + 12px punch-out circles. Quieter compromise. Still +1 small primitive.

| Treatment | Δ primitives | Ticket identity | Maintenance cost |
| --- | --- | --- | --- |
| **T1 — Full** | +1 (line + circles) | Strongest | Highest (corner geometry, breakpoints) |
| **T2 — Dashed only** | 0 (one-line CSS) | Weakest (rests on date typography + tint alone) | Lowest |
| **T3 — Subtle** | +1 (line + small circles) | Quiet — present but not loud | Medium |

## Things this drill does NOT decide

- Lineup + events layout — 6.B.d3
- ArticleLinkCard visual treatment — 6.B.d4
- `<MatchStatusBadge>` Direction-D audit — 6.B.d5
- `<MatchTeaser>` (the match-card primitive consumed by sliders / sidebars / recent-matches grids) — 6.B.d6, separate cross-cutting drill
- Photo treatment — 6.B.d0 already locked NO per-match photo source; this drill respects that constraint
- Mobile collapse — variants in the mockup are desktop-only; mobile-specific drill happens in a round 2 if needed
