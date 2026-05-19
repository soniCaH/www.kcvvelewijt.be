# fileAttachment + htmlTable — locked (drill 5.d-file + 5.d-table / #1840 drill 5)

**Drill:** 5.d-file + 5.d-table · One visual round each + inline pairing · #1840 drills 5.1 + 5.2
**Locked:** 2026-05-19 by @climacon
**Mockups:**

- `5d-file/round-1-fileattachment-comparisons.html`
- `5d-table/round-1-htmltable-comparisons.html`

---

> This lock supersedes the legacy `<DownloadButton>` (white-bg gray-border with file-type colored accent bar and scale hover) and the legacy `HtmlTableBlock` (gray header band with alternating white/gray rows). Both restyle for the Phase 5 cream surface without any schema migration.

## What this drill resolves

- ✅ **5.1 card variant:** Option B (Taped document with corner stamp) — TapedCard family, single ochre tape strip top, stenciled file-type stamp (rotated -3°), italic display label, jersey-deep "Download" CTA pill on the right.
- ✅ **5.1 inline variant:** Option C (compact pill) — single-row chip with file-type pill + italic serif label + mono caps size + download glyph.
- ✅ **5.2 table treatment:** Hybrid C+A — dark card wrapper (from C) with jersey-deep header band (from A) and mono body cells (from C).

## What this drill does NOT decide

- **Schema migrations** — none. `fileAttachment` and `htmlTable` schemas stay unchanged. All work is in `apps/web` CSS / component refactor.
- **Sticky first column / scroll hint** — preserved verbatim from the legacy `HtmlTableBlock` (`useScrollHint` hook, sticky-on-scroll first column).
- **HTML sanitization** — preserved (`TABLE_SANITIZE_OPTIONS` unchanged).
- **File-type colour palette** — kept as the legacy `FILE_TYPES` lookup table (PDF red, Word blue, Excel green, PowerPoint orange, ZIP amber, other gray). Restyle only changes how those colours sit on the cream surface, not the palette.

## 5.1 — `<DownloadButton>` Phase 5 spec

### Card variant (default, Option B)

```text
            ┌── ochre tape strip (-2° rotation, top-center) ─┐
            │                                                 │
   ╔════════════════════════════════════════════════════════╗
   ║  ┌──────┐                                              ║
   ║  │ PDF  │  Trainingsschema seizoen 2025-2026     [⬇ Download]  ║
   ║  │ stamp│  1,4 MB · Bijgewerkt 12 mei                  ║
   ║  └──────┘                                              ║
   ╚════════════════════════════════════════════════════════╝
```

- **Card:** cream-white background (`#fdfaf1`), 1px subtle ink border, 4px offset shadow `rgba(26,26,26,0.7)`, no rotation.
- **Tape strip:** ochre `rgba(255, 200, 110, 0.8)`, 92px × 16px, centered top, rotated -2°. Single tape per card (same vocabulary as articleImage R1 lock).
- **Stamp (left):** 64px × 64px square, 2px file-type-coloured border, 4px corner radius, transparent file-type-coloured background tint (6% opacity), rotated -3°. Mono caps "PDF" (16px / 800 weight) + "Bestand" subtitle (8px). Stamp is purely decorative — accessibility hidden.
- **Body (center):** italic Freight Display 18px / 700 / italic for the label; mono caps 10px / 0.14em for the subtitle ("1,4 MB · Bijgewerkt …" — last-updated date is optional, drop when absent).
- **CTA (right):** jersey-deep mono caps "Download" pill — 36px height, ink border, 3px offset shadow, press-down hover. Same vocabulary as the locked video play pill (drill 4.2).
- **Hover:** canonical press-down on the whole anchor — `hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-300`.
- **Focus:** standard design-system focus ring on the anchor.

### Inline variant (Option C — for in-prose references)

```text
   [PDF] Trainingsschema seizoen 2025-2026  1,4 MB  ⬇
```

- **Chip:** cream background, 1px ink border, 3px offset shadow, 40px height, inline-flex with 10px gap.
- **Extension pill (left):** file-type-coloured background (PDF red, Word blue, etc.), cream text, mono caps 9px / 0.16em, 22px height, 7px horizontal padding.
- **Label (center):** italic Freight Display 16px, ink colour.
- **Size:** mono caps 11px / 0.1em, ink-muted.
- **Download glyph:** ink-muted, 14px.
- **Hover:** canonical press-down.

### Variant selection

The legacy `variant: "card" | "inline"` prop is preserved. Default stays `card` (B). Editors pick `inline` when the file reference fits inside prose flow (e.g., "Bekijk het [PDF chip] voor meer details").

### Stamp colour rule

- PDF → red `#c0392b`
- Word → blue `#2563b3`
- Excel → green `#15803d`
- PowerPoint → orange `#f97316`
- ZIP → amber `#d97706`
- Other → gray `#6b7280`

Same `FILE_TYPES` lookup table as the legacy `<DownloadButton>` — only the visual presentation changes. Stamp colour applies to: the stamp border, the stamp background tint, and the extension text. CTA pill stays jersey-deep regardless of file type.

## 5.2 — `<HtmlTableBlock>` Phase 5 spec

### Hybrid card with jersey header (locked spec)

