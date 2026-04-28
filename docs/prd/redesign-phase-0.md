# Redesign — Phase 0: Foundations

> **Master design reference:** `docs/plans/2026-04-27-redesign-master-design.md`
> **Epic:** KCVV Elewijt redesign — retro-terrace fanzine aesthetic
> **Blocks:** all subsequent component issues (Phase 1–9)
> **Owner:** _you_
> **Estimate:** 1–2 weeks

---

## Context

This phase establishes the design foundations every subsequent component will depend on: tokens (typography, colour, spacing, shadow, motion, patterns), Tier A decorative primitives, and Storybook documentation.

**No component refactors happen in this PR.** That's deliberate. We get the tokens and primitives right once, then every later phase moves fast against a stable foundation. The dual-coexistence policy (master design §3.1) keeps legacy tokens untouched so existing components continue to render unchanged.

This PRD supersedes the externally-drafted Phase 0 PRD that was authored without codebase access (referenced legacy `tailwind.config.ts`, proposed `src/components/foundations/`, assumed self-hosted Quasimoda woff2, used a placeholder jersey-green hex). Each correction is called out inline.

---

## Goals

1. Add new design tokens to `apps/web/src/app/globals.css` `@theme {}` (additive — legacy tokens stay).
2. Add the seven Tier A decorative primitives to `apps/web/src/components/design-system/`.
3. Document the new tokens in Storybook MDX (`Foundation/Colors`, `Foundation/Typography`, `Foundation/SpacingAndIcons`, plus a new `Foundation/Patterns`).
4. Document each new primitive in Storybook with `tags: ["autodocs", "vr"]` and capture VR baselines in the same PR.
5. Ensure the redesign Adobe Typekit kit changes are committed: Freight already added (owner-confirmed); Stenciletta and Montserrat retire from kit configuration.

---

## Non-goals

- Refactoring existing components — they keep their legacy tokens until their own phase lands.
- Building Tier B / C primitives — those land in Phase 1.
- Building atoms (`<Button>`, `<MonoLabel>`-driven badges, `<EditorialHeading>`) — Phase 1–2.
- Page-level changes.
- Migrating away from Tailwind / current CSS approach.
- Adding `tailwind.config.ts`. The codebase uses Tailwind v4, configured entirely in `globals.css` `@theme {}` — there is no `tailwind.config.ts` and there will not be one. (Correction vs. external PRD.)

---

## 1. Tokens to add

All tokens land additively inside the existing `@theme {}` block in `apps/web/src/app/globals.css`. Legacy tokens (`--color-kcvv-*`, `--color-green--*`, etc.) remain untouched.

### 1.1 Colour

```css
@theme {
  /* Surface */
  --color-cream: #f5f1e6;
  --color-cream-soft: #ede8da;

  /* Ink */
  --color-ink: #0a0a0a;
  --color-ink-soft: #1f1f1f;
  --color-ink-muted: #6b6b6b;

  /* Brand green (anchored to existing #4ACF52 / #008755 — no speculative hexes) */
  --color-jersey: #4acf52;
  --color-jersey-deep: #008755;
  --color-jersey-bright: #22c55e;

  /* Edges */
  --color-paper-edge: #d9d2bd;
}
```

Contrast ratios (verified against WCAG AA):

| Combination          | Ratio      | Verdict                                                                                                                                                                                      |
| -------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ink on cream         | 17.5:1     | AAA all sizes                                                                                                                                                                                |
| ink-soft on cream    | 14.6:1     | AAA all sizes                                                                                                                                                                                |
| ink-muted on cream   | 4.7:1      | AA at ≥18pt only                                                                                                                                                                             |
| jersey on cream      | 1.8:1      | Decorative only — never text                                                                                                                                                                 |
| jersey-deep on cream | **4.05:1** | **AA large-text (≥18pt) only** — does NOT meet AA body (4.5:1). Body green-on-cream copy must use `--color-ink` or `--color-ink-soft`; `jersey-deep` is reserved for headings, accents, CTAs |
| jersey-bright on ink | 8.7:1      | AAA all sizes                                                                                                                                                                                |
| cream on ink         | 17.5:1     | AAA all sizes                                                                                                                                                                                |

### 1.2 Typography

Font roles after redesign — new CSS variables added; existing `--font-family-title` / `--font-family-body` / `--font-family-mono` stay until Phase 9 cleanup:

```css
@theme {
  --font-display: "freight-display-pro", Georgia, "Times New Roman", serif;
  --font-display-big: "freight-big-pro", Georgia, "Times New Roman", serif;
  /* --font-body and --font-mono are existing; redesign reuses them with role swap */
  --font-body:
    quasimoda, -apple-system, system-ui, BlinkMacSystemFont, sans-serif;
  --font-mono:
    var(--font-ibm-plex-mono), "Consolas", "Liberation Mono", monospace;
}
```

