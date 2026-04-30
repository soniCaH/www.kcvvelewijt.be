# Phase 2 — Track B Design Checkpoint

> **Status:** ✅ **LOCKED — Direction D chosen.**
> **Date:** 2026-04-30.
> **Worktree:** `design/phase-2-track-b`.
> **Master design:** [`docs/plans/2026-04-27-redesign-master-design.md`](../../../plans/2026-04-27-redesign-master-design.md) §6.5.
> **PRD:** [`docs/prd/redesign-phase-2.md`](../../../prd/redesign-phase-2.md) §6.5.
> **Tracking issues:** [#1524](https://github.com/soniCaH/www.kcvvelewijt.be/issues/1524) (umbrella), [#1575](https://github.com/soniCaH/www.kcvvelewijt.be/issues/1575) (Spinner), [#1576](https://github.com/soniCaH/www.kcvvelewijt.be/issues/1576) (BrandedTabs), [#1577](https://github.com/soniCaH/www.kcvvelewijt.be/issues/1577) (FilterTabs), [#1578](https://github.com/soniCaH/www.kcvvelewijt.be/issues/1578) (HorizontalSlider + ScrollHint arrows).

---

## Decision

**Direction D — "Paper chrome, ink emphasis"** is the chosen direction. Canonical visual reference: [`option-d-paper-chrome-ink-emphasis.html`](option-d-paper-chrome-ink-emphasis.html).

Direction D is a synthesis derived from owner feedback on the three exploratory directions. Its threads:

- **Paper-card foundation everywhere on chrome:** `border-2 ink` + `shadow-paper-sm` + cream bg.
- **Ink-invert active states**, never jersey-fill. Jersey reserved for *content* (live match strip, KCVV name, scoring) — not chrome.
- **No tape on chrome.** Tape stays for editorial primitives (TapedCard hero artefacts).
- **Sharp corners** everywhere — no `border-radius`.
- **No leading glyphs** on filter tabs.
- **Typographic `←` / `→`** over Lucide where the glyph reads.
- **One canonical form per atom**, no sub-variants shipped.
- **All slider cards equally treated** — no "active" variant for the live match. Live status signalled via kicker text alone.
- **New token `--shadow-paper-sm-soft`** (4×4 ink-muted gray) for ink-bg active states + chrome on dark panels, where the standard ink shadow would vanish.

### Provisional caveat

Owner sign-off was conditional ("not 200% convinced, but let's go with it for now"). The dark-shadow soft variant and the slider's "all cards equally treated" decision are the two areas most likely to need refinement during implementation. If issues #1575–#1578 surface real-use friction, the implementation PRD can revise — this checkpoint is the source-of-record, not a hard freeze.

---

## Locked specifications

### Spinner ([#1575](https://github.com/soniCaH/www.kcvvelewijt.be/issues/1575))

**Primary motif:** scarf barber-pole. Diagonal jersey/cream/ink/cream stripes scrolling infinitely inside a paper bar. Implementation note: stripes rendered as a 90° gradient on a `::before` pseudo-element, statically `transform: rotate(-45deg)`, with `background-position-x` animating by clean-integer 80 px per cycle to avoid sub-pixel rasterisation seams (see `option-d` source for the canonical CSS technique).

**Variants:**

- `primary` — jersey · cream · ink · cream stripes. Default loading on cream surfaces.
- `secondary` — ink · cream · ink-muted · cream (no jersey). Non-brand loading (form save, admin save, background sync).
- `white` — palette flip: cream · ink · jersey-bright · ink stripes on `bg-ink-soft`. Border `paper-edge`, shadow `--shadow-paper-sm-soft`. Used on dark interlude bg.
- `compact` — three jersey-deep dots pulsing in sequence. Inline next to text where a 96 px barber-pole bar is too heavy.
- `logo` — **RETIRED.** `SpinnerVariant` becomes `"primary" | "secondary" | "white" | "compact"`.

**Sizes (sm/md/lg/xl):** 96 × 16 / 180 × 28 / 240 × 36 / 360 × 56. Logo variant removal lets `Spinner.tsx` drop the `Image` import path entirely.

### BrandedTabs ([#1576](https://github.com/soniCaH/www.kcvvelewijt.be/issues/1576))

Each tab: `border-2 ink` + `shadow-paper-sm` + `bg-cream`, mono caps label, sharp corners, no rotation, no tape.

**Active state:** invert to `bg-ink text-cream` + `--shadow-paper-sm-soft` (so the ink tab body and shadow remain distinguishable instead of merging into one solid block).

**Hover (inactive):** shadow → 3 × 3 + `translate(1px, 1px)` (paper press idiom).

Prop surface: unchanged from current (`tabs`, `activeTabId`, `onTabChange`, `ariaLabel?`).

### FilterTabs ([#1577](https://github.com/soniCaH/www.kcvvelewijt.be/issues/1577))

Each chip: `border-2 ink` + `shadow-paper-sm` + `bg-cream-soft`, mono caps label, sharp corners.

**Active state:** invert to `bg-ink text-cream` + `--shadow-paper-sm-soft` (matches BrandedTabs).

**Count:** inline mono after a 1 px ink-muted hairline pipe — `LIVE | 1`. No pill stamp, no badge.

**Sizes (sm/md/lg):** padding + font-size only.

**Prop change:** **drop `FilterTab.icon` entirely** (no leading glyphs anywhere). This **closes #1573 with no UI work** — what would have been a Lucide → Phosphor type swap becomes a prop removal. `FilterTabsProps` and the `icon?` field on each tab go away.

### ScrollArrowButton ([#1578](https://github.com/soniCaH/www.kcvvelewijt.be/issues/1578) — part 1)

Single canonical button. 48 × 48: `border-2 ink` + `shadow-paper-sm` + `bg-cream`. Glyph: typographic `←` / `→` in Freight Display italic. Press: shadow → 3 × 3 + `translate(1px, 1px)`.

**Prop change:** **drop `variant: "light" | "dark"` entirely.** The same cream-on-ink-bordered button reads correctly on both light cream panels (full shadow visible) and dark ink panels (shadow vanishes into ink, but cream-on-ink contrast carries elevation). On `panel--dusk` contexts, a CSS descendant rule swaps shadow to `--shadow-paper-sm-soft` so the gray offset still reads.

`ScrollArrowButtonProps` becomes `{ direction, onClick, className? }`.

### HorizontalSlider ([#1578](https://github.com/soniCaH/www.kcvvelewijt.be/issues/1578) — part 2)

**Match card structure (top-to-bottom):**

1. Mono kicker row: competition tag · date OR live status. `1STE PROV. · ZA 02 MEI` or `1STE PROV. · ★ LIVE · 67'` (live word in `--color-alert`).
2. Teams row: each team has crest (~24 × 24) + name. **KCVV always rendered as `Elewijt` in italic Freight Display + `--color-jersey-deep`**; opponent in body sans `--color-ink`.
3. Score row: mono, large. `2 — 1` for played; `20:00` (italic Freight Display, ink-muted) for upcoming.
4. Venue + CTA row: mono caps, `--color-ink-muted`. `DRIESSTRAAT · TICKETS →`.

**Card rotation:** sub-degree pool `--rotate-tape-a..d` cycling per `nth-child(4n+1..4)`, matching `<TapedCardGrid>`.

**All cards equally treated** — no live-card surface variant. Live status comes only from the kicker text and the score field.

**Prop surface:** unchanged. `theme: "light" | "dark"` stays (homepage `MatchesSliderSection` consumes dark).

**Dark theme:** panel bg flips to ink-soft. Cards remain identical to light theme (`bg-cream` + `border-2 ink`), but their box-shadow swaps to `--shadow-paper-sm-soft` via a `.panel--dusk` descendant rule so the offset depth stays readable. No green borders, no green shadows, no neon. Arrows on dusk panels get the same treatment.

### New token

```css
/* Append to the existing @theme block in apps/web/src/styles/globals.css */
--shadow-paper-sm-soft: 4px 4px 0 0 var(--color-ink-muted);
```

Used wherever `--shadow-paper-sm` (ink) would vanish: ink-bg active states (BrandedTab + FilterTab) and any chrome surface on a dark panel (arrows, cards, white-variant spinner).

---

## Historical exploration (preserved for reference)

The three original directional explorations led to the synthesis. Each is preserved for context:

| File | Direction | Status |
| --- | --- | --- |
| [`option-a-paper-and-tape.html`](option-a-paper-and-tape.html) | Paper &amp; Tape — paper feel everywhere on chrome | Historical — not chosen |
| [`option-b-mono-and-ink.html`](option-b-mono-and-ink.html) | Mono &amp; Ink — flat chrome, restrained | Historical — not chosen |
| [`option-c-matchday-programme.html`](option-c-matchday-programme.html) | Matchday Programme — programme vocabulary, sub-variants | Historical — not chosen |
| [`option-d-paper-chrome-ink-emphasis.html`](option-d-paper-chrome-ink-emphasis.html) | **Paper chrome, ink emphasis** | ✅ **Chosen** |

Owner feedback that drove the synthesis:

- BrandedTabs: liked Direction A's paper-card body, dropped the tape strip.
- FilterTabs: liked the paper-chip body but rejected jersey-fill active (too loud) and the green-border outline (too subtle); picked ink-invert for cohesion with BrandedTabs.
- Spinner: liked Direction C's barber-pole exclusively. Retired the logo variant.
- ScrollArrowButton: liked Direction A's paper button, dropped the tape strip and the dark-variant green styling.
- HorizontalSlider: rejected the live-card jersey-fill (no "active" state — all matches equally important); rejected the original dusk theme (cream-soft cards + jersey-deep border + green shadow read as visual noise on dark).

The new `--shadow-paper-sm-soft` token emerged from owner-flagged shadow visibility issues on dark/ink contexts: ink shadow on ink panel = invisible, ink shadow under ink active tab = merges into one solid block. Soft (ink-muted) shadow restores depth in both cases.

---

## Next step

The atom contracts above are the source-of-record for issues #1575–#1578. Each implementation issue:

1. Reads this `compare.md` + the canonical `option-d-paper-chrome-ink-emphasis.html`.
2. Ships its component reskin with a real Storybook story (`tags: ["autodocs", "vr"]`) per existing Phase 1 convention.
3. Captures VR baselines via `pnpm vr:update:story "<AtomName>"`.
4. Lists VR baselines updated in the PR description.

Issue #1573 (FilterTabs icon prop type swap) is closed by #1577 — the prop is removed entirely instead of being type-swapped.
