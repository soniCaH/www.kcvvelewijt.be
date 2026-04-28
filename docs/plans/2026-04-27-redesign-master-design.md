# Redesign Master Design — Editorial Sports Magazine

> **Status:** living design reference. Owned by the redesign initiative.
> **Date:** 2026-04-27
> **Companion:** `docs/prd/redesign-phase-0.md` (the Phase 0 PRD that derives from this doc).
> **Source material:**
>
> - Mockup screenshots committed at `docs/design/mockups/retro-terrace-fanzine/` (7 PNGs: homepage 3-variant, duo interview desktop+mobile, player profile desktop+mobile). The owner-named direction is **"retro-terrace fanzine"** and these screenshots are the canonical visual source for §2 (audit) and §5 (template applications).
> - This brainstorm session itself (2026-04-27 / 2026-04-28) — first written artifact for the direction.
> - Externally drafted Phase 0 PRD (Claude Web, no codebase access — superseded by `docs/prd/redesign-phase-0.md`).
> - Brainstorming session 2026-04-27 (this doc captures the outcome).

---

## 1. Context

### What this doc is

The canonical design reference for the entire KCVV Elewijt site redesign. It defines the **design language** (audit), the **token system** (CSS variables), the **primitive catalogue** (reusable React components), how those primitives **compose into templates**, and the **phased rollout** that gets us from today's site to the **retro-terrace fanzine** target without breaking production.

Per-phase PRDs (starting with `docs/prd/redesign-phase-0.md`) are derived from this doc. When the design language evolves, this doc is the source of truth and per-phase PRDs are revised to match.

### What this doc is _not_

- Not a PRD. PRDs are per-phase, in `docs/prd/`, and are the artefact issues are opened against.
- Not an implementation plan. Implementation plans live in `docs/plans/` per phase, after a PRD is locked.
- Not a brand guide. Brand colours and typography decisions are recorded here for design-system use; they are not exhaustive marketing-asset rules.

### Why now

1. The visual regression testing infrastructure (commits `feat(ui): vr phase 1..3`, merged 2026-04) is the safety net that makes a wholesale redesign feasible. Every redesigned `Features/*` component PR commits its baselines in the same change, so unintended regressions on adjacent components surface as VR diffs at PR time.
2. The current visual identity ("modern SaaS dashboard": geometric sans, dark surfaces, glassy cards) does not reflect KCVV Elewijt's culture ("Er is maar één plezante compagnie" — printed programmes, supporters' scarves, terrace banter, season magazines). The editorial direction does.
3. The owner explored multiple directions externally in Claude Design and converged on **"retro-terrace fanzine"** — a printed-programme / supporters-zine aesthetic anchored in cream paper, taped polaroids, striped jersey motifs, italic emphasis, and ticket-stub ephemera. The screenshots from that exploration are the canonical visual source for §2 of this doc.

### What changes vs. today

| Dimension           | Today                            | Target                                                                                       |
| ------------------- | -------------------------------- | -------------------------------------------------------------------------------------------- |
| Default surface     | Dark slate / black               | Cream `#F5F1E6` (newsprint paper)                                                            |
| Display typography  | Quasimoda (used as title)        | Freight Display Pro / Big Pro (serif)                                                        |
| Body typography     | Montserrat                       | Quasimoda (role flips: was title, becomes body)                                              |
| Image treatment     | Photographic, full-bleed heroes  | Taped polaroid cards, photo-first with illustration fallback                                 |
| Section transitions | Geometric diagonal solid colour  | Diagonal barber-pole stripe (`<StripedSeam>`)                                                |
| Brand colour role   | `#4ACF52` bright green pervasive | Same bright green, but used as accent / tape / CTA — not surface                             |
| Card depth          | Soft blurred shadows, glass      | Hard offset shadows (`4/6/8px 4/6/8px 0 0 ink`)                                              |
| Numerical values    | UI scale, mono                   | Big-serif drama (`#8`, `28 wedstrijden`, `2374 minuten`)                                     |
| Editorial voice     | Generic CMS prose                | Period-terminated headings with single-italic emphasis (`Het rooster.`, `Laatste *nieuws.*`) |

### Constraints respected (from saved owner preferences)

- No radial glows / rim lights.
- Prefer typographic glyphs over Lucide where the glyph reads.
- Stenciletta is off-limits unless explicitly requested — retire from the system.
- ~90% of player photos are rectangular (psdImage), not transparent cutouts — design imagery for bounded boxes first.
- No emojis in UI code.
- English in all PRs and commits.
- No negative-margin tricks for diagonal seams — SVG geometry only.
- Always add language identifiers to fenced code blocks in markdown.

---

## 2. Design language audit

The kit of parts decoded from the four mockups (homepage 3-variant, duo interview desktop+mobile, player profile desktop+mobile). Every recurring pattern below earns a primitive in §4.

### 2.1 Aesthetic anchors

1. **Cream newsprint surface.** Default page background `#F5F1E6`. Ink-on-cream is the primary contrast pair (~17:1). Dark blocks become _interludes_, not the default — the inverse of the current site.
2. **Editorial typography spine.** Display in Freight Display Pro (serif), with italics carrying signature emphasis (`Laatste *nieuws.*`, `In zijn eigen *woorden.*`). Body shifts to Quasimoda. Mono stays IBM Plex.
3. **Taped paper card pattern.** Content lives in slightly-rotated paper cards (-2.5° / -1.5° / +1° / +2°), green washi tape at corner, hard _offset_ shadow (4/6/8px, no blur). Cards layer onto cream like a season programme. **The frame is aspect-agnostic** — the same taped frame holds 16:9 landscape (article/event hero images, the dominant aspect in the Sanity library), square (cropped news thumbs), portrait (player figures, transfer passes, tickets), and text-only (jersey-bg variant from homepage mockup card 2). The mockups skew portrait because the artefacts shown were illustrative; production content is mostly landscape and the frame absorbs both without modification.
4. **Diagonal barber-pole seams.** Between major sections, a striped black/cream band breaks the page. Geometric, not photographic. SVG geometry, never negative margins.
5. **Hero collage.** Every hero is two-column: serif headline + intro + CTA on the left; a taped-paper artefact on the right (transfer pass, match ticket, interview portrait, jersey illustration).
6. **Numerical drama.** Big serif numbers as graphic monumentation: `#8`, `28 wedstrijden`, `2374 minuten`, `320 jongens en meisjes`, `4 ⋅ 0`. Numbers carry the page weight where photos used to.
7. **Mono-label pill rows.** Every editorial item starts with a row of small uppercase tracked labels: `INTERVIEW`, `SNELTREIN`, `8 MIN`, `MATCHVERSLAG`, `JEUGD ⋅ U15`. Title-case tags retire; mono caps come in.
8. **Italic emphasis as house style.** Period-terminated headings (`Het rooster.`, `Clubkledij '26.`, `Vier wedstrijden.`) with one italic word. Strong, recognisable voice.
9. **Striped jersey graphic device.** Horizontal green/white stripes recur on illustrated figures, retro thumbnails (`Retro '94`), webshop monogram grid (`H-U-K-V-V-R`). Becomes a brand pattern, reusable as bg fill.
10. **Ticket-stub ephemera.** `STAMNR. 55`, `SINDS 1909`, perforated edges, taped overlap. Small graphic anchors that read as printed memorabilia.
11. **Dark interlude blocks.** Youth section, retro shirt, pull-quotes flip to ink background with cream/jersey-bright text. Punctuates rhythm, isn't the default surface.
12. **Newspaper sponsor grid.** Sponsors render as a tabular grid with thin black borders, evoking a programme back-page. **Cells contain real sponsor logos** as primary content — the mockups show italic Freight Display names only because Claude design had no logo files; production data has logos and they are the recognizable asset that sponsors paid for. Names render as a small caption beneath each logo (accessibility + recognition fallback) or as the cell content only when no logo is available. The italic Freight Display treatment from the mockups stays in the headline (`Merci aan onze sponsors.`) and the partner-tier kicker labels.
13. **Poster-scale wordmark footer.** Page closes with `KCVV ELEWIJT` set massive in Freight Big Pro 900. Closing flourish.
14. **Sticky match strip.** Top header carries a persistent next-match shield + tickets CTA across all pages.
15. **Highlighter underline.** Italic emphasis words optionally carry a hand-drawn green highlighter stroke beneath them — fine, irregular, deliberately not mechanical.
16. **Drop caps.** Lead paragraphs of editorial pieces start with an oversized first letter set in display-2xl Freight Display 900, jersey-tinted.

### 2.2 System principles beneath the anchors