Type scale (fluid via `clamp()`):

```css
@theme {
  --text-display-2xl: clamp(3.5rem, 1.5rem + 8vw, 6rem);
  --text-display-2xl--lh: 1;
  --text-display-xl: clamp(2.75rem, 1.5rem + 5vw, 4.5rem);
  --text-display-xl--lh: 1.05;
  --text-display-lg: clamp(2rem, 1.25rem + 3vw, 3rem);
  --text-display-lg--lh: 1.1;
  --text-display-md: clamp(1.5rem, 1rem + 1.5vw, 2rem);
  --text-display-md--lh: 1.2;
  --text-display-sm: clamp(1.25rem, 1rem + 1vw, 1.5rem);
  --text-display-sm--lh: 1.3;
  --text-body-lg: 1.125rem;
  --text-body-lg--lh: 1.55;
  --text-body-md: 1rem;
  --text-body-md--lh: 1.6;
  --text-body-sm: 0.875rem;
  --text-body-sm--lh: 1.55;
  --text-mono-md: 0.875rem;
  --text-mono-md--lh: 1.4;
  --text-mono-sm: 0.75rem;
  --text-mono-sm--lh: 1.4;
  --text-label: 0.6875rem;
  --text-label--lh: 1;
  --text-label--tracking: 0.08em;
}
```

### 1.3 Spacing, rotation pool, containers

```css
@theme {
  --container-prose: 680px;
  --container-default: 1200px;

  --rotate-tape-a: -2.5deg;
  --rotate-tape-b: -1.5deg;
  --rotate-tape-c: 1deg;
  --rotate-tape-d: 2deg;
}
```

