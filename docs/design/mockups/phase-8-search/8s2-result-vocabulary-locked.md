# 8s2 — /zoeken result-card vocabulary · LOCKED

**Decision:** A — **clean paper rows**, single column.

Each result: white card, `1.5px` ink border, **5px `jersey-deep` left edge**,
`2px 2px` offset shadow, canonical press-down hover (`shadow-none` +
`translate(2px,2px)`). Mono micro-label (type · date), bold title, muted snippet,
article tags as tiny mono chips, arrow glyph on the right.

Rejected:

- **B (TapedCard index rows)** — substantial + fanzine, but a long result list
  becomes a tall stack of chunky cards; too heavy for a utility list.
- **C (ticket-stub rows)** — most distinctive, but the fixed left stub eats
  horizontal room on mobile and shrinks the article thumbnail.

The dark masthead (8s1) already supplies the personality; results stay calm and
fast to scan.

## Owner refinement — uniform thumbnail (LOCKED)

Mixed aspect ratios across result types look misaligned. **All result types use a
single uniform thumbnail**: a fixed **square** (≈`64×64`), same shape on every row,
so rows are equal height and the left edge stays clean.

- **Article** → square *crop* of the article image (not 16:9 in-row).
- **Player / Staff** → square photo (`psdImage`), same box.
- **Team** → square `jersey-deep` crest disc with the team initial (teams usually
  have no image — this is the locked fallback, not an empty box).
- Missing player/staff photo → same `jersey-deep` initial disc fallback.

Rounded-square (not circle) on all, so people and article/team thumbs share one
shape. Verified in `8s2-1-refined-aligned.html`.

Reskin target: `apps/web/src/components/search/SearchResult.tsx` (currently a
`bg-white` legacy card with a 16:9-ish image slot + green-bright top accent).