- **Paper depth, not glow.** Hard offset shadows simulate physical paper layered on paper.
- **Asymmetric polish.** Slight rotation, tape overhang, ticket-stub overflow. The site reads as printed and handled, not as a CMS.
- **Two-column tension.** Left = words, right = artefact. Recurring composition shape across hero, news cards, schedule, youth, even quote blocks. On mobile, columns stack (artefact above words, by default).
- **Photo-first, illustration-fallback for figures.** The polaroid frame holds either content. Illustration is reserved for marketing contexts where no specific person is named (youth "320 jongens", retro shirts, generic placeholder). Real photos take precedence in player profile / news cards / interview hero.
- **Mono for data, serif for voice.** Match scores, dates, stats render in IBM Plex Mono — they are _data_. Names, headlines, quotes render in Freight Display Pro — they are _voice_. The contrast is intentional and load-bearing.
- **Rotation alternation in lists.** Card grids cycle through a 4-rotation pool (`-2.5° / -1.5° / +1° / +2°`) via `nth-child(4n+1..4)` so 8-card lists feel pleasantly varied, not metronomic.

### 2.3 What this isn't

- Not "modern SaaS dashboard". No glassmorphism. No radial gradients. No Lucide icon walls (typographic glyphs preferred).
- Not photographic full-bleed hero with overlaid text — that's the current site's signature and it goes away.
- Open question: how broadly does the taped paper card aesthetic apply to UI chrome (forms, modals, dropdowns, toasts, popovers)? Two sensible defaults are in tension: (a) paper everywhere for visual consistency, (b) paper only at moments of editorial weight (hero artefacts, news cards, jersey grid, retro thumbnails) with chrome staying unrotated and using `--shadow-soft`. Either is defensible. Resolve at design time during the Phase 2 atom rework checkpoint when forms / inputs / modals get redesigned — not before. The owner has flagged a preference for consistency over rigid editorial-only restraint.

---

## 3. Token spec

All tokens live in `apps/web/src/app/globals.css` inside `@theme {}`. Tailwind v4 generates utility classes from these custom properties.

### 3.1 Dual-coexistence policy

- **New tokens are additive.** Land alongside legacy tokens (`--color-kcvv-green-bright`, `--color-kcvv-black`, etc.) without renaming or aliasing them.
- **No mappings.** Do not write `--color-kcvv-green-bright: var(--color-jersey)`. Mappings obscure migration progress and pollute VR diffs.
- **Component PRs swap consumers, not tokens.** A PR rebuilding `<NewsCard>` updates that component's class names from `bg-kcvv-black` to `bg-ink`, ships VR baselines for that component, and leaves legacy tokens untouched.
- **Final-cleanup PR retires legacy tokens once nothing references them.** Phase 9. Until then, both vocabularies live side-by-side.

### 3.2 Color tokens

```css
@theme {
  /* Surface */
  --color-cream: #f5f1e6; /* default page bg */
  --color-cream-soft: #ede8da; /* alt surface (sponsor row, secondary cards) */

  /* Ink (text + dark interludes) */
  --color-ink: #0a0a0a; /* primary text + dark bg */
  --color-ink-soft: #1f1f1f; /* layered dark surfaces */
  --color-ink-muted: #6b6b6b; /* byline, dividers */

  /* Brand green (anchored to existing values) */
  --color-jersey: #4acf52; /* accent / tape / CTA — never body text on cream */
  --color-jersey-deep: #008755; /* body-text-readable green on cream */
  --color-jersey-bright: #22c55e; /* green text on dark interludes */

  /* Edges */
  --color-paper-edge: #d9d2bd; /* card outline on cream */
}
```

| Combination          | Contrast   | Verdict                                                                                                                                                                                     |
| -------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ink on cream         | 17.5:1     | AAA all sizes                                                                                                                                                                               |
| ink-soft on cream    | 14.6:1     | AAA all sizes                                                                                                                                                                               |
| ink-muted on cream   | 4.7:1      | AA at ≥18pt only                                                                                                                                                                            |
| jersey on cream      | 1.8:1      | Decorative only — never text                                                                                                                                                                |
| jersey-deep on cream | **4.05:1** | **AA large-text (≥18pt) only** — does NOT meet AA body (4.5:1). Use `--color-ink` or `--color-ink-soft` for body green-on-cream copy; reserve `jersey-deep` for headings, accents, and CTAs |
| jersey-bright on ink | 8.7:1      | AAA all sizes                                                                                                                                                                               |
| cream on ink         | 17.5:1     | AAA all sizes                                                                                                                                                                               |

### 3.3 Typography tokens

#### Font roles after redesign

| CSS variable         | Family              | Source                                                         | Role                                       |
| -------------------- | ------------------- | -------------------------------------------------------------- | ------------------------------------------ |
| `--font-display`     | Freight Display Pro | Adobe Typekit (already added)                                  | Headlines, italic emphasis, card titles    |
| `--font-display-big` | Freight Big Pro     | Adobe Typekit (already added)                                  | `text-display-2xl` only, footer wordmark   |
| `--font-body`        | Quasimoda           | Adobe Typekit (already loaded — role flips from title to body) | Paragraphs, UI text                        |
| `--font-mono`        | IBM Plex Mono       | `next/font/google` (already loaded)                            | Match scores, byline metadata, mono labels |

**Retired:** Stenciletta (off-limits per owner preference), Montserrat (replaced by Quasimoda as body). Cleanup PR removes their `next/font` import and Typekit weights.

**Net Typekit changes:** zero new self-hosted woff2 files; +7 Freight files (already added by owner); -all Stenciletta files.

#### Type scale (fluid via `clamp()`)

```css
@theme {
  /* Display (serif) */
  --text-display-2xl: clamp(3.5rem, 1.5rem + 8vw, 6rem); /* 56 → 96 */
  --text-display-2xl--lh: 1;
  --text-display-xl: clamp(2.75rem, 1.5rem + 5vw, 4.5rem); /* 44 → 72 */
  --text-display-xl--lh: 1.05;
  --text-display-lg: clamp(2rem, 1.25rem + 3vw, 3rem); /* 32 → 48 */
  --text-display-lg--lh: 1.1;
  --text-display-md: clamp(1.5rem, 1rem + 1.5vw, 2rem); /* 24 → 32 */
  --text-display-md--lh: 1.2;
  --text-display-sm: clamp(1.25rem, 1rem + 1vw, 1.5rem); /* 20 → 24 */
  --text-display-sm--lh: 1.3;

  /* Body (sans) */
  --text-body-lg: 1.125rem; /* 18 (mobile 17) */
  --text-body-lg--lh: 1.55;
  --text-body-md: 1rem; /* 16 */
  --text-body-md--lh: 1.6;
  --text-body-sm: 0.875rem; /* 14 */
  --text-body-sm--lh: 1.55;

  /* Mono */
  --text-mono-md: 0.875rem; /* 14 (mobile 13) */
  --text-mono-md--lh: 1.4;
  --text-mono-sm: 0.75rem; /* 12 (mobile 11) */
  --text-mono-sm--lh: 1.4;
  --text-label: 0.6875rem; /* 11 — uppercase tracked labels */
  --text-label--lh: 1;
  --text-label--tracking: 0.08em;
}
```

#### Italic + emphasis behaviour

Freight Display italic is the design's signature. Use it on inline `<em>` inside display text:

- `<h2>Laatste <em>nieuws.</em></h2>` — italic word + period.
- Optional `<HighlighterStroke>` underneath the italic word.

In running body, italic stays in body font (Quasimoda italic). Don't mix Freight italic and Quasimoda italic in the same paragraph.

### 3.4 Spacing & rotation pool

Keep the existing 4/8 spacing scale. Add layout containers and the rotation pool:

```css
@theme {
  --container-prose: 680px; /* article / interview body width */
  --container-default: 1200px; /* standard page max-width */
  /* --max-width-outer (1440px) already exists — reuse for full-bleed */

  /* Rotation pool — TapedCardGrid cycles through these via nth-child(4n+1..4) */
  --rotate-tape-a: -2.5deg;
  --rotate-tape-b: -1.5deg;
  --rotate-tape-c: 1deg;
  --rotate-tape-d: 2deg;
}
```

A four-value rotation pool (instead of two) gives 8-card lists pleasant variety without becoming chaotic. Single cards default to `--rotate-tape-b` (-1.5°).

### 3.5 Shadow tokens

```css
@theme {
  --shadow-paper-sm: 4px 4px 0 0 var(--color-ink);
  --shadow-paper-md: 6px 6px 0 0 var(--color-ink);
  --shadow-paper-lift: 8px 8px 0 0 var(--color-ink); /* hover state */
  --shadow-soft: 0 2px 8px rgba(0, 0, 0, 0.08); /* modals/dropdowns only */
}
```

Hard offset shadows simulate paper-on-paper. Avoid blurred shadows except on UI chrome that does not pretend to be print (modals, dropdowns, popovers).

### 3.6 Motion tokens

```css
@theme {
  --motion-fast: 150ms ease-out;
  --motion-base: 240ms cubic-bezier(0.2, 0.8, 0.2, 1);
  --motion-tape: 300ms ease-out; /* card hover tilts upright + shadow lifts */
}
```

Respect `prefers-reduced-motion`: drop tilts on hover, keep shadow lifts.

### 3.7 Pattern tokens

Background patterns become first-class tokens, not magic strings inside components:

