# 6.C.d1 · Team detail — information architecture comparison

**Round 1.** First visual drill of Phase 6.C. Decides the **arrangement** of the
team-detail page only — not the per-component look. The data box is fixed by
`../data-reality-locked.md` (Core + editorial, auto-hide empties).

Visual artifact: `round-1-detail-ia-comparisons.html` — 3 variants, single
exemplar (KCVV A-ploeg, 3e Provinciale A). Open in a browser and scroll.

## Reference locks consumed

- `data-reality-locked.md` (6.C.d0) — section inventory + youth auto-hide.
- 6.A `<PlayerHero>` / 6.B `<MatchHero>` — single-scroll + `<StripedSeam>` +
  per-section auto-hide precedent (`phase-6-match-detail/page-composition-locked.md`).
- Reskinned `<MatchResultRow>` / `<MatchTeaser>` (6.B) — schedule rows.
- `<FilterTabs>` (Phase 2.B.3) — the tab-bar vocabulary used in Variant B.

## Variants

- **A — Single-scroll + striped seams.** Sections stacked top-to-bottom,
  `<StripedSeam>` between. The whole team "reads" as one editorial page. Exact
  same composition grammar as player + match detail. Empty sections vanish; a
  U8 page is hero + squad + staff. **Δ primitives: 0.**
- **B — Reskinned tabs.** Hero always-on; a `<FilterTabs>` bar swaps one panel
  at a time (Info / Klassement / Wedstrijden / Spelers). Keeps today's IA,
  repainted. Dense data stays contained, but breaks the redesign's single-scroll
  grammar and forces a click per section. **Δ primitives: 0** (FilterTabs
  exists) — but **Δ pattern: breaks the 6.A/6.B single-scroll convention.**
- **C — Single-scroll + sticky section-nav.** Variant A plus a thin sticky mono
  nav under the hero that jumps to any section. Editorial flow for casual
  readers; quick access for standings/squad hunters. **Δ primitives: +1** (a new
  `<SectionNav>` sticky-anchor strip).

## Trade-off table

| | A — Single-scroll | B — Tabs | C — Scroll + sticky nav |
| --- | --- | --- | --- |
| Consistency w/ 6.A/6.B | ✅ identical grammar | ❌ diverges | ✅ same + extra |
| Clicks to reach standings | scroll | 1 click | 1 click (or scroll) |
| Youth degradation | ✅ sections vanish | ⚠️ empty/hidden tabs | ✅ nav lists only live sections |
| Mobile | ✅ natural | ⚠️ tab overflow / panel height | ✅ nav wraps/scrolls |
| New vocabulary | none | none | +`<SectionNav>` |
| SEO / deep-link to a section | native anchors | panels behind JS state | native anchors |
| Build cost | lowest | medium (panel state) | low-medium |

## Cross-state behaviour

- **Senior team (full data):** all three render every section. B hides 3 of 4
  panels behind clicks; A/C show everything inline.
- **Youth team (empty standings/schedule):** A drops those seams silently; C's
  sticky nav simply omits the dead anchors; B must conditionally remove tabs or
  risk tabs that open empty panels.
- **No squad photos (≈90% have only `psdImage`, some none):** identical across
  variants — `<PlayerCard>` falls back to the `<PlayerFigure>` illustration
  (shown as the cream cards with the jersey glyph).

## Things this drill does NOT decide

- Standings cell styling + the form (W/G/V) indicator treatment — its own later
  drill. The mockup shows a *restrained, palette-safe* placeholder (jersey-deep /
  cream / warm, **no red**) only so the row reads; it is not the locked look.
- `<PlayerCard>` composition + squad grouping (by position assumed) — later drill.
- `<TeamHero>` artefact (taped team photo, season stub, jersey-illustration
  fallback when no `teamImage`) — later drill.
- Listing page `/ploegen` layout — separate (hierarchy already locked in the
  decision record; its own visual pass if needed).
- Mobile-specific refinements.

## Recommendation

**C** if the page must serve both the "just read about the team" visitor and the
"jump to the table/squad" visitor — it keeps the locked single-scroll grammar and
only adds a cheap sticky nav. **A** if we want zero new vocabulary and maximum
consistency with player/match. **B** is the weakest fit — it's the one IA the
rest of the redesign has been moving *away* from. Owner decides.
