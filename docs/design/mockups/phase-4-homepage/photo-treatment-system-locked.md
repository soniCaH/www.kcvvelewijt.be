# Phase 4.5 · R9 · Photo treatment system — Locked

**Locked 2026-05-14. Revised at implementation (#1747, 2026-05-14).**
**Source directive:** Owner photo-treatment prompt (directives 1 + 4).
**Companion locks:** all R1.x / R2 / R3 / R5 / R6 locks consume these
tokens.
**Owner:** @climacon.

## Revisions during implementation (#1747)

Two §-level decisions from this lock did not survive design review at
implementation time:

1. **§1 Torn-edge tape variant — DROPPED.** Two attempts at implementation
   (polygon clip-path with 4–6 hand-torn vertices, and a feathered
   alpha-mask alternative) both read wrong at review. No torn-edge
   variant ships; `<TapeStrip>` stays clean-rectangular only. The
   `--tape-edge-{1..4}` and `--tape-mask-torn` tokens were never
   committed.
2. **§2 Per-strip variety (1–2 strips per photo) — REDUCED to 1.**
   The two-strip slot cycle was rejected at review as visually
   unjustified. The `--color-tape-cream` token still ships (third tape
   colour is genuinely needed — see §2 for usage), but the slot cycle
   table below is informational only. `<TapedFigure>` hard-caps at one
   tape strip per photo in its type signature.

The rest of the lock (newsprint filter, paper-grain overlay, photo
shadow tokens, layered hover model) ships as authored.

## Decision

R9 is a token-and-spec lock covering the open items from directives 1
and 4 of the photo-treatment prompt. No visual A/B round — these are
concrete token values for implementation. Adjust at PR time if any
value reads wrong against real photos.

## 1. Tape strip · torn-edge variant — SUPERSEDED

> **Superseded at implementation (#1747).** See "Revisions during
> implementation" above. The rest of this section is preserved as
> historical record of the lock as authored — none of it ships.

### New `<TapeStrip variant>` prop

Existing primitive ships a clean rectangular SVG tape strip. R9 adds
an `edge` prop:

```typescript
<TapeStrip
  color="warm" | "jersey" | "cream"
  edge="clean" | "torn"    // NEW
  length="sm" | "md" | "lg"
  rotation="auto" | "-3deg" | "+3deg" | …
/>
```

### Torn-edge geometry

The `edge="torn"` variant swaps the SVG mask from a rectangle to a
"hand-torn" polyline along the LONG edges (top + bottom) only —
short edges (left + right) stay clean since they suggest "cut by
scissors" rather than "torn off a roll." The masks are designed to
look irregular but are fixed assets, not runtime-randomised:
implementation is an SVG `<path>` with 4–6 irregularly-spaced
vertices (≈1.5px depth variation) per long edge to simulate a
hand-torn look.

Four canonical torn-edge SVG masks ship as `--tape-edge-{1,2,3,4}`
and are cycled deterministically per surface slot (same approach
as `--rotate-tape-*`). There is no renderer-side randomness —
identical inputs always produce identical output, so VR baselines
stay stable.

### When to use which

| Surface                      | Default `edge`               |
| ---------------------------- | ---------------------------- |
| NewsGrid cards               | `torn` (paper-stamp variety) |
| Uitgelicht cards             | `torn`                       |
| Hero photo (single per page) | `torn`                       |
| FeaturedEventBand image      | `torn`                       |
| Buttons / chrome             | `clean` (no change)          |

## 2. Tape colour variety · new `cream` variant

### New `--color-tape-cream` token

Existing tape colours:

- `--color-tape-warm` = warm cream-yellow
- `--color-tape-jersey` = jersey-deep with alpha

Add:

```css
--color-tape-cream: rgb(232 224 200 / 0.85);
```

A cream-soft on cream-soft variant — visible by edge / shadow but
nearly disappears into the paper. Used for the third tape colour
that breaks the warm/jersey rhythm.

### Per-strip variety on TapedFigure — SUPERSEDED

> **Superseded at implementation (#1747).** The two-strip slot cycle was
> rejected at design review. `<TapedFigure>` hard-caps at one tape strip
> per photo. The `--color-tape-cream` token still ships and is used by
> consumers that explicitly opt into a cream tape; the cycle table below
> is historical record only.

Today's `<TapedFigure>` accepts `tape={[{ color: "warm" }]}` — usually
a single strip. R9 extends usage: each photo gets 1–2 strips, EACH
with its own colour pick, per a deterministic slot cycle:

| Photo slot                    | Strip 1 colour | Strip 2 colour (if 2) |
| ----------------------------- | -------------- | --------------------- |
| 0 (hero, news slot 1)         | `warm`         | `jersey`              |
| 1 (Uitgelicht 1, news slot 2) | `cream`        | —                     |
| 2 (Uitgelicht 2, news slot 3) | `jersey`       | `warm`                |
| 3 (Uitgelicht 3, news slot 4) | `warm`         | `cream`               |
| 4 (news slot 5)               | `cream`        | `jersey`              |
| 5 (news slot 6)               | `jersey`       | —                     |

Each strip also gets its own rotation pick from
`--rotate-tape-{a,b,c,d}` independently — so a single photo with 2
strips has the strips at slightly different angles, breaking the
"identical-strip" feel.

## 3. Photo warm tint · CSS filter

### `--filter-photo-newsprint`

Applied site-wide on every taped photo via a CSS custom property
that's set on `<TapedFigure>` images:

```css
:root {
  --filter-photo-newsprint: sepia(0.06) saturate(0.94) hue-rotate(-4deg)
    contrast(1.02) brightness(1.01);
}

.taped-figure img {
  filter: var(--filter-photo-newsprint);
}
```

Concrete values picked to deliver the brief's "very subtle warm tint
(slight cream shift in the highlights, slight green in the deepest
shadows — like aged newsprint)":

- `sepia(0.06)` — 6% sepia for the warm cast
- `saturate(0.94)` — desaturate slightly for the aged feel
- `hue-rotate(-4deg)` — push hues toward warm-green
- `contrast(1.02) brightness(1.01)` — preserve punch the sepia eats

Tune at implementation time against real photos. If the cumulative
filter reads "too vintage," dial sepia to 0.04 first; if it reads
"too modern," push to 0.08.

### Opt-out

```css
.taped-figure[data-tint="none"] img {
  filter: none;
}
```

For photos where the warm tint reads wrong (e.g. a coloured graphic
or designed image that's not a photograph), editors / engineers can
opt out per-instance.

## 4. Paper-grain overlay

### `--pattern-paper-grain` + standard opacity

A noise pattern overlay applied as a `::after` pseudo-element on
taped photos:

```css
:root {
  --pattern-paper-grain: url("data:image/svg+xml,…"); /* SVG feTurbulence noise */
}

.taped-figure::after {
  content: "";
  position: absolute;
  inset: 0;
  background-image: var(--pattern-paper-grain);
  opacity: 0.04;
  pointer-events: none;
  mix-blend-mode: multiply;
}
```

- Opacity: `0.04` (centre of brief's 3–5% range)
- Blend mode: `multiply` so grain integrates with the photo's tonal
  range instead of being a flat overlay
- Pattern: SVG `<feTurbulence baseFrequency="0.9" numOctaves="2">`
  yielding fine-grained noise (~1–2px peaks)

Inline-encoded as a data URL so it ships with the stylesheet without
a network request. Cache-friendly.

## 5. Photo size minimums

The brief asks for "minimum 800px wide on desktop hero positions,
500px on cards" — these are **source-image minimums** (what
Sanity's `coverImage` upload must contain), not display sizes.

### Display vs source widths

| Surface                 | Display width (desktop) | Source width minimum (2x DPR)    |
| ----------------------- | ----------------------- | -------------------------------- |
| Hero photo              | ~520px                  | **1040px** (uploaded source min) |
| Uitgelicht card         | ~320px                  | **640px**                        |
| NewsGrid card           | ~280px                  | **560px**                        |
| FeaturedEventBand image | ~400px                  | **800px**                        |

The 2x DPR factor handles Retina screens; the Sanity image URL
already requests these via `?w=N` params in `ARTICLES_QUERY`.

### Studio guidance

Editors should be informed (via Sanity Studio description text on the
`coverImage` field): "Upload landscape photos at least 1200px wide
for crisp display on Retina screens." Document at implementation
time; not part of the schema migration list.

## 6. Asymmetric photo shadow

### New `--shadow-photo-tape` token

The brief asks for "sharp dark drop shadow offset 4px down and 2px
right (not blurred)" — different from the existing
`--shadow-paper-md` (symmetric 4px/4px).

```css
:root {
  --shadow-photo-tape: 2px 4px 0 0 var(--color-ink);
  --shadow-photo-tape-lift: 4px 8px 0 0 var(--color-ink); /* hover-lift state */
}
```

Used by `<TapedFigure>` for the photo polaroid offset shadow. Hover
state (Variant A layered, locked in conflict 2 resolution) moves the
shadow from `tape` → `tape-lift` to suggest the photo "rising off"
the page.

### Card vs photo shadows

- `--shadow-paper-{sm,md,lg}` — stays symmetric for cards (paper
  resting flat on paper)
- `--shadow-photo-tape` — asymmetric for taped photos (3D-ish
  "leans forward" feel)

Two shadow vocabularies, used in different roles. Cards depress flat;
photos lift forward.

## 7. Hover model (conflict 2 resolution recap)

Locked at Variant A:

```css
.news-card:hover {
  transform: translate(1px, 1px);
  box-shadow: none;
  transition: all 300ms ease;
}

.news-card:hover .taped-figure {
  transform: translateY(-2px);
  /* tape strips stay on card frame, so they don't transform here */
}
```

- Card: canonical press-down (translate +1, +1, shadow → none).
- Photo: independent translate -2 up.
- Tape strips: anchored to card frame (move with card), NOT to photo.
- Net visual: photo "lifts off" the card.

Per `feedback_canonical_press_down_hover`: the canonical press-down
on the card itself is preserved — the photo lift is a layered
transform on top, not a replacement.

## 8. Implementation pieces summary

> **Some bullets superseded at implementation (#1747).** Bullets marked
> `~~strikethrough~~` describe behaviour that was dropped at design
> review. See "Revisions during implementation" at the top.

For implementation issue authoring:

- ~~**New `<TapeStrip edge="clean" | "torn">` prop.** Adds 4 canonical
  torn-edge SVG masks; slot-deterministic cycling.~~ Dropped (#1747).
- **New `--color-tape-cream` token.** RGB value as above.
- **New `--filter-photo-newsprint` CSS variable + application to
  `<TapedFigure>` images.**
- **New `--pattern-paper-grain` data URL token + `::after` overlay
  rule.**
- **New `--shadow-photo-tape` + `--shadow-photo-tape-lift` tokens.**
- ~~**`<TapedFigure>` extends to accept 2 strips with independent
  colour/rotation per strip.**~~ Reduced to 1 strip (#1747).
- ~~**NewsCard / EditorialHero / Uitgelicht / FeaturedEventBand
  consumers updated to set tape colours per the slot cycle table.**~~
  Consumer updates land in their per-issue PRs (e.g. #1748 NewsCard); the
  slot-cycle table itself is historical.
- **Hover transform: layered card press-down + photo lift (Variant A).**
- ~~**Storybook stories cover both clean and torn edges; full grid
  shows the slot-deterministic colour cycle.**~~ Torn edges dropped (#1747).
- **VR baselines refresh after token rollout.**

## 9. Out of scope for R9

These are listed for clarity, not because they need design work:

- **Illustration accent surfaces** (byline avatars on article-detail,
  pull-quote markers, Q&A figures) — directive 2's expansion items.
  All live on Phase 5+ article-detail surfaces. Out of Phase 4.5
  scope.
- **Brand-wide photo policy.** R9 covers the visual treatment
  applied to photos. Editorial guidance for editors (what makes a
  good cover photo, hot tips for cropping) is a content-team
  concern, not a design lock.
- **PNG/JPG selection.** Sanity already optimizes via `?fm=webp`
  in `ARTICLES_QUERY`. No format decision here.

## 10. Open follow-ups for implementation

- Validate the `--filter-photo-newsprint` values against real KCVV
  photos at hero scale before committing in a PR. If the warm tint
  reads wrong on action shots (e.g. green pitch turning swampy),
  dial back saturate/hue-rotate.
- ~~Confirm `<TapeStrip edge="torn">` reads as "hand-torn paper" and
  not "rough computer-generated edge" at the small tape widths used
  on news cards (~36px). If too noisy at small scale, simplify the
  torn polyline to 3 vertices.~~ Resolved by dropping torn-edge entirely (#1747).
- Studio description copy for `coverImage` field — editor guidance
  on landscape orientation + minimum width.