```css
@theme {
  /* Wide jersey stripes — hero illustrations, dark interlude bg */
  --pattern-jersey-stripes: repeating-linear-gradient(
    90deg,
    var(--color-jersey) 0 32px,
    var(--color-cream) 32px 64px
  );

  /* Tight jersey stripes — small figures, retro thumbnails */
  --pattern-jersey-stripes-tight: repeating-linear-gradient(
    90deg,
    var(--color-jersey) 0 14px,
    var(--color-cream) 14px 28px
  );

  /* Diagonal barber-pole seam — section transitions */
  --pattern-seam: repeating-linear-gradient(
    -45deg,
    var(--color-ink) 0 8px,
    var(--color-cream) 8px 16px
  );
}
```

`<StripedSeam>` (§4.1) is SVG-backed so it has clean start and end caps; the seam pattern is the fill of the SVG path.

### 3.8 Resolved PRD open questions

The Claude Web PRD listed four open questions. All are resolved here:

1. **Jersey green hex.** Locked at `#4ACF52` (existing brand bright). No need to verify against external brand guide — this is the value already in `globals.css` today.
2. **Mono choice.** IBM Plex Mono (already loaded via `next/font/google`). Numeric clarity is excellent.
3. **Highlighter implementation.** SVG path, not `text-decoration`. Reason: text-decoration breaks awkwardly across line wraps and renders as a mechanical stroke. The mockups show clearly hand-drawn underlines, irregular by design. `<HighlighterStroke>` wraps children in spans-per-line and absolutely-positions an SVG underneath each.
4. **Cream tone exact value.** `#F5F1E6` locked. Re-validate by eyedropper once the actual mockup PNGs are committed to the repo (today they live as HTML in `docs/design/mockups/`); cheap to adjust at any phase.

---

## 4. Primitive catalogue

Every primitive lives at `apps/web/src/components/design-system/<Name>/<Name>.tsx` with sibling `<Name>.stories.tsx` (Storybook title `UI/<Name>`) and `<Name>.test.tsx`, exported from `apps/web/src/components/design-system/index.ts`. Rules from `apps/web/CLAUDE.md` are non-negotiable:

- `Foundation/` Storybook group is reserved for token MDX docs only — no primitive stories live there.
- Primitive stories live under `UI/<Name>` with `tags: ["autodocs", "vr"]` from day one — VR baselines committed in the same PR.
- New colour tokens get added to `src/stories/foundation/Colors.mdx`. New type tokens to `Typography.mdx`. New spacing/shadow to `SpacingAndIcons.mdx`. New patterns to a new `Patterns.mdx`.

Primitives are listed in dependency order so the build order falls out for free.

### 4.1 Tier A — pure decorative (zero React deps, ship first)

| Primitive                                                | Purpose                                                                                                                                  | Key props                                                                                                                            |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `<TapeStrip>`                                            | Diagonal washi-tape graphic on card corners                                                                                              | `color: 'jersey' \| 'ink' \| 'cream'`, `position: 'tl' \| 'tr' \| 'bl' \| 'br'`, `length: 'sm' \| 'md' \| 'lg'`, `rotation?: number` |
| `<StripedSeam>`                                          | Diagonal barber-pole horizontal section divider — SVG-backed (clean caps), never negative-margin                                         | `direction: 'horizontal' \| 'vertical'`, `height: 'sm' \| 'md' \| 'lg'`, `colorPair: 'ink-cream' \| 'jersey-cream'`                  |
| `<DottedDivider>` / `<DashedDivider>` / `<SolidDivider>` | Thin row dividers (interview Q&A, table rows)                                                                                            | `style: 'dotted' \| 'dashed' \| 'solid'`, `color: 'ink' \| 'paper-edge'`, `inset?: boolean`                                          |
| `<QuoteMark>`                                            | Two stacked italic open-quote glyphs (~20px)                                                                                             | `color: 'jersey' \| 'ink' \| 'cream'`                                                                                                |
| `<TicketStub>`                                           | Perforated-edge ephemera (`STAMNR. 55`, `SINDS 1909`)                                                                                    | `label: string`, `value: string`, `rotation?: number`, `position: 'overlay-tr' \| 'overlay-bl' \| 'inline'`                          |
| `<HighlighterStroke>`                                    | SVG hand-drawn underline beneath italic emphasis. Multi-line aware (per-line spans). Three hand-drawn variants for a non-mechanical feel | `variant: 'a' \| 'b' \| 'c'`, `color: 'jersey'`                                                                                      |
| `<MonoLabel>`                                            | Tracked uppercase pill or plain label                                                                                                    | `variant: 'plain' \| 'pill-jersey' \| 'pill-ink' \| 'pill-cream'`, `size: 'sm' \| 'md'`                                              |

### 4.2 Tier B — composition (depend on Tier A)

| Primitive            | Purpose                                                                                                                                                                                                                                                                                                                                              | Key props                                                                                                                                                                                                                                       |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<TapedCard>`        | Wrapper that gives any child the rotated-paper treatment                                                                                                                                                                                                                                                                                             | `rotation: 'a' \| 'b' \| 'c' \| 'd' \| 'none' \| 'auto' \| <deg>`, `tape?: TapeStripProps \| TapeStripProps[]`, `shadow: 'sm' \| 'md' \| 'lift'`, `bg: 'cream' \| 'cream-soft' \| 'ink' \| 'jersey'`, `padding: 'sm' \| 'md' \| 'lg' \| 'none'` |
| `<TapedCardGrid>`    | Grid wrapper that auto-cycles the 4-rotation pool via `nth-child(4n+1..4)`. Children rendered with `rotation="auto"` get the slot's rotation                                                                                                                                                                                                         | `columns: 1 \| 2 \| 3 \| 4`, `gap: 'sm' \| 'md' \| 'lg'`, `as: 'div' \| 'ol' \| 'ul'`                                                                                                                                                           |
| `<MonoLabelRow>`     | Inline row of `<MonoLabel>` separated by `·`                                                                                                                                                                                                                                                                                                         | `divider: '·' \| '\|'`, `as: 'div' \| 'ol' \| 'ul'`                                                                                                                                                                                             |
| `<EditorialHeading>` | Period-terminated heading with optional italic emphasis word + optional highlighter underline                                                                                                                                                                                                                                                        | `level: 1..6`, `size: 'display-2xl' \| 'display-xl' \| 'display-lg' \| 'display-md' \| 'display-sm'`, `emphasis?: { text: string; position: 'before' \| 'after' \| 'inline' }`, `highlight?: boolean`                                           |
| `<PullQuote>`        | Quote block — QuoteMark + italic display body + attribution row                                                                                                                                                                                                                                                                                      | `attribution: { name: string; role?: string; source?: string }`, `tone: 'cream' \| 'ink' \| 'jersey'`                                                                                                                                           |
| `<NumberDisplay>`    | Big serif number as graphic monumentation (`#8`, `28`, `2374`)                                                                                                                                                                                                                                                                                       | `value: string \| number`, `size: 'display-2xl' \| 'display-xl' \| 'display-lg'`, `tone: 'jersey' \| 'jersey-deep' \| 'ink' \| 'cream'`, `prefix?: '#' \| 'nr.'`, `suffix?: string`                                                             |
| `<DropCapParagraph>` | Lead paragraph with oversized first letter (display-2xl 900, jersey-tinted)                                                                                                                                                                                                                                                                          | `as: 'p' \| 'div'`, `tone: 'jersey' \| 'ink'`, children                                                                                                                                                                                         |
| `<TapedFigure>`      | Editorial photo + optional caption / credit row. Composes `<TapedCard>` + `<img>` + `<figcaption>`. **Default aspect is 16:9** — the dominant aspect in the article/event content library — but accepts square and portrait via `aspect` prop. Used for article body images, event thumbnails, match detail hero photo, inline editorial photography | `src: string`, `alt: string`, `aspect: 'landscape-16-9' \| 'square' \| 'portrait-3-4' \| 'auto'`, `caption?: string`, `credit?: string`, `rotation?: TapedCardProps['rotation']`, `tape?: TapedCardProps['tape']`                               |

### 4.3 Tier C — domain figures (illustration assets)