The 4-value rotation pool (vs. PRD's 2-value `-1.5° / 2°`) gives long card grids more pleasant variety. `<TapedCardGrid>` (Phase 1) cycles through these via `nth-child(4n+1..4)`.

### 1.4 Shadows

```css
@theme {
  --shadow-paper-sm: 4px 4px 0 0 var(--color-ink);
  --shadow-paper-md: 6px 6px 0 0 var(--color-ink);
  --shadow-paper-lift: 8px 8px 0 0 var(--color-ink);
  --shadow-soft: 0 2px 8px rgba(0, 0, 0, 0.08);
}
```

### 1.5 Motion

```css
@theme {
  --motion-fast: 150ms ease-out;
  --motion-base: 240ms cubic-bezier(0.2, 0.8, 0.2, 1);
  --motion-tape: 300ms ease-out;
}
```

`<TapedCard>` (Phase 1) and any future hover-tilt component must wrap motion in `prefers-reduced-motion: no-preference` and gracefully fall back without rotation when the user prefers reduced motion.

### 1.6 Pattern tokens

```css
@theme {
  --pattern-jersey-stripes: repeating-linear-gradient(
    90deg,
    var(--color-jersey) 0 32px,
    var(--color-cream) 32px 64px
  );
  --pattern-jersey-stripes-tight: repeating-linear-gradient(
    90deg,
    var(--color-jersey) 0 14px,
    var(--color-cream) 14px 28px
  );
  --pattern-seam: repeating-linear-gradient(
    -45deg,
    var(--color-ink) 0 8px,
    var(--color-cream) 8px 16px
  );
}
```

---

## 2. Tier A primitives to ship

Each primitive lives at `apps/web/src/components/design-system/<Name>/` with the four standard files (`<Name>.tsx`, `<Name>.stories.tsx`, `<Name>.test.tsx`, `index.ts`) plus a barrel export from `apps/web/src/components/design-system/index.ts`. Storybook title: `UI/<Name>`. Tags: `["autodocs", "vr"]` from the first commit.

**Convention correction vs. external PRD:** the external PRD proposed `apps/web/src/components/foundations/` as the new home. We use `apps/web/src/components/design-system/` to match `apps/web/CLAUDE.md` rules. The `Foundation/` Storybook group is reserved for token MDX docs only — primitive stories live under `UI/<Name>`.

| Primitive                                              | Props                                                                                                                                | Notes                                                                                                                                                                                                             |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<TapeStrip>`                                          | `color: 'jersey' \| 'ink' \| 'cream'`, `position: 'tl' \| 'tr' \| 'bl' \| 'br'`, `length: 'sm' \| 'md' \| 'lg'`, `rotation?: number` | Inline SVG with subtle texture; `transform: rotate()`. Default `color="jersey"`, default `position="tl"`.                                                                                                         |
| `<StripedSeam>`                                        | `direction: 'horizontal' \| 'vertical'`, `height: 'sm' \| 'md' \| 'lg'`, `colorPair: 'ink-cream' \| 'jersey-cream'`                  | SVG element so caps render cleanly. Renders the `--pattern-seam` (or `--pattern-jersey-stripes` rotated -45°) inside the SVG path. **Never use negative margins** to fix seam alignment (saved owner preference). |
| `<DottedDivider>`, `<DashedDivider>`, `<SolidDivider>` | `color: 'ink' \| 'paper-edge'`, `inset?: boolean`                                                                                    | Single component file `Divider.tsx` with three named exports for ergonomics.                                                                                                                                      |
| `<QuoteMark>`                                          | `color: 'jersey' \| 'ink' \| 'cream'`                                                                                                | Pure SVG, ~20px square. Two stacked italic open-quote glyphs.                                                                                                                                                     |
| `<TicketStub>`                                         | `label: string`, `value: string`, `rotation?: number`, `position: 'overlay-tr' \| 'overlay-bl' \| 'inline'`                          | Mono content inside a perforated-edge SVG frame. `position="overlay-*"` uses `position: absolute`; `position="inline"` is a flow element.                                                                         |
| `<HighlighterStroke>`                                  | `variant: 'a' \| 'b' \| 'c'` (three hand-drawn SVGs), `color: 'jersey'`                                                              | Wraps children with span-per-line and absolute-positions an SVG underneath. Multi-line aware. SVG paths live in `apps/web/src/components/design-system/HighlighterStroke/strokes/` as inline modules.             |
| `<MonoLabel>`                                          | `variant: 'plain' \| 'pill-jersey' \| 'pill-ink' \| 'pill-cream'`, `size: 'sm' \| 'md'`                                              | Renders `--text-label` token. Pill variants: 4-6px padding, 2px radius. Children wrapped in `<span>` with uppercase + tracking.                                                                                   |

### Implementation notes

- **All primitives are server-component-safe** (no `"use client"` unless they truly need it — `<HighlighterStroke>` may need it if it measures line wraps client-side; investigate during implementation).
- **No `<TapedCard>` in this phase.** It is Tier B and depends on `<TapeStrip>`. Lands in Phase 1.
- **No `<MonoLabelRow>` in this phase.** Composition primitive, Phase 1.

---

## 3. Storybook deliverables

### 3.1 Foundation MDX (token docs)

Update or create:

- **`src/stories/foundation/Colors.mdx`** — add the 9 new colour tokens with swatches, hex values, and contrast notes against cream and ink. Sibling `Colors.stories.tsx` wraps the MDX with `tags: ["vr"]` (per existing pattern in `apps/web/CLAUDE.md`).
- **`src/stories/foundation/Typography.mdx`** — add the 7 new display/body/mono tokens, render Dutch sample text including diacritics (`ë`, `é`, `ï`) and italics. Show Freight Display italic + Quasimoda body together so the pairing is visible.
- **`src/stories/foundation/SpacingAndIcons.mdx`** — add the new container widths, rotation pool, and shadow tokens.
- **`src/stories/foundation/Patterns.mdx`** — _new file_. Render the three pattern tokens (`--pattern-jersey-stripes`, `--pattern-jersey-stripes-tight`, `--pattern-seam`) as full-width swatches with usage notes. Sibling `Patterns.stories.tsx` wraps it.

### 3.2 Primitive stories

One story file per primitive, all under `UI/<Name>`, all with `tags: ["autodocs", "vr"]`, all committing baselines in the same PR:

- `UI/TapeStrip` — Playground + every (color × position × length) combo.
- `UI/StripedSeam` — Playground + horizontal × 3 heights × 2 colour pairs.
- `UI/DottedDivider`, `UI/DashedDivider`, `UI/SolidDivider` — Playground + colour × inset matrix.
- `UI/QuoteMark` — Playground + each colour.
- `UI/TicketStub` — Playground + rotation samples + each position variant.
- `UI/HighlighterStroke` — Playground + all 3 variants + multi-line text demo.
- `UI/MonoLabel` — Playground + every variant × size combo + Dutch sample labels (`INTERVIEW`, `MATCHVERSLAG`, `JEUGD ⋅ U15`, `8 MIN`).

---

## 4. Adobe Typekit changes

Owner has already added Freight Display Pro + Freight Big Pro to the existing Typekit kit. **No new kit; no new env var; no preconnect changes.**

This phase removes:

- All Stenciletta weights from the Typekit kit configuration.
- (Optional, can defer to Phase 9) All Montserrat-related `next/font/google` references — but Phase 9 is the cleanup phase, so it is acceptable to leave Montserrat loaded until then.

What stays unchanged:

- Existing `<link rel="stylesheet" href={typekit-kit-url}>` in `apps/web/src/app/layout.tsx` — Freight rides the same kit.
- `IBM_Plex_Mono` `next/font/google` import — keeps `--font-ibm-plex-mono` exactly as-is.

---

## 5. Acceptance criteria

- [ ] All new tokens declared in `apps/web/src/app/globals.css` `@theme {}` block. Legacy tokens untouched.
- [ ] Storybook preview loads Freight Display Pro + Freight Big Pro from the existing Typekit kit. Verify by inspecting a Typography story — the display text must render Freight, not Georgia fallback.
- [ ] Body Quasimoda continues to load via Typekit with `display: swap`. No observable CLS on initial paint (manual smoke check, Lighthouse mobile run).
- [ ] Freight Display italic and Quasimoda italic both render correctly in a typography story showing inline `<em>` use (`Laatste <em>nieuws.</em>`).
- [ ] Fallback metrics validated: temporarily block `use.typekit.net` in devtools, verify Georgia fallback for Freight does not shift layout drastically.
- [ ] All seven Tier A primitives implemented under `apps/web/src/components/design-system/<Name>/`.
- [ ] Every primitive has a Storybook story under `UI/<Name>` with `tags: ["autodocs", "vr"]` and all documented variants.
- [ ] All token combinations used in mockups have documented contrast ratios in `Foundation/Colors.mdx`. Failing combos (e.g. `jersey on cream` for body text) flagged with usage warning.
- [ ] Existing components still build and render with no regressions. Concretely:
  - `pnpm --filter @kcvv/web check-all` passes.
  - `pnpm --filter @kcvv/web run vr:check` shows no diffs against committed baselines for any _existing_ story (only **new** baselines are added in this PR).
- [ ] PR body includes a `## VR baselines` section enumerating all new baselines as first-time captures (acceptable per the VR contract).
- [ ] `apps/web/CLAUDE.md` updated:
  - Note that `Foundation/Patterns` MDX exists.
  - Note the new primitives in the design-system list.
- [ ] Master design doc (`docs/plans/2026-04-27-redesign-master-design.md`) referenced from this PRD's frontmatter and from the PR description.

---

## 6. Out of scope

- Refactoring any existing component to use new tokens. Components keep their legacy tokens until their own phase lands.
- Building Tier B (`<TapedCard>`, `<TapedCardGrid>`, `<MonoLabelRow>`, `<EditorialHeading>`, `<PullQuote>`, `<NumberDisplay>`, `<DropCapParagraph>`) or Tier C (`<PlayerFigure>`, `<JerseyShirt>`, `<EndMark>`, `<QASectionDivider>`) primitives.
- Building atoms or molecules (`<Button>` rework, `<Badge>` retirement, `<SectionHeader>` rebuild) — Phase 1–2.
- Page composition / route changes.
- Animation / motion design beyond what's needed for primitive hover states.
- Removing legacy tokens — Phase 9 only.
- Removing Montserrat from `next/font/google` — Phase 9 (acceptable).

---

## 7. Open questions to resolve in implementation

1. **`<HighlighterStroke>` client-vs-server.** If multi-line measurement is needed, the component must be `"use client"`. Investigate during implementation: can we get away with a CSS-only solution using `box-decoration-break: clone` and a background-image SVG? If yes, server-component-safe. If no, document the client-component reason inline.
2. **`<TicketStub>` perforation rendering.** Are dotted edges drawn as `<circle>` elements punched into a `<rect>` (SVG mask), or as a CSS `radial-gradient` on a div? SVG mask gives crisper edges at large sizes; CSS gives easier theming. Pick during implementation, document choice in the component file's top comment if non-obvious.
3. **Drop-cap accessibility.** Phase 0 doesn't ship `<DropCapParagraph>`, but the typography MDX should include a sample so we're not surprised in Phase 1. Decide: `aria-hidden` decorative + repeat letter inside the paragraph, or rely on browser handling.
4. **Adobe Typekit kit max payload.** With Stenciletta removed and Freight added (7 files), confirm total kit payload is acceptable on mobile — measure during implementation, record the kit size in the PR description.

---

## 8. References

- `docs/plans/2026-04-27-redesign-master-design.md` — master design doc (sections 2 and 3 are the source for the audit and tokens defined here).
- Visual source: owner-uploaded screenshots from a Claude Design "retro-terrace fanzine" exploration (in owner's local Downloads at session time; commit to `docs/design/mockups/retro-terrace-fanzine/` during Phase 0 if desired). The pre-existing `docs/design/directions/01-editorial-magazine.md` is **not** related to this redesign — it's leftover from an earlier article-detail-only brainstorm and uses a different visual vocabulary.
- `docs/prd/visual-regression-testing.md` — VR contract; see §12 Phase 3 for which `Features/*` files require baselines (none in this phase).
- `apps/web/CLAUDE.md` — Storybook navigation and design-system folder rules.

---

_End of Phase 0 PRD._