```text
   ╔══════════════════════════════════════════════════════════╗
   ║ DATUM ⋮ TEGENSTANDER ⋮ LOCATIE ⋮ UITSLAG    ← jersey-deep header band, cream mono caps
   ╠══════════════════════════════════════════════════════════╣
   ║ Za 12 jul ⋮ VK Veltem  ⋮ Uit   ⋮ 2-1                    ║
   ║ ...........................................              ← dotted ink-muted row divider
   ║ Za 19 jul ⋮ SK Berg    ⋮ Thuis ⋮ 3-0                    ║
   ║ ...........................................              ║
   ║ ...                                                       ║
   ╚══════════════════════════════════════════════════════════╝
   └── 1px ink border + 4px offset shadow (TapedCard family, no tape)
```

- **Card wrapper:** 1px ink border, 4px offset shadow `var(--color-ink)`, white background, no tape, no rotation. Overflow-x: auto (preserves legacy horizontal scroll).
- **Header band:** `background: var(--color-jersey-deep)`, cream text. Mono caps 10px / 0.18em / 600 weight, left-aligned, 10px × 12px padding.
- **Header column dividers:** 1px dotted at 25% cream opacity (`color-mix(in srgb, var(--color-cream) 25%, transparent)`) — visible against jersey-deep, same intent as the locked C's dotted-on-ink.
- **Body cells:** monospace 13px (`--font-mono`), 8px × 12px padding, ink colour. Mono font aligns columns visually for numeric / fixture data.
- **First column override:** italic Freight Display 15px / 600 / italic. Breaks the mono rhythm; gives row identifiers editorial weight. Applies to `tbody td:first-child` only.
- **Row dividers:** 1px dotted `--color-ink-muted` `border-top` on every `tbody td`. Last row has no bottom divider (relies on card edge).
- **Column dividers in body:** 1px dotted `--color-ink-muted` `border-left` on every `tbody td:not(:first-child)`.
- **Zebra (subtle):** even rows `background: rgba(0, 0, 0, 0.025)` — very faint ink tint, aids row scanning without competing with the dotted dividers.

### Preserved legacy behaviour

- **Horizontal scroll wrapper** — `overflow-x: auto` on the card wrapper. Legacy `useScrollHint` hook keeps managing the scroll-hint affordance.
- **Sticky first column on scroll** — legacy CSS preserved. First column gets `position: sticky`, `left: 0`, `z-index: 10` when the parent has horizontal overflow. Header `th:first-child` also sticks (`z-index: 20`). Box-shadow `2px 0 4px -1px rgba(0,0,0,0.08)` for the sticky edge.
- **HTML sanitization** — `TABLE_SANITIZE_OPTIONS` unchanged.

### Editor experience

No Studio change. Editors continue to paste raw HTML into `htmlTable.html` (the field's purpose remains "Drupal table import"). The new Phase 5 styling is applied entirely on the rendering side via the wrapper's Tailwind classes.

## Component contracts

### `<DownloadButton>` — refactor

Path: `apps/web/src/components/design-system/DownloadButton/DownloadButton.tsx` (refactor in place; the legacy export stays the only export).

**Storybook stories required** (per `feedback_state_coverage_stories`):

- card / PDF · with size · with description
- card / Word · with size · no description
- card / ZIP · no size
- card / other (unrecognised mime) · ensures fallback colour
- inline / PDF · with size
- inline / Word · no size
- hover state (visual regression captures the press-down)
- mobile viewport — card wraps gracefully when label is long

### `<HtmlTableBlock>` — refactor

Path: `apps/web/src/components/article/SanityArticleBody/SanityArticleBody.tsx` — extract `HtmlTableBlock` into its own component file so it can be consumed by the new `<ArticleBody>` PT serializer too.

**Storybook stories required:**

- Schedule table (5 rows × 4 cols) — locked-spec exemplar
- Wide table (8 cols) — confirms horizontal scroll + sticky first column
- Single-column table — confirms the layout doesn't break with minimal data
- Empty/whitespace HTML — confirms `null` return guard

## Net new vocabulary / schema

- **Schema:** none. `fileAttachment` and `htmlTable` schemas stay untouched.
- **Tokens:** none new. Reuses jersey-deep, cream, cream-soft, ink, ink-muted, existing file-type colours.
- **Components:** in-place refactor of `<DownloadButton>` + extraction of `<HtmlTableBlock>` into its own file.

## Downstream impact

- **#1829 (5.B body migration)** — this drill unblocks the `<ArticleBody>` serializer wiring for both block types. The migration ships the refactored `<DownloadButton>` and extracted `<HtmlTableBlock>`.
- **Other `<DownloadButton>` consumers** — search the codebase for `DownloadButton` usage outside article bodies (staff bios, club pages, downloads index). The restyle propagates to all of them automatically; visual regression baselines need refresh.
- **Legacy `HtmlTableBlock`** — inlined in `SanityArticleBody.tsx` today. Extract first (no behaviour change), then refactor styling. Two PR-friendly steps.

## Source-of-truth

- Mockup HTML: paths listed above.
- Schema (unchanged): `packages/sanity-schemas/src/fileAttachment.ts`, `packages/sanity-schemas/src/htmlTable.ts`.
- Existing components being refactored: `apps/web/src/components/design-system/DownloadButton/DownloadButton.tsx`, `apps/web/src/components/article/SanityArticleBody/SanityArticleBody.tsx` (`HtmlTableBlock` inline).
- Memories consumed: `feedback_reuse_approved_primitives`, `feedback_canonical_press_down_hover`, `feedback_state_coverage_stories`.