| Primitive            | Purpose                                                                                                                                                    | Key props                                                                                                                                                                                            |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<PlayerFigure>`     | Illustrated striped jersey + arms with circular face slot. Photo-first (`imageSrc` from `player.psdImage` is the face); generic cartoon face when no photo | `imageSrc?: string`, `imageAlt?: string`, `jerseyVariant: 'home' \| 'away' \| 'retro-94'`, `numberOverlay?: string`, `size: 'sm' \| 'md' \| 'lg' \| 'xl'`, `pose: 'standing' \| 'cropped-shoulders'` |
| `<JerseyShirt>`      | Stylized jersey thumbnail (no body) — webshop monogram grid, retro shirt thumbnails                                                                        | `variant: 'home-stripes' \| 'away-black' \| 'kcvv-band' \| 'retro-94-white'`, `letterOverlay?: string`, `size: 'sm' \| 'md' \| 'lg'`                                                                 |
| `<EndMark>`          | Closing flourish for long-form articles (`* Einde gesprek *`)                                                                                              | `flourish: 'star' \| 'em-dash'`, `text?: string`                                                                                                                                                     |
| `<QASectionDivider>` | Centered italic title with em-dash flourish — marks acts inside an interview                                                                               | `title: string`, `flourish: 'em-dash' \| 'star'`                                                                                                                                                     |

### 4.4 Existing components that need rework

| Existing                                                                    | What changes                                                                                                                                                                 | Phase           |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| `<Button>`                                                                  | New variants: `primary` (jersey on cream), `inverted` (cream on ink), `ghost` (ink outline on cream). Drops the bright-green-pill aesthetic.                                 | Phase 2         |
| `<Badge>`                                                                   | **Retire.** `<MonoLabel>` supersedes it. Migration is per-consumer.                                                                                                          | Phase 1 cleanup |
| `<BrandedTabs>`                                                             | Rework borders + active state to match mono-label aesthetic.                                                                                                                 | Phase 2         |
| `<PageHero>`                                                                | Major rework. Probably becomes `<EditorialHero>` with discriminated `variant` prop (`transfer \| match-preview \| interview \| event \| announcement \| generic \| player`). | Phase 3         |
| `<SectionHeader>`                                                           | Becomes a thin wrapper over `<EditorialHeading>` + `<MonoLabelRow>`.                                                                                                         | Phase 1         |
| `<Alert>` / `<Spinner>` / `<Input>` / `<Select>` / `<Textarea>` / `<Label>` | Update tokens (cream surface, ink text, jersey accents) but keep structure.                                                                                                  | Phase 2         |
| `<HorizontalSlider>` / `<ScrollHint>` / `<FilterTabs>`                      | Update tokens; preserve interaction behaviour.                                                                                                                               | Phase 2         |
| `<PageHeader>` (`Layout/`)                                                  | Rework nav typography (mono caps), add `<MatchStrip>` integration, swap colour scheme.                                                                                       | Phase 3         |
| `<PageFooter>` (`Layout/`)                                                  | Rework with `<PosterWordmark>` + dark column layout.                                                                                                                         | Phase 3         |

### 4.5 Deliberately _not_ in v1

- A `<TapedCard variant="polaroid" \| "news" \| "profile">` mega-prop. Variants of cards are different _compositions_, not different props on one wrapper.
- Per-illustration character variants (smiling, serious, raising-arms). `<PlayerFigure>` has one pose vocabulary at launch.
- Animation primitives. Tilt-on-hover lives inside `<TapedCard>`'s built-in motion; nothing else animates by default.
- A separate `<Card>` neutral wrapper. The catalogue ships `<TapedCard>` (paper feel, the dominant card primitive). Whether non-editorial UI surfaces (forms, modals, dropdowns) also adopt the paper feel for consistency, or use a softer chrome treatment, is decided per surface during the relevant phase's design checkpoint — not by introducing a third card abstraction up front.

---

## 5. Template applications

Three mocked templates, decomposed into the primitive catalogue. Each template exists as a `Pages/<Name>` Storybook story with `tags: ["autodocs", "vr"]` so VR catches regressions across the full composition.

### 5.1 Homepage (`/`)

Stack, top-down:

1. `<SiteHeader>` — KCVV wordmark + nav links + search icon + `<Button variant="primary">WORD LID</Button>`. Sticky.
2. `<MatchStrip>` — persistent sub-header band with next-match shield + tickets CTA. Lives in `apps/web/src/components/layout/MatchStrip/`. Renders only when an upcoming match exists.
3. `<EditorialHero>` — single component, six variants (`transfer | match-preview | interview | event | announcement | generic`). Variant only changes the right-column artefact + kicker labels; headline + intro + CTA structure is shared.
4. `<NewsGrid>` — header row: edition label + `<EditorialHeading size="display-lg" emphasis={{text:"nieuws", highlight:true}}>Laatste nieuws.</EditorialHeading>` + "ALLE ARTIKELS →" right-aligned. Body: `<TapedCardGrid columns={3}>` with mixed-bg `<NewsCard>` children. NewsCard composes `<TapedCard bg={"cream" | "jersey" | "ink"}>` + image (`<TapedFigure>` or inline `<img>`) OR placeholder OR text-only + `<MonoLabelRow>` + heading + dek + read-more. NewsCard accepts `aspectRatio: 'landscape-16-9' | 'square' | 'portrait-3-4' | 'text-only'` — most articles arrive with 16:9 hero images and render that aspect inside the polaroid frame; mockup-style square crops are reserved for thumbnails and visual rhythm where editorial taste calls for it. The polaroid frame, tape, rotation, and shadow stay constant across all aspect variants — only the inner image aspect varies.
5. `<StripedSeam>` — section divider.
6. `<ScheduleStandingsBlock>` — `<EditorialHeading>Het rooster.</EditorialHeading>` + two `<TapedCard bg="ink">` panels: `<MatchScheduleTable>` (4 rows × `date · time · opponent · comp · result`), `<StandingsTable>` (5 rows × `pos · team · diff · pts`). Tab row above (A-PLOEG / B-PLOEG / JEUGD-PLOEG) reskins existing `<BrandedTabs>`.
7. `<StripedSeam>`.
8. `<YouthBlock>` — full-bleed jersey-bg interlude. `<MonoLabelRow>JEUGD · U6 · U21</MonoLabelRow>` + `<EditorialHeading size="display-xl" emphasis={{text:"toekomst"}}>De toekomst van Elewijt trapt vandaag haar eerste bal.</EditorialHeading>` + lead paragraph + 2 CTAs + `<TapedCard rotation="b">` containing `<JerseyShirt variant="home-stripes" letterOverlay="U11">` + `<TicketStub label="STAMNR." value="55">`.
9. `<WebshopStrip>` — cream bg. `<EditorialHeading>Clubkledij '26.</EditorialHeading>` + 4-column `<JerseyShirt>` row with prices.
10. `<SponsorsBlock>` — newspaper-style sponsor grid replacing today's logo strip. `<EditorialHeading>Merci aan onze sponsors.</EditorialHeading>` + thin-bordered grid of real sponsor logos + "WORD SPONSOR +" CTA. Per the existing tier model (saved-memory `reference_sponsor_tiers.md`): only `main` and `second` tier sponsors render on the homepage; `regular` sponsors are page-only. Main tier renders in larger cells than second tier so visual hierarchy reflects sponsorship value. Each cell carries the logo as primary content + a small mono-caption sponsor name underneath for accessibility / recognition. **Logos render in greyscale by default and reveal full colour on hover / focus** via `filter: grayscale(100%)` with a `--motion-base` transition (decision 16 in §9). Cells with no available logo fall back to the italic Freight Display name treatment from the mockup.
11. `<PosterWordmark>` — green-bg full-bleed band: `<MonoLabel>ER IS MAAR ÉÉN PLEZANTE</MonoLabel>` + `text-display-2xl` `KCVV ELEWIJT` in Freight Big Pro 900 + small mono metadata row.
12. `<SiteFooter>` — ink bg, club logo + 3 columns (CLUB / CONTACT / VOLG ONS) + bottom strip.

### 5.2 Duo interview (`/nieuws/[slug]` for `articleType: "interview"` with multiple subjects)

This is the surface that should make the redesign feel viscerally different from the current site.

Stack:

1. `<SiteHeader>` (mobile gets hamburger toggle).
2. `<MatchStrip>` (only if next match exists).
3. `<InterviewHero subjects={[Julien, Niels]}>` — `<MonoLabelRow>` (kind, format, read-time) + small star-kicker `* AFSCHEID DUBBEL *` + `<EditorialHeading size="display-xl">` flanked by two `<TapedCard rotation={"a","b"}>` figures (each composes `<PlayerFigure>` with photo + jersey variant + name tag) + dek + byline metadata row. Supports 1–3 subjects via array length.
4. `<DropCapParagraph>` — `<MonoLabel variant="pill-jersey">INTRO</MonoLabel>` overlay + paragraph where the first character renders in `text-display-2xl` Freight Display 900 with a green tint.
5. `<QASection>` — body container max-width `--container-prose` (680px). Children: alternating `<QARow>` and `<QASectionDivider>`.
   - `<QARow>` props: `number`, `speaker`, `question`, `answer`, `avatar?`, `tone: "cream" | "ink"`. Number renders as Freight Display 900 in jersey-deep green. Speaker tag in mono. Question in `text-display-sm` 600. Answer in `text-body-md`. `<DottedDivider>` between rows.
   - `<QASectionDivider>` props: `title` (italic display-sm), `flourish: "em-dash" | "star"`.
6. `<PullQuote tone="jersey">` and `<PullQuote tone="ink">` — interleave between Q&A clusters. Compose `<TapedCard>` with QuoteMark + italic display body + attribution row + tiny avatar.
7. `<EndMark flourish="star">` — small `* Einde gesprek *` centered closer.
8. `<InterviewCredits>` — `<MonoLabel>CREDITS</MonoLabel>` + 4-column credits grid + 3 share buttons (X, FB, copy-link).
9. `<SiteFooter>`.

Domain shape: the existing Sanity `article` schema needs the `articleType: "interview"` discriminator and a `subjects: Reference[]` field for multi-subject interviews. See `docs/design/interview-multi-subject-review.md` for the precedent. Duo / triple interviews drive layout choice — single-subject interviews use a simpler hero variant.

### 5.3 Player profile (`/spelers/[slug]`)

Stack:

1. `<SiteHeader>`.
2. `<MatchStrip>`.
3. `<PlayerHero>` — `<MonoLabelRow>` (team · position · profile) + `<NumberDisplay size="display-2xl" tone="jersey">#8</NumberDisplay>` + `<EditorialHeading size="display-xl">Maxim Breugelmans</EditorialHeading>` + metadata row (position · age · height · foot — using `text-mono-md`) + right-column `<TapedCard rotation="b">` with `<PlayerFigure imageSrc={player.psdImage} />` (photo-first, illustration fallback) + `<MonoLabel>NIEUW</MonoLabel>` + `<TicketStub>A-PLOEG 26/27</TicketStub>`.
4. `<StripedSeam>`.
5. `<StatsStrip tone="ink">` — `<MonoLabelRow>* SEIZOEN 25/26 · TUSSENSTAND</MonoLabelRow>` + 5 `<NumberDisplay>` instances with mono labels under each.
6. `<StripedSeam>`.
7. `<BioBlock>` — `<MonoLabelRow>* EVEN VOORSTELLEN</MonoLabelRow>` + `<EditorialHeading>Acht keer Elewijt.</EditorialHeading>` + paragraph (left, `--container-prose`) + `<PullQuote tone="jersey">` (right column on desktop, full-width on mobile).
8. `<CareerLogTable>` — `<EditorialHeading>Het logboek.</EditorialHeading>` + table rows (year range · club crest · club name + role · optional `<MonoLabel variant="pill-jersey">` tag).
9. `<RecentMatchesGrid tone="ink">` — `<MonoLabelRow>* NOG VERS IN HET GEHEUGEN</MonoLabelRow>` + `<EditorialHeading>Vier wedstrijden.</EditorialHeading>` + 4-card grid: each card mono date + comp + score (mono display) + goal/assist tag + venue.
10. `<QuotesBlock>` — `<EditorialHeading emphasis={{text:"woorden"}}>In zijn eigen woorden.</EditorialHeading>` + 2-card pair: `<PullQuote tone="ink">` (left) + `<PullQuote tone="cream">` (right).
11. `<MatchStrip>` (mirrors top).
12. `<SiteFooter>`.

Data note: `<PlayerFigure>` accepts `imageSrc` directly — Sanity `player.psdImage` becomes a circular crop (CSS `clip-path`). When missing, falls back to the illustrated cartoon face. Aligns with the "subject photos default to rectangular" reality: PlayerFigure crops a circle out of a rectangular source, which works for any reasonable headshot.

### 5.4 Cross-template observations

- **Match scores in cards use mono**, not display serif — the editorial language treats results as data (mono) and player names as voice (serif). The contrast is intentional and load-bearing.
- **Two-column tension is universal** — every hero / interlude / quote block is left-words / right-artefact (or inverted). On mobile, columns stack; the artefact moves above the headline by default.
- **The `<EditorialHero variant=...>` discriminated union is the most reused composition** — it covers article details, event details, match details, and player profiles too. Reusing one component for hero patterns is cheaper than five.

---

## 6. Shape notes — un-mocked routes

Short paragraphs describing how the design language applies to routes that have no mockup yet. Each note names the primitives that compose the page; full design specs come per-phase.

### 6.1 News listing (`/nieuws`)

Page-hero: `<EditorialHero variant="generic">` with `Het nieuws.` headline, optional kicker for an active filter. Body: `<TapedCardGrid columns={3}>` of `<NewsCard>` instances (same primitive used on homepage). Filter row above grid uses reskinned `<FilterTabs>` (mono caps tabs, ink underline). Pagination uses minimal mono "OUDER →" / "← NIEUWER" links instead of numbered pages.

### 6.2 Article detail — non-interview variants (`/nieuws/[slug]`)

Existing types likely include matchverslag, column, transfer, jeugd-update, evenement, generic. Each maps to an `<EditorialHero variant=...>` plus a body composed of:

- `<DropCapParagraph>` for the lead.
- `<EditorialHeading size="display-md">` subheads.
- Inline `<TapedFigure>` images at native 16:9 aspect — the article body image primitive. Renders at full prose-column width with a small caption row underneath.
- Optional inline `<PullQuote>`, `<TapedCard>` callout, `<TicketStub>` for stat ephemera.
- Body text in `--container-prose` width.
- End closer: `<EndMark flourish="em-dash">`.
- Author / share footer same as interview.

There is an existing `docs/prd/article-detail-redesign.md` which this work supersedes — re-write that PRD on top of these primitives in Phase 4.

### 6.3 Match detail (`/wedstrijd/[matchId]`)

Three hero states: upcoming (preview), live (in progress), finished (verslag).

- **Upcoming:** `<EditorialHero variant="match-preview">` — taped match-ticket artefact with date/venue, two club shields stacked, "VOORBESCHOUWING" mono kicker. Body: `<MatchPreviewBody>` composing tactical notes + recent form using `<TapedCardGrid>`.
- **Live:** big mono score in the hero card, period clock in mono, possession/shots stats in `<NumberDisplay>` row, `<StatsStrip>` minute-by-minute event log with `<DashedDivider>` rows.
- **Finished:** "MATCHVERSLAG" hero with 16:9 match photo (via `<TapedFigure aspect="landscape-16-9">`) paired with the score and final-whistle ephemera + key moments + `<PullQuote>` from coach reaction + `<RecentMatchesGrid>` of head-to-head history.

Standings widget reuses the homepage's `<StandingsTable>` primitive.

### 6.4 Team listing (`/ploegen`)

Hero: `<EditorialHero variant="generic">` `Onze ploegen.` Body: `<TapedCardGrid columns={2}>` of team cards — each card composes `<TapedCard bg="ink">` + team crest + team name in `<EditorialHeading size="display-md">` + `<MonoLabelRow>` of season tag + classification + small fixture count + "BEKIJK PLOEG →".

Existing `docs/prd/teams-landing-page.md` is superseded — restate in Phase 6.

### 6.5 Team detail (`/ploegen/[slug]`)

`<TeamHero>` — kicker (A-PLOEG / U21 / etc.), `<EditorialHeading>` team name, `<MonoLabelRow>` (classification, coach, season), right-column taped polaroid with team-photo or jersey illustration + `<TicketStub>SEIZOEN 25/26</TicketStub>`. Sections: `<StatsStrip>` season W/D/L + GF/GA, `<StandingsTable>` with this team highlighted, `<MatchScheduleTable>` upcoming + past, `<SquadGrid>` of `<PlayerCard>` instances (each composes `<TapedCard>` + `<PlayerFigure>` + name + position), staff section, `<SponsorsBlock>` filtered by team.

### 6.6 Calendar (`/kalender`)

Hero: `<EditorialHero variant="generic">` `Kalender.` Body: cream paper page with month-by-month sections. Each month: `<EditorialHeading size="display-md">April '26.</EditorialHeading>` followed by a `<DashedDivider>`-separated list of events — date column (mono), title column (display), location column (mono), tag column (`<MonoLabel>` for type). No card treatment — it's a tabular agenda. Filter row reskins `<FilterTabs>` (matches / events / training / supporter activities).

### 6.7 Events list + detail (`/events`, `/events/[slug]`)

List: `<TapedCardGrid columns={3}>` of `<EventCard>` (composes `<TapedCard>` + landscape `<TapedFigure aspect="landscape-16-9">` cover image + date `<TicketStub>` overlay + title + location + `<MonoLabel>` tag). Detail: `<EditorialHero variant="event">` with date ticket-stub artefact paired with the event hero image at 16:9; body in `--container-prose` + inline `<TapedFigure>` photos for any in-line imagery + RSVP CTA + sponsor/credit footer. Event imagery is overwhelmingly 16:9 today and renders at native aspect inside the polaroid frame.

### 6.8 Sponsors (`/sponsors`)

Hero: `<EditorialHero variant="generic">` `Onze sponsors.` Body: tier sections. Per saved memory ("sponsor tiers: main / second / regular"):

- Main sponsors: `<TapedCardGrid columns={2}>` with large real logos as primary content + sponsor name in italic Freight Display underneath + short blurb + outbound link.
- Second sponsors: `<TapedCardGrid columns={3}>` with medium logos + name + link.
- Regular sponsors: denser newspaper-grid layout (same primitive as homepage `<SponsorsBlock>` but tighter), each cell a small logo + mono name caption.

All sponsor logos site-wide render greyscale by default and reveal full colour on hover / focus (decision 16 in §9). Logos are the primary asset throughout — the italic Freight Display name treatment is reserved for headlines, captions, and missing-logo fallbacks. Existing `docs/prd/sponsors-redesign.md` is superseded — restate in Phase 7.

### 6.9 Jeugd landing (`/jeugd`)

Mockups already preview this aesthetic via the homepage `<YouthBlock>`. Full page: `<EditorialHero variant="announcement">` `De toekomst van Elewijt.` with jersey-illustration artefact. Body sections: filosofie, divisions (Bovenbouw / Middenbouw / Onderbouw — per saved memory; _not_ scholieren/duiveltjes), trainers grid, "schrijf je in" CTA, supporting sponsors. Existing `docs/prd/jeugd-landing-page.md` is superseded — restate in Phase 7.

### 6.10 Club pages (`/club/organigram`, `/club/geschiedenis`)

- **Organigram:** existing schema work (responsibility-finder, organigram-node-schema) is in flight. The redesign treats each board member / committee as a `<TapedCard>` polaroid with `<PlayerFigure>` photo + role tag. Hierarchy renders via `<DashedDivider>` group separators rather than connecting lines (paper aesthetic).
- **Geschiedenis:** long-form editorial article using the article-detail primitives. Open with a `<DropCapParagraph>` of the founding story; punctuate with year-anchor `<TicketStub>` graphics (`SINDS 1909`, `STAMNR. 55`, plus historical milestones authored editorially as the article is written); embed historical photos as `<TapedCard>` polaroid figures; close with `<EndMark>`.

Existing `docs/prd/club-landing-page.md` is superseded for the landing-page level — restate in Phase 7.

### 6.11 Hulp (`/hulp`)

A "vragen + contact" page — relatively dry. Hero: `<EditorialHero variant="generic">` `Hulp nodig?`. Body: FAQ accordions in `<TapedCard bg="cream-soft">` (light alt surface, no rotation — UI chrome), then a contact form using reskinned `<Input>` / `<Textarea>` / `<Select>` / `<Button>`. Below the form: `<TicketStub>DRIESSTRAAT 32</TicketStub>` + opening hours in mono.

### 6.12 Search (`/zoeken`)

Hero: `<EditorialHero variant="generic">` `Zoeken.` with prominent search input. Results render as `<TapedCardGrid columns={2}>` of mixed `<NewsCard>` / `<PlayerCard>` / `<TeamCard>` / `<EventCard>` results (a discriminated union driven by result type). Empty state uses an illustrated `<JerseyShirt>` with a `?` overlay + helpful prompt.

### 6.13 Privacy (`/privacy`)

Long-form legal text. `<EditorialHero variant="generic">` `Privacyverklaring.` + body in `--container-prose` with `<EditorialHeading size="display-md">` subheads. No artefacts, no cards — just clean editorial prose. This is the rare page where the design language steps back; the content is all that matters.

### 6.14 404 / error states

404: `<EditorialHero variant="generic">` `Off-side.` (or similar football-themed pun) + cream-bg body + `<JerseyShirt variant="home-stripes" letterOverlay="?">` taped artefact + "TERUG NAAR HOME" CTA + small `<MonoLabel>FOUT 404</MonoLabel>`. Apply the same shape to 500 / generic error pages with appropriate copy.

---

## 7. Phased roadmap

The redesign rolls out over ~9 phases. Per the rollout decision, each phase is a **per-component PR series** — old and new tokens coexist in `globals.css` until cleanup. Each phase that touches `Features/*` carries the Visual Regression baseline contract from `docs/prd/visual-regression-testing.md` §12.

**Visual approval gating** is hybrid by deliberate design (see §8 for the full workflow):

- **Phases 0–2 and 9** ship behind Storybook iteration alone. Tokens and small primitives are abstract enough that a Storybook story is a sufficient visual contract; mockups would not add information.
- **Phases 3–8** require a _Design checkpoint_ before any implementation work begins. The checkpoint runs `/design-an-interface` to produce 2–3 directional mockup options for the new surfaces, the owner picks one, and only then does PRD-writing → plan-writing → execution proceed for that phase.

### Phase summary

| Phase | Focus                                                           | Design gate                                                                                                                                                                                                                         | Primitives delivered                                                                                                                                                       | Components touched                                                                                                                                                                         | Effort                             |
| ----- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------- |
| **0** | Foundations: tokens + Tier A decorative                         | Storybook only                                                                                                                                                                                                                      | `<TapeStrip>`, `<StripedSeam>`, dividers, `<QuoteMark>`, `<TicketStub>`, `<HighlighterStroke>`, `<MonoLabel>`                                                              | None refactored                                                                                                                                                                            | 1–2 weeks                          |
| **1** | Tier B composition primitives                                   | Storybook only                                                                                                                                                                                                                      | `<TapedCard>`, `<TapedCardGrid>`, `<MonoLabelRow>`, `<EditorialHeading>`, `<PullQuote>`, `<NumberDisplay>`, `<DropCapParagraph>`, `<TapedFigure>`                          | `<SectionHeader>` reworked; `<Badge>` retired                                                                                                                                              | 2 weeks                            |
| **2** | Atom rework                                                     | Storybook only                                                                                                                                                                                                                      | (no new primitives)                                                                                                                                                        | `<Button>`, `<Input>`, `<Select>`, `<Textarea>`, `<Label>`, `<Alert>`, `<Spinner>`, `<BrandedTabs>`, `<FilterTabs>` token swaps                                                            | 1–2 weeks                          |
| **3** | Tier C domain figures + EditorialHero variants                  | **Mockups via `/design-an-interface`** — 6+ EditorialHero variants need approving (transfer / match-preview / interview / event / announcement / generic / player); PlayerFigure photo+illustration handling needs design decisions | `<PlayerFigure>`, `<JerseyShirt>`, `<EndMark>`, `<QASectionDivider>`; new `<EditorialHero>`                                                                                | Existing `<PageHero>` retired; `<SiteHeader>` + `<MatchStrip>` + `<SiteFooter>` reworked                                                                                                   | 2–3 weeks design + 2–3 weeks build |
| **4** | Homepage rebuild                                                | **Mockups per section** — even though one homepage exemplar exists, NewsGrid, ScheduleStandings, YouthBlock, WebshopStrip, SponsorsBlock, PosterWordmark each need detailed mockups                                                 | (no new primitives)                                                                                                                                                        | `<NewsGrid>`, `<NewsCard>`, `<ScheduleStandingsBlock>`, `<YouthBlock>`, `<WebshopStrip>`, `<SponsorsBlock>`, `<PosterWordmark>`                                                            | 1–2 weeks design + 2–3 weeks build |
| **5** | Article detail (interviews first)                               | **Mockup per variant** — duo interview is mocked; matchverslag, column, transfer, jeugd, evenement, generic each need a mockup                                                                                                      | `<InterviewHero>`, `<QARow>`, `<QASection>`, `<InterviewCredits>`                                                                                                          | All article variants. `docs/prd/article-detail-redesign.md` superseded                                                                                                                     | 2–3 weeks design + 3–4 weeks build |
| **6** | Player profile + match detail + team detail + calendar + events | **Mockup per page type** — player profile is mocked; match detail (3 states), team detail, kalender, events list + detail each need a mockup                                                                                        | `<PlayerHero>`, `<StatsStrip>`, `<BioBlock>`, `<CareerLogTable>`, `<RecentMatchesGrid>`, `<QuotesBlock>`, `<MatchPreviewBody>`, `<TeamHero>`, `<SquadGrid>`, `<EventCard>` | Player profile, match detail, team detail, kalender, events                                                                                                                                | 3–4 weeks design + 4–5 weeks build |
| **7** | Club + jeugd + teams + sponsors landings                        | **Mockup per page** — none mocked. Sponsors tier rendering needs particular attention (logos vs names; monochrome vs colour)                                                                                                        | (no new primitives)                                                                                                                                                        | Sponsors page, jeugd landing, teams landing, club organigram + geschiedenis. Existing `docs/prd/{sponsors,jeugd-landing-page,teams-landing-page,club-landing-page}-redesign.md` superseded | 2 weeks design + 2–3 weeks build   |
| **8** | Hulp + search + privacy + error pages                           | **Mockup per page** — none mocked                                                                                                                                                                                                   | (no new primitives)                                                                                                                                                        | All remaining surfaces                                                                                                                                                                     | 1 week design + 1–2 weeks build    |
| **9** | Cleanup                                                         | None                                                                                                                                                                                                                                | (no new primitives)                                                                                                                                                        | Retire legacy tokens, retire Stenciletta + Montserrat, retire `<Badge>` consumers, retire `<PageHero>`                                                                                     | 1–2 weeks                          |

**Total elapsed effort estimate:** ~25–40 weeks of focused work, depending on how many design rounds each gated phase needs. The wider range than before reflects design-checkpoint time, which can iterate (the owner may push back on mockup options once or twice before approval). Brownfield site stays live throughout; mixed-state visual is acceptable per rollout decision.

### VR baseline contract per phase

Every PR in every phase that:

1. Adds a new `UI/<Name>` story → adds the story file with `tags: ["autodocs", "vr"]`, captures baselines in Docker, commits the PNGs.
2. Modifies a `Features/<Domain>/<Component>` story already in the Phase 3 Include list (`docs/prd/visual-regression-testing.md` §12) → updates baselines, commits PNGs, justifies in PR body's `## VR baselines` section.
3. Modifies a `Layout/<Component>` story → same as (2).
4. Adds a `Pages/<Name>` story → captures baselines in same PR.

Stories that genuinely cannot be made deterministic carry `parameters.vr.disable = true` with the inline-comment template from the PRD.

### Phase entry / exit criteria

- **Entry (gated phases 3–8):** previous phase is fully merged; design checkpoint completed, mockup option chosen, mockups committed to `docs/design/mockups/<phase-N>/`; per-phase PRD written and references the chosen mockup; corresponding GitHub issue exists.
- **Entry (un-gated phases 0–2 and 9):** previous phase is fully merged; per-phase PRD has been written, reviewed, and locked; corresponding GitHub issue exists.
- **Exit (all phases):** all per-phase PRs merged; CI green; per-phase Storybook page reviewable; design owner sign-off recorded in the issue close-out comment.

### Merging redesign with concurrent feature work

The redesign runs in parallel with ongoing match-day, news, and operations work. Concurrent rules:

1. Concurrent feature PRs that touch a redesigned component **must** use the new primitives (no new code on retired patterns).
2. Concurrent PRs on un-redesigned surfaces continue using legacy tokens — that's fine.
3. Token additions in any phase are append-only — no token gets removed until Phase 9. This is what makes mixed state safe.

---

## 8. Workflow per phase

Each phase moves from idea to merged code through a fixed sequence. Phases 0–2 and 9 skip the _Design checkpoint_ step; phases 3–8 must run it. The rest of the steps are the same for every phase.

### 8.1 Sequence

```text
[ Design checkpoint ]   ← skipped for Phases 0-2, 9
        |
        v
[ PRD writing ]
        |
        v
[ Implementation plan writing ]
        |
        v
[ Worktree + GitHub issue creation ]
        |
        v
[ Execution (subagent-driven OR parallel session) ]
        |
        v
[ VR baselines + check-all green ]
        |
        v
[ PR open → owner review → merge ]
```

### 8.2 Step 1 — Design checkpoint (Phases 3–8 only)

Run inside the redesign worktree. Invoke `/design-an-interface` with a brief framing the surface(s) the phase covers. The skill produces 2–3 directional mockup options per surface, typically as standalone HTML or PNG files.

**Inputs the skill needs to do good work:**

- The `docs/plans/2026-04-27-redesign-master-design.md` audit (§2) and primitive catalogue (§4).
- The shape note for the surface from §6 (or the template spec from §5 if mocked).
- Sample data shapes — current Sanity schema shapes, sample article / event / match payloads — so mockups render against real text lengths, not lorem ipsum.
- Owner-stated must-haves and must-avoids per surface (e.g. "this is for parents, not players" or "no commercial sponsor placement on jeugd page").

**Outputs:**

- 2–3 mockup options committed to `docs/design/mockups/phase-<N>-<surface>/option-<a|b|c>.html` (or `.png` if image-only).
- A short markdown comparison file `docs/design/mockups/phase-<N>-<surface>/compare.md` summarising trade-offs of each option.

**Owner decision flow:**

1. Owner reviews options visually (open the HTML files; view PNGs).
2. Owner picks one, or asks for a revision round (the skill iterates inside the same `phase-<N>-<surface>/` directory).
3. Once an option is chosen, the chosen file is renamed `option-final.html`. The other options stay committed for history.
4. Master design doc §5 (templates) or §6 (shape notes) is updated to reflect any composition decisions visible in the chosen mockup but not yet documented (e.g. concrete responsive breakpoints, exact mono-label positions, illustration sizes).

**Time budget per checkpoint:** typically 2–5 days including 1–2 revision rounds. Allocate more for phase 6 (5+ surfaces) and phase 7 (4 landings).

### 8.3 Step 2 — PRD writing

Per-phase PRD lives at `docs/prd/redesign-phase-<N>.md`. Mirrors the structure of `docs/prd/redesign-phase-0.md` (the working example). PRD must:

- Cite the master design doc + the chosen mockup file from §8.2.
- Enumerate every component / page touched, mapped to the primitives from §4.
- Specify the _new_ tokens (if any) added to `globals.css` in this phase. Most non-foundation phases add zero new tokens.
- Include a "VR baselines" section listing which `Features/<Domain>/` story files acquire baselines in this phase, and which existing baselines update.
- Include an Analytics section per `apps/web/CLAUDE.md` rule (events, GTM mappings, GA4 dimensions for new user interactions).

PRDs that supersede an earlier per-feature PRD (e.g. Phase 5 supersedes `docs/prd/article-detail-redesign.md`) say so explicitly and link the superseded file. Old PRDs are not deleted — kept for git-blame context.

### 8.4 Step 3 — Implementation plan writing

Run `superpowers:writing-plans` with the per-phase PRD as input. Plan lives at `docs/plans/YYYY-MM-DD-redesign-phase-<N>-plan.md` and follows the bite-sized TDD task structure (see `docs/plans/2026-04-28-redesign-phase-0-plan.md` as the template).

### 8.5 Step 4 — Worktree + issue

Open a GitHub issue per phase: `Phase <N>: <surface(s)>`. Body links to the PRD, plan, and chosen mockup files.

Create a worktree for execution:

```bash
git -C /path/to/repo worktree add ../kcvv-issue-<N> -b feat/issue-<N> origin/main
```

Per-phase worktrees keep the `feat/redesign-master` branch (which holds the master doc) free for ongoing language refinement.

### 8.6 Step 5 — Execution

Either:

- **Subagent-driven** in the active session — fresh subagent per task, owner reviews between tasks. Best for early phases (0–2) where pace matters.
- **Parallel session** — open a new Claude Code session inside the per-phase worktree and run `superpowers:executing-plans`. Best for long phases (4–6) where the active session continues design work for the next phase in parallel.

Either way, each task in the plan is bite-sized (2–5 minutes per step), commits frequently, and ends with the per-phase plan's "Definition of Done" gates green.

### 8.7 Step 6 — VR + check-all

Per the rules already documented in `apps/web/CLAUDE.md` and the VR contract (`docs/prd/visual-regression-testing.md`):

- All new `UI/<Name>` and `Pages/<Name>` stories tagged `["autodocs", "vr"]`, baselines committed in the same PR.
- Updated baselines for existing `Features/<Domain>/` and `Layout/<Component>` stories justified in the PR body's `## VR baselines` section.
- `pnpm --filter @kcvv/web run check-all` green before requesting review.

### 8.8 Step 7 — PR open + review + merge

PR uses the body template from the per-phase plan's "Open the PR" task. Owner approves; CodeRabbit feedback addressed; merge.

After merge, the next phase's design checkpoint can begin (or run in parallel with the previous phase's PR if they are independent).

### 8.9 What if a mockup approval fails late?

If during execution a built component reveals the chosen mockup was wrong (e.g. a layout that worked in mockup HTML breaks at real responsive breakpoints, or real Sanity content has lengths the mockup didn't anticipate), halt the phase and re-enter §8.2. Document the failure mode in the phase issue close-out so subsequent phases factor it in. This is rare but explicitly allowed — design checkpoints buy _most_ of the visual certainty, not all of it.

---

## 9. Decision log

Decisions made in the 2026-04-27 brainstorm, with rationale.

1. **Retro-terrace fanzine direction.** The owner explored several directions externally in Claude Design and chose this one — a printed-programme / supporters-zine aesthetic anchored in cream paper, taped polaroids, striped jersey motifs, italic emphasis, and ticket-stub ephemera. The screenshots from that exploration are committed at `docs/design/mockups/retro-terrace-fanzine/`.
2. **Photo-first, illustration-fallback.** ~90% of player photos are rectangular (psdImage). Building primitives around illustration would require commissioning per-player art; building around photos uses what we already have. Illustrations stay in the system as fallback + marketing-context graphic.
3. **Per-component PR rollout, dual-token coexistence.** Big-bang requires too much engineering for a club site; feature flags add infrastructure cost without a real audience-testing benefit. VR baselines make per-component safe.
4. **Pattern catalogue + applied templates** as the master-doc shape (this doc). Mocked surfaces get full specs; un-mocked surfaces get shape notes. No speculative full design for unmocked routes.
5. **Worktree at `feat/redesign-master`** for the doc itself. Subsequent phase PRDs land in `docs/prd/redesign-phase-N.md` on the same or successor branches.
6. **Jersey green = `#4ACF52`** (existing brand bright). PRD's `#00A651` was speculative and is not adopted.
7. **Quasimoda role flips title → body.** Avoids self-hosting another woff2 — Quasimoda is already on Typekit. Replaces Montserrat for body text.
8. **Stenciletta retires entirely.** Per saved owner preference.
9. **Highlighter underline = SVG, not `text-decoration`.** Hand-drawn irregularity, multi-line aware.
10. **Storybook structure follows existing convention.** Primitives under `UI/<Name>`, NOT under `Foundation/`. Tokens in `Foundation/` MDX.
11. **Tailwind v4, tokens in `globals.css`.** No `tailwind.config.ts` — the Claude Web PRD's snippet doesn't apply.
12. **Aspect-ratio agnostic primitives.** The taped paper frame is dimension-agnostic — 16:9 landscape (the dominant aspect of existing article and event imagery), square, portrait, and text-only all fit inside the same `<TapedCard>` without modification. Phase 1 ships `<TapedFigure>` as a dedicated landscape-by-default editorial photo + caption primitive for inline article body imagery, event thumbnails, and match-detail hero photos. `<NewsCard>` (Phase 4) takes an `aspectRatio` prop so mixed-aspect grids stay coherent: tape, rotation, and shadow stay constant; only the inner image aspect varies. (from owner correction 2026-04-28: existing content library is overwhelmingly 16:9; design must absorb that without forcing a re-crop.)
13. **Stamnummer is `55`** (not `55⋅24`, not `55-24`). The `-24` suffix in mockup ticket-stub artwork is a decorative season/year tag, not part of the stamnummer. All ticket-stub examples in this doc use the canonical value. (from owner correction 2026-04-28.)
14. **The football club in Elewijt has existed since 1909.** Mockup artwork showing `ANNO 1924` / `SINDS 1924` is a typo. Earlier saved-memory entries that said `1964` were also wrong. All "since X" branding in this doc and any subsequent design uses `1909`. (from owner correction 2026-04-28.)
15. **Design checkpoint gating, hybrid by phase.** Phases 0–2 and 9 (tokens, primitives, atoms, cleanup) ship behind Storybook iteration alone — abstract pieces don't earn their keep with mockups. Phases 3–8 (composite components, full pages, landings) require a `/design-an-interface` checkpoint with 2–3 mockup options, owner approval, and committed mockups in `docs/design/mockups/phase-<N>-<surface>/` _before_ PRD writing begins. This was made explicit because the owner cannot sign off on the entire redesign from the three exemplar mockups (homepage / duo interview / player profile) — most surfaces still need designing. See §8 for the full workflow. (from owner concern 2026-04-28.)
16. **Sponsor logos render greyscale by default, full colour on hover.** Resolves the sponsor-treatment open question. CSS implementation:

    ```css
    .sponsor-logo {
      filter: grayscale(100%);
      transition: filter var(--motion-base);
    }
    .sponsor-logo:hover,
    .sponsor-logo:focus-visible {
      filter: grayscale(0%);
    }
    @media (prefers-reduced-motion: reduce) {
      .sponsor-logo {
        transition: none;
      }
    }
    ```

    `filter: grayscale()` works on any source — JPG, PNG, SVG — so no per-sponsor monochrome asset is required, and sponsors continue uploading their normal colour logos. The hover-to-colour reveal preserves the newspaper feel by default while letting visitors confirm the actual brand on interaction. Applies to both the homepage `<SponsorsBlock>` and the `/sponsors` page tier sections. (from owner decision 2026-04-28.)

17. **Icon library = Phosphor (Fill weight) end-to-end + typographic glyphs.** Resolves the Lucide-vs-retro question after two rounds of visual A/B at `docs/design/exploratory/phase-2-icons.html`. Round 1 verdict 2026-04-28: "Phosphor Fill is the very clear winner. Game Icons is really the worst by far." Round 2 (after 7 AI-authored sample SVGs): owner reaction "quite some icons completely unrecognizable — the ball, whistle, cup, ticket all look rubbish". The AI-authored direction failed where it was supposed to add value (brand-character icons); Phosphor Fill's quality at those cases is materially better. Decision:
    - **Tier 1 — typographic glyphs** wherever readable (arrows, separators, checkmarks, stars, asterisks). Saved-memory preference holds: `→`, `←`, `★`, `✦`, `✓`, `↓`, `☞`, `✏︎` typed directly in body/mono font, no SVG.
    - **Tier 2 — Phosphor Fill** (`@phosphor-icons/react` with `weight="fill"`) for **all icon needs**, including brand-character ones (football, trophy, megaphone, ticket). Solid ink-stamp weight reads as printed without fighting the cream/ink palette. Lucide retires from redesign surfaces in Phase 2 atom rework; legacy components keep Lucide until their own phase per dual-coexistence.
    - **Rejected:** Game Icons (engraving feel off-brand). Streamline Hand-Drawn (paid). AI-authored custom SVGs as a primary source (failed brand-character quality bar). Commissioned illustrator (owner: out of budget).
    - **Custom-authored escape hatch:** retained only for rare cases where Phase 2/3 components genuinely need an icon Phosphor doesn't have AND a typographic glyph can't replace it AND the shape is simple enough that AI authoring can produce an acceptable result. By exception, not by default.

    The exploratory comparison artefact at `docs/design/exploratory/phase-2-icons.html` is preserved for the record (now showing the 7 first-draft AI samples that informed the round-2 verdict). Phase 2 atom rework PRD will scope: install `@phosphor-icons/react`, refactor `src/lib/icons.ts` to re-export Phosphor `weight="fill"` variants, retire Lucide from redesign surfaces, update affected `Button` / `Alert` / `BrandedTabs` / `FilterTabs` consumers, capture VR baselines. (from owner decision 2026-04-28, finalized after round-2 review.)

### Open questions deferred to per-phase PRDs

1. **Match strip behaviour when no upcoming match exists.** Skip entirely? Show last result? Show "GEEN MATCH DEZE WEEK" placeholder? Decide in Phase 3.
2. **Highlighter SVG asset format.** Inline SVG component or imported `.svg` from `apps/web/public/`? Decide in Phase 0 implementation.
3. **Drop-cap accessibility.** Screen reader handling of the oversized first letter — `aria-hidden` decorative + repeat the letter inside the paragraph, or rely on browser handling? Decide in Phase 1.
4. **TapedCardGrid empty / single-card states.** Should a 1-card grid still rotate? Should an empty grid render a placeholder? Decide in Phase 1.
5. **Adobe Typekit kit max payload.** With Stenciletta removed and Freight added (7 files), confirm total kit payload is acceptable on mobile — measure in Phase 0.
6. **Player figure photo crop.** Where the headshot lands inside the cartoon body ring — vertical centre, slightly above centre? Test against a sample of real `psdImage` faces in Phase 3.
7. **How broadly does the paper-card aesthetic apply to UI chrome?** Forms, modals, dropdowns, popovers, toasts: do they adopt the cream/tape/rotation/hard-shadow language for visual consistency with the editorial surfaces, or stay as un-rotated chrome with `--shadow-soft` so they read as functional UI rather than printed memorabilia? The owner has flagged a preference for consistency over rigid editorial-only restraint, but reserves judgement until forms/modals are actually mocked. Phase 2 atom rework only swaps tokens on individual elements (`<Button>`, `<Input>`, etc.) — the container-level question (is a modal a `<TapedCard>` or a chrome surface?) gets answered at the first phase that introduces a real modal in a mockup. Likely Phase 6 (search modals, RSVP modals) or Phase 8 (hulp form). Until then, default to chrome treatment with `--shadow-soft` for any modal/dropdown/popover that ships.
   ~~8. Icon library — Lucide vs a retro replacement?~~ **Resolved 2026-04-28 — see decision log entry 17.**

---

## 10. References

- Source PRD (Claude Web, no codebase access — superseded): originally proposed at `docs/prd/redesign-phase-0.md` upstream context. The refined replacement lives at `docs/prd/redesign-phase-0.md`.
- Visual source: `docs/design/mockups/retro-terrace-fanzine/` — 7 owner-curated screenshots from a Claude Design exploration (homepage 3-variant, duo interview desktop+mobile, player profile desktop+mobile) plus a `README.md` describing each.
- Visual Regression contract: `docs/prd/visual-regression-testing.md`.
- Multi-subject interview precedent: `docs/design/interview-multi-subject-review.md`.
- Ubiquitous language (domain glossary): `docs/ubiquitous-language.md`.
- Owner saved preferences (memory): see `feedback_visual_preferences.md`, `feedback_no_negative_margin_seam_fix.md`, `feedback_subject_photo_fallback.md`, `reference_sponsor_tiers.md`, `reference_design_inspiration_sites.md`.
- Existing per-feature redesign PRDs (to be superseded as phases land): `docs/prd/article-detail-redesign.md`, `docs/prd/news-redesign.md`, `docs/prd/sponsors-redesign.md`, `docs/prd/jeugd-landing-page.md`, `docs/prd/teams-landing-page.md`, `docs/prd/club-landing-page.md`.

---

_End of master design._
