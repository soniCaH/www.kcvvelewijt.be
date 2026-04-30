# Redesign — Phase 2: Atom rework + Phosphor Fill icon swap

> **Master design reference:** `docs/plans/2026-04-27-redesign-master-design.md`
> **Tracking issue:** [#1524](https://github.com/soniCaH/www.kcvvelewijt.be/issues/1524)
> **Implementation plan:** `docs/plans/2026-04-30-redesign-phase-2-plan.md` _(to be authored)_
> **Milestone:** `redesign-retro-terrace-fanzine`
> **Epic:** KCVV Elewijt redesign — retro-terrace fanzine aesthetic
> **Predecessor:** [#1523](https://github.com/soniCaH/www.kcvvelewijt.be/issues/1523) — Phase 1 (merged)
> **Blocks:** Phase 3 (Tier C figures + EditorialHero variants, [#1525](https://github.com/soniCaH/www.kcvvelewijt.be/issues/1525)) and every later phase
> **Owner:** _you_
> **Estimate:** ~2 weeks (1 week design exploration + 1 week implementation, possibly parallelised)

---

## 1. Problem statement

Phase 1 shipped Tier B composition primitives but left the existing **atoms** (`<Button>`, `<Input>`, `<Select>`, `<Textarea>`, `<Label>`, `<Alert>`, `<Spinner>`, `<BrandedTabs>`, `<FilterTabs>`, `<HorizontalSlider>`/`<ScrollHint>`) on the legacy bright-green-pill aesthetic. Every Phase 3+ surface that ships will mix new editorial primitives (TapedCard, EditorialHeading, MonoLabel) against legacy-styled form chrome and bright-green action pills — visual incoherence on the page, aesthetic fork in the design system. Phase 2 closes the fork by reskinning every atom to the cream/ink/jersey vocabulary and swapping the iconography from Lucide to Phosphor Fill on redesign surfaces (per master design decision-log entry 17).

Without Phase 2, no Phase 3+ page can ship visually coherent.

---

## 2. Scope

**Packages touched:** `apps/web` only.

**In scope:**

- Atom reskins: `<Button>`, `<Input>`, `<Select>`, `<Textarea>`, `<Label>`, `<Alert>`, `<Spinner>`, `<BrandedTabs>`, `<FilterTabs>`, `<HorizontalSlider>`, `<ScrollHint>`.
- New primitive `<EditorialLink>` extracted from the bespoke SectionHeader CTA JSX.
- Phosphor Fill icon library installed; new `apps/web/src/lib/icons.redesign.ts` shim.
- New retro semantic tokens (`--color-alert`, `--color-warning`, `-soft` variants).
- New `pnpm vr:update:story <pattern>` script for targeted baseline updates.

**Explicitly OUT of scope:**

- **Container-level paper aesthetic** (modals, dropdowns, popovers, toasts adopting cream/tape/rotation). Defers to Phase 6/8 per master design Open Q7.
- **Legacy component reskins** (cards, tables, widgets that are not in the atom catalogue). Each gets reskinned in its own phase per dual-coexistence rule.
- **Lucide retirement from non-redesign surfaces.** `apps/web/src/lib/icons.ts` (Lucide) stays in place; only redesign-surface consumers swap to `icons.redesign.ts` (Phosphor Fill).
- **New tokens beyond semantic** — no new spacing, no new motion, no new typography tokens. The cream/ink/jersey palette and shadow vocabulary already exist from Phase 0.
- **API or data-layer changes.** Pure presentational refactor.

---

## 3. Tracer bullet

The thinnest cross-layer slice that proves the Phase 2 architecture works:

> **Land `pnpm vr:update:story <pattern>` + `--color-alert`/`--color-warning` tokens + `<Button variant="primary">` reskinned + Phosphor `ArrowRight` wrapper exported from `icons.redesign.ts`.**
>
> Demonstrated by: a new `Button.stories.tsx` `PrimaryRedesigned` story shows jersey-on-cream Button rendering with Phosphor-fill `ArrowRight` consumed via `icons.redesign.ts`, with VR baseline captured _only_ for the changed story (proving the per-story update workflow), and `pnpm --filter @kcvv/web check-all` green.

If the tracer bullet fails, every other Phase 2 sub-task is at risk; if it passes, Track A and Track B can fan out.

---

## 4. Phases

Phase 2 is a single redesign-phase but splits into two parallel tracks at the issue level after the tracer bullet lands.

```text
Phase 2.0 — Tracer bullet (tokens + vr:update:story + Button.primary + Phosphor wrapper)  → #1568
   ↓
   ├──── Track A — pure token swaps (no design checkpoint required)
   │       2.A.1  EditorialLink primitive + SectionHeader refactor                         → #1574
   │       2.A.2  Phosphor migration completion (all wrappers exported)                    → #1569
   │       2.A.3  Button rework completion (inverted, secondary, ghost; retire link)       → #1570
   │       2.A.4  Form atoms reskin (Input, Select, Textarea, Label)                       → #1571
   │       2.A.5  Alert reskin (drop info; success/warning/error)                          → #1572
   │       2.A.6  Remove FilterTab.icon prop entirely (no leading glyphs)                 → #1573
   │
   └──── Track B — design checkpoint via /design-an-interface (cohesive across atoms, per-atom variation)
           2.B.1  Spinner — design + reskin                                                → #1575
           2.B.2  BrandedTabs — design + reskin                                            → #1576
           2.B.3  FilterTabs — design + reskin                                             → #1577
           2.B.4  HorizontalSlider + ScrollHint arrows — design + reskin                   → #1578
```

**Sequencing rule:** Track B does design exploration _first_ (no implementation PR until each atom's design is approved). Track A and Track B implementation can then run in parallel — Ralph picks whichever child issue is unblocked.

---

## 5. Acceptance criteria per phase

### 5.0 Tracer bullet (Phase 2.0)

- [ ] `apps/web/package.json` contains `vr:update:story` script that invokes `test-storybook -u` and forwards trailing arguments to the test-runner. Invoke as `pnpm vr:update:story -- --testPathPatterns=<regex>` so the explicit Jest flag (plural — `--testPathPattern` was deprecated) reaches Jest via test-storybook's pass-through. The regex matches synthetic test file paths derived from story IDs (e.g. `ui-button`), not source `.stories.tsx` paths.
- [ ] `apps/web/src/styles/globals.css` `@theme` block contains `--color-alert: #B84A3A`, `--color-warning: #C68B2C`, `--color-alert-soft: #E8D5CF`, `--color-warning-soft: #ECDDB8`
- [ ] `@phosphor-icons/react` installed in `apps/web/package.json`
- [ ] `apps/web/src/lib/icons.redesign.ts` exists and exports at least `ArrowRight` as a `weight="fill"` wrapper component
- [ ] `<Button variant="primary">` renders `bg-jersey text-cream` with the documented hover/focus treatment
- [ ] `Button.stories.tsx` `PrimaryRedesigned` story exists with `tags: ["autodocs", "vr"]` and a captured VR baseline
- [ ] `pnpm vr:update:story -- --testPathPatterns=ui-button` (or any `testPathPatterns` regex anchored to the Button atom's story-ID prefix) updates only Button-story baselines (verified by counting changed PNG files)
- [ ] `pnpm --filter @kcvv/web check-all` passes

### 5.A Track A acceptance (per child issue, summarised here)

- [ ] **2.A.1 EditorialLink:** `apps/web/src/components/design-system/EditorialLink/` exists with `EditorialLink.tsx`, `EditorialLink.stories.tsx`, `EditorialLink.test.tsx`, `index.ts`. `SectionHeader.tsx` no longer holds bespoke highlighter-mask JSX; it renders `<EditorialLink variant="cta">`. The `TODO(phase-4): consolidate with <HighlighterStroke>` comment is removed.
- [ ] **2.A.2 Phosphor migration:** Every Phase 2 atom that previously imported from `@/lib/icons` now imports from `@/lib/icons.redesign`. Wrapper components default `weight="fill"` and accept `size`, `className`, `aria-hidden` pass-through.
- [ ] **2.A.3 Button:** `ButtonVariant` type is `"primary" | "inverted" | "secondary" | "ghost"` (no `link`). `withArrow` renders typographic `→` glyph (`<span aria-hidden>→</span>`), not a Phosphor icon. Focus ring uses `ring-jersey-deep`. Disabled stays `opacity-50 cursor-not-allowed`. Zero non-test consumers of the removed `link` variant (verified by grep at PR time).
- [ ] **2.A.4 Form atoms:** Input / Select / Textarea uniformly implement the locked Direction C state machine (`bg-white` + 2px ink-weighted border + `--shadow-paper-sm-soft` resting shadow + paper-press idiom on hover/focus + `--shadow-paper-sm-alert` on error). No jersey-deep on the field anywhere — focus signals via `border-ink` + shadow snap + `translate(2px, 2px)`. Filled state anchors at `border-ink/60`. Sharp corners (`rounded-[0.25em]` removed — see AC override note in §6.3). New `<FieldError>` and `<TextareaCounter>` primitives extracted. Phosphor `CaretDown` replaces Lucide on Select. `kcvv-alert` no longer referenced from these four files. See `docs/design/mockups/phase-2-a-4-form-atoms/compare.md` (locked spec) and `option-c-locked.html` (canonical visual).
- [ ] **2.A.5 Alert:** `AlertVariant` type is `"success" | "warning" | "error"` (no `info`). Each variant matches the colour map in §6.5. Dismiss button renders Phosphor Fill `X`.
- [ ] **2.A.6 FilterTab.icon removal:** `FilterTab.icon` field removed from the `FilterTab` interface; the `<FilterTabs>` rendering path no longer accepts or renders any leading icon. Locked at the Track B design checkpoint (2026-04-30) — supersedes the original Lucide → Phosphor type-swap plan. Acceptance: zero non-test references to `FilterTab.icon` after the PR; consumers that previously passed an `icon` stop doing so; type-check passes.

### 5.B Track B acceptance (per child issue)

Each Track B child issue has two phases internally:

1. **Design phase** (`/design-an-interface` produces mockups + decision; owner approves before implementation begins).
2. **Implementation phase** — the atom reskinned per approved design; story + VR baseline captured; `check-all` green.

Per atom:

- [ ] **2.B.1 Spinner:** Approved design (scarf barber-pole + compact three-dot pulse, per locked design checkpoint). Reskinned. `SpinnerVariant` becomes `"primary" | "secondary" | "white" | "compact"` — the `"white"` member is **retained** (it's the dark-interlude palette flip; no rename). `"logo"` is **removed**. Story + baseline.
- [ ] **2.B.2 BrandedTabs:** Approved design. Bottom-border tabs reinterpreted in retro vocabulary. Token swap (`kcvv-green-bright` → `jersey-deep`, etc.). Story + baseline.
- [ ] **2.B.3 FilterTabs:** Approved design. Pill toggle group reinterpreted. Story + baseline.
- [ ] **2.B.4 HorizontalSlider + ScrollHint arrows:** Approved design (per locked design checkpoint). Arrow buttons reskinned as a single canonical 48 × 48 paper button with typographic `←` / `→` in Freight Display italic — **no Phosphor `CaretLeft` / `CaretRight` consumed; the typographic glyph is hardcoded** per the "typographic glyphs over Lucide where the glyph reads" preference. `ScrollArrowButtonProps.variant` removed. HorizontalSlider match-card layout shipped per `docs/design/mockups/phase-2-track-b/option-d-paper-chrome-ink-emphasis.html`. Story + baseline.

### Cross-cutting acceptance

- [ ] Every PR lists the stories whose VR baselines were updated in the PR description (auditable per VR contract).
- [ ] No PR uses full `pnpm vr:update` unless a token file change demonstrably touches every story (justified inline).
- [ ] `apps/web/CLAUDE.md` Phase 2 section updated to reflect:
      (a) which atoms are on the redesign vocabulary,
      (b) the dual `icons.ts` / `icons.redesign.ts` rule,
      (c) `<EditorialLink>` as the canonical link primitive.
- [ ] Master design `docs/plans/2026-04-27-redesign-master-design.md` Open Q7 status note updated to "deferred to Phase 6/8 per Phase 2 PRD".

---

## 6. Atom catalogue

### 6.1 `<Button>` — 4 variants

| Variant     | Surface         | Border                | Text         | Shadow                                  | Hover                                                              |
| ----------- | --------------- | --------------------- | ------------ | --------------------------------------- | ------------------------------------------------------------------ |
| `primary`   | `bg-jersey`     | none                  | `text-cream` | —                                       | brightens / depth subtle                                           |
| `inverted`  | `bg-cream`      | none                  | `text-ink`   | —                                       | subtle ink shift                                                   |
| `secondary` | `bg-cream-soft` | `border-2 border-ink` | `text-ink`   | `shadow-[4px_4px_0_0_var(--color-ink)]` | shadow collapses + `translate-x-1 translate-y-1` (TapedCard press) |
| `ghost`     | transparent     | `border-2 border-ink` | `text-ink`   | —                                       | `bg-ink/5` fill                                                    |

**Removed:** `variant="link"` (zero non-test consumers; the link visual lives in `<EditorialLink>` instead).

**Other Button changes:**

- `withArrow` renders `<span aria-hidden>→</span>` with `group-hover:translate-x-1` (typographic glyph, not Phosphor icon).
- Focus ring: `focus-visible:ring-jersey-deep focus-visible:ring-offset-2`.
- Disabled: `opacity-50 cursor-not-allowed` (unchanged).
- Sizes (sm/md/lg) and `fullWidth` prop preserved.

### 6.2 `<EditorialLink>` (new primitive)

Path: `apps/web/src/components/design-system/EditorialLink/`

```typescript
type EditorialLinkVariant = "cta" | "inline";
type EditorialLinkTone = "light" | "dark";

interface EditorialLinkProps {
  href: string;
  children: React.ReactNode;
  variant?: EditorialLinkVariant; // default: "inline"
  tone?: EditorialLinkTone; // default: "light"
  withArrow?: boolean; // default: true if cta, false if inline
  className?: string;
}
```

**Visual contract:**

- `cta`: `font-mono uppercase text-[length:var(--text-label)] tracking-[var(--text-label--tracking)]`. Animated `<HighlighterStroke>`-style mask sweeps left-to-right beneath the label on hover (`scale-x-0` → `scale-x-100`). Optional trailing `→` glyph with `group-hover:translate-x-1`.
- `inline`: `font-medium` body weight. Same highlighter sweep on hover. No arrow by default.
- `tone="light"` (default): `text-jersey-deep`, sweep colour `bg-jersey-deep`.
- `tone="dark"`: `text-cream/85`, sweep colour `bg-jersey/65`.

**Refactor target:** `apps/web/src/components/design-system/SectionHeader/SectionHeader.tsx` currently inlines the highlighter mask (`HIGHLIGHTER_MASK_DATA_URL` constant + JSX). Replace with `<EditorialLink variant="cta" tone={...}>`. Delete the local mask constant. Remove the `TODO(phase-4)` comment.

**Mask geometry:** shared with `<HighlighterStroke>` via `STROKE_PATH` import (already done in SectionHeader). EditorialLink consumes the same constant.

### 6.3 Form atoms — `<Input>`, `<Select>`, `<Textarea>`, `<Label>`

The Phase 2.A.4 form-atom design checkpoint completed 2026-04-30. Owner picked **Direction C — "Paper-card emphasis"**, with two revisions on top of the original three-way exploration: (a) no jersey-deep on the field anywhere (Track B reserves jersey for content, not chrome; jersey-on-focus also reads as false-positive validation), (b) filled-state anchor locked at `border-ink/60`.

**Source-of-record:**

- Canonical visual: `docs/design/mockups/phase-2-a-4-form-atoms/option-c-locked.html`.
- Locked specification, resolved sign-off questions, and historical exploration: `docs/design/mockups/phase-2-a-4-form-atoms/compare.md`.
- Three-way historical exploration: `docs/design/mockups/phase-2-a-4-form-atoms/compare.html`.

**AC override — sharp corners.** Issue [#1571](https://github.com/soniCaH/www.kcvvelewijt.be/issues/1571) AC text says "Border radius `rounded-[0.25em]` unchanged". This PRD **overrides that AC** — form atoms ship with no border-radius, aligning with the Track B chrome lockdown ("Sharp corners everywhere — no `border-radius`" — `phase-2-track-b/compare.md` §Decision). Implementation PR description must call this out explicitly under "AC overrides".

**Master-design Open Q7** (paper aesthetic on chrome) is now resolved for Phase 2: paper-card vocabulary applies. Q7 deferral to Phase 6/8 stands only for non-form chrome surfaces.

#### Field state machine — uniform across `<Input>`, `<Select>`, `<Textarea>`

| State          | Border             | Shadow                                     | Transform             | Surface                                              |
| -------------- | ------------------ | ------------------------------------------ | --------------------- | ---------------------------------------------------- |
| Default        | `2px ink/30`       | `--shadow-paper-sm-soft` (4×4 ink-muted)   | —                     | `bg-white`                                           |
| Hover          | `2px ink/40`       | `3×3 ink-muted`                            | `translate(1px, 1px)` | `bg-white`                                           |
| Focus          | `2px ink` _(full)_ | `0 0 0 0`                                  | `translate(2px, 2px)` | `bg-white`                                           |
| Filled         | `2px ink/60`       | `--shadow-paper-sm-soft`                   | —                     | `bg-white`                                           |
| Filled + focus | `2px ink`          | `0 0 0 0`                                  | `translate(2px, 2px)` | `bg-white`                                           |
| Error          | `2px alert`        | `--shadow-paper-sm-alert` (4×4 alert-soft) | —                     | `bg-white`                                           |
| Error + focus  | `2px alert`        | `0 0 0 0`                                  | `translate(2px, 2px)` | `bg-white`                                           |
| Disabled       | `2px ink/15`       | `none`                                     | —                     | `bg-cream-soft` (`opacity-50`, `cursor-not-allowed`) |

**Where jersey-deep no longer appears:** the field itself. Jersey returns only on the `<EditorialHeading>` period dot (decoration), the submit-button paper-shadow offset (content CTA), and tape stamps (content moment).

#### New token

```css
/* Append to the existing @theme block in apps/web/src/styles/globals.css */
--shadow-paper-sm-alert: 4px 4px 0 0 var(--color-alert-soft);
```

Mirrors the `--shadow-paper-sm-soft` pattern locked in Track B. Used exclusively where `--color-alert` border is present. Add a swatch + token reference in `Foundation/Colors` MDX.

#### Token swaps (per atom)

```text
text-kcvv-gray-dark                                            → text-ink
placeholder:text-foundation-gray-dark                          → placeholder:text-ink/40
border-foundation-gray                                         → border-ink/30 (1px → 2px)
focus:border-kcvv-green-bright focus:ring-kcvv-green-bright/20 → state machine above (no ring, no jersey)
border-kcvv-alert                                              → border-alert (+ shadow-paper-sm-alert)
disabled:bg-foundation-gray-light                              → disabled:bg-cream-soft
rounded-[0.25em]                                               → (removed — sharp corners; AC override)
```

#### `<Label>`

- `text-ink font-semibold`.
- Required asterisk: `text-alert`.
- Optional pill: mono caps "OPTIONEEL", `border border-ink/30 px-1.5 py-0.5 text-[10px] tracking-wide` (no `border-radius`).
- Sizes sm/md/lg unchanged.

#### `<Select>` — Phosphor caret

Import `CaretDown` from `@/lib/icons.redesign` (Phosphor Fill); drop the Lucide `ChevronDown`. Chevron stays absolutely positioned inside the same `relative` wrapper so it follows the field through hover/focus translates.

**Open-menu state** (image 2 mockup — inverted active option `bg-ink text-cream` + jersey-deep dot) is **not implementable on a native `<select>`**. Deferred to a future combobox issue (Phase 5 forms-tier work). Native `<select>` keeps the OS-rendered dropdown.

#### New primitives — `<FieldError>` and `<TextareaCounter>`

Both extracted into `apps/web/src/components/design-system/` with their own stories (`tags: ["autodocs", "vr"]`).

- **`<FieldError>`** — paper-pill error indicator + italic alert message. Renders `<span class="paper-pill paper-pill--alert"><WarningCircle weight="fill" /> FOUT</span>` followed by an inline italic Freight Display alert message. Single source of truth across Input / Select / Textarea, consumed via each atom's existing `error?: string` prop. Pill body: `bg-alert text-white border-[1.5px] border-ink shadow-[3px_3px_0_0_var(--color-ink)]` (ink shadow — never jersey on chrome).
- **`<TextareaCounter>`** — `current/max` mono digits in the bottom-right corner of `<Textarea>`. Color shifts to `text-alert` when `current > max`. Wired into `<Textarea>` via the existing `maxLength` prop (no new public surface).

#### Sizes

Heights locked at sm 32 / md 40 / lg 48 (px). Padding scales with the existing `sm/md/lg` ladder. Sizes ladder unchanged from current implementation; only borders, shadows, and transforms change.

#### Implementation order (per the standard Phase 2 atom-reskin workflow)

1. Append `--shadow-paper-sm-alert` to the `@theme` block in `apps/web/src/styles/globals.css`. Add MDX entry in `Foundation/Colors`.
2. Reskin `Input.tsx`, `Select.tsx`, `Textarea.tsx`, `Label.tsx` per the spec above.
3. Create `<FieldError>` and `<TextareaCounter>` primitives with their own stories + tests.
4. Update Storybook stories for all four atoms covering every state in the table above (default, hover, focus, filled, filled+focus, error, error+focus, disabled), plus sm/md/lg, optional-pill, hint, kicker.
5. `pnpm vr:update:story "Input|Select|Textarea|Label|FieldError|TextareaCounter"` captures baselines.
6. PR description lists every story whose baseline was updated, plus an explicit **AC overrides** section calling out the sharp-corners override.
7. `pnpm --filter @kcvv/web check-all` passes.

### 6.4 `<Alert>` — 3 variants (info dropped)

| Variant   | Surface           | Left accent                     | Icon                                                       | Text       |
| --------- | ----------------- | ------------------------------- | ---------------------------------------------------------- | ---------- |
| `success` | `bg-jersey/10`    | `border-l-4 border-jersey-deep` | `CheckCircle` (Phosphor Fill, `text-jersey-deep`)          | `text-ink` |
| `warning` | `bg-warning-soft` | `border-l-4 border-warning`     | `Warning` (Phosphor Fill, `text-warning`)                  | `text-ink` |
| `error`   | `bg-alert-soft`   | `border-l-4 border-alert`       | `WarningCircle` or `XCircle` (Phosphor Fill, `text-alert`) | `text-ink` |

- Dismiss button: Phosphor Fill `X` icon, `text-ink/60 hover:text-ink`.
- `info` variant removed entirely. Any consumer using it migrates to `success` (the closest visual semantic).
- Verify zero `<Alert variant="info">` consumers at PR time; if any exist, migrate them in the same PR.

### 6.5 Track B atoms — locked design contract

The Track B design checkpoint completed 2026-04-30. Owner picked **Direction D — "Paper chrome, ink emphasis"**, a synthesis derived from feedback on three exploratory directions (A — Paper &amp; Tape, B — Mono &amp; Ink, C — Matchday Programme).

**Source-of-record:**

- Canonical visual: `docs/design/mockups/phase-2-track-b/option-d-paper-chrome-ink-emphasis.html`.
- Per-atom locked specifications, historical exploration trail, and provisional caveats: `docs/design/mockups/phase-2-track-b/compare.md`.

**Locked atom contracts (summary; see compare.md for full detail):**

- **`<Spinner>`** — primary motif: scarf barber-pole (diagonal jersey/cream/ink stripes scrolling at 90° via a rotated `::before` for seam-free integer-pixel translation). Variants: `primary` (full brand stripes), `secondary` (no jersey, ink/cream/ink-muted only), `white` (palette flip on dark interlude bg, with `paper-edge` border + `--shadow-paper-sm-soft`), `compact` (three jersey-deep dots pulsing in sequence, inline). Sizes sm/md/lg/xl: 96 × 16 / 180 × 28 / 240 × 36 / 360 × 56. **`variant="logo"` retired** — `SpinnerVariant` becomes `"primary" | "secondary" | "white" | "compact"`.
- **`<BrandedTabs>`** — paper-card vocabulary at tab scale: `border-2 ink` + `shadow-paper-sm` + `bg-cream`, mono caps, sharp corners, no rotation, no tape. Active: `bg-ink text-cream` + `--shadow-paper-sm-soft` (so the ink tab body and shadow remain distinguishable). Hover: shadow → 3 × 3 + `translate(1px, 1px)`. Prop surface unchanged.
- **`<FilterTabs>`** — paper-chip vocabulary: `border-2 ink` + `shadow-paper-sm` + `bg-cream-soft`, mono caps, sharp corners. Active: `bg-ink text-cream` + `--shadow-paper-sm-soft` (matches BrandedTabs). Count rendered inline after a 1 px ink-muted hairline pipe — no pill, no badge. Sizes sm/md/lg differ in padding + font-size only. **`FilterTab.icon` prop dropped entirely** — closes #1573 with no UI work (the type swap becomes a removal). `renderAsLinks?`, `showCounts?`, `size`, `tabs`, `activeTab`, `onChange?`, `ariaLabel?`, `className?` retained.
- **`<HorizontalSlider>` + `<ScrollHint>` arrows.** Arrow: single canonical 48 × 48 paper button (`border-2 ink` + `shadow-paper-sm` + `bg-cream` + italic Freight Display `←` / `→` glyph). On `panel--dusk`, shadow swaps to `--shadow-paper-sm-soft` via descendant rule. **`ScrollArrowButtonProps.variant` dropped** — `{ direction, onClick, className? }` is the full surface. Slider match-card structure (top-to-bottom): mono kicker · teams (KCVV always italic Freight Display + jersey-deep, opponent in body sans) · big mono score · venue + CTA. Sub-degree rotation per `nth-child(4n+1..4)` matching `<TapedCardGrid>`. **No live-card surface variant** — all cards equally treated; live status signalled only via kicker text (`★ LIVE` in alert-red) and score field. `theme: "light" | "dark"` retained (homepage `MatchesSliderSection` consumes dark); dark theme keeps the same paper cards on an ink panel + soft shadow via descendant rule. No green borders, no green shadows.

**Provisional caveats** (from compare.md):

- Owner sign-off was conditional ("not 200% convinced, but let's go with it for now"). The dark-shadow `--shadow-paper-sm-soft` decision and the slider's "all cards equally treated" rule are the two areas most likely to need refinement during implementation. If issues #1575–#1578 surface real-use friction, the per-issue PRDs may revise — this checkpoint is the source-of-record, not a hard freeze.

### 6.6 Phosphor migration — `apps/web/src/lib/icons.redesign.ts`

```typescript
// apps/web/src/lib/icons.redesign.ts
import {
  ArrowRight as PhArrowRight,
  CaretDown as PhCaretDown,
  CaretLeft as PhCaretLeft,
  CaretRight as PhCaretRight,
  CheckCircle as PhCheckCircle,
  Warning as PhWarning,
  WarningCircle as PhWarningCircle,
  X as PhX,
  type IconProps,
} from "@phosphor-icons/react";

const fillWrapper = (Icon: React.ComponentType<IconProps>) =>
  (props: Omit<IconProps, "weight">) => <Icon weight="fill" {...props} />;

export const ArrowRight = fillWrapper(PhArrowRight);
export const CaretDown = fillWrapper(PhCaretDown);
export const CaretLeft = fillWrapper(PhCaretLeft);
export const CaretRight = fillWrapper(PhCaretRight);
export const CheckCircle = fillWrapper(PhCheckCircle);
export const Warning = fillWrapper(PhWarning);
export const WarningCircle = fillWrapper(PhWarningCircle);
export const X = fillWrapper(PhX);

// Re-export Icon type for FilterTabs prop typing
export type { Icon } from "@phosphor-icons/react";
```

**Why wrapper functions, not raw re-exports:** prevents downstream consumers from accidentally passing `weight="regular"` or `weight="thin"` and silently breaking the visual contract. The wrapper omits `weight` from the public prop type.

**Dual-coexistence:** `apps/web/src/lib/icons.ts` (Lucide) stays untouched. Legacy components keep importing from there. Phase 2 atoms switch to `icons.redesign.ts`.

### 6.7 New tokens — `apps/web/src/styles/globals.css`

Append to the existing `@theme` block alongside other redesign tokens (cream/ink/jersey):

```css
/* Retro semantic palette — replaces digital kcvv-warning / kcvv-alert
   on redesign surfaces. Tones tuned for fanzine print feel:
   alert = dusty brick red, warning = aged mustard ochre. */
--color-alert: #b84a3a;
--color-alert-soft: #e8d5cf;
--color-warning: #c68b2c;
--color-warning-soft: #ecddb8;

/* Soft offset-shadow sibling — used wherever the standard --shadow-paper-sm
   (ink) would vanish: ink-bg active states (BrandedTab + FilterTab) and any
   chrome surface on a dark / ink panel (arrows, match cards, white-variant
   scarf spinner). Ink-muted (#6b6b6b) gives the offset visible depth without
   adding a third primary shadow weight. */
--shadow-paper-sm-soft: 4px 4px 0 0 var(--color-ink-muted);

/* Alert offset-shadow sibling — used exclusively on form fields in the
   error state (Input / Select / Textarea), where the resting --shadow-paper-sm-soft
   would lose semantic distinction. Pairs with a 2px alert border. Alert-soft
   (#e8d5cf) keeps the offset visible without competing with the alert border
   itself. See §6.3. */
--shadow-paper-sm-alert: 4px 4px 0 0 var(--color-alert-soft);
```

`--color-success` is not added — `--color-jersey-deep` covers success semantics.

Legacy `--color-kcvv-warning` and `--color-kcvv-alert` stay defined; legacy components keep using them until their own phase.

### 6.8 New script — `apps/web/package.json`

```json
"vr:update:story": "pnpm run vr:build-storybook && docker compose -f docker-compose.vr.yml run --rm vr -u"
```

Invocation: `pnpm vr:update:story -- --testPathPatterns=ui-button` — only updates baselines for stories whose synthetic test path matches the regex. The `--` separator hands the trailing arguments to test-storybook, which forwards `--testPathPatterns=<regex>` to Jest (the flag is plural in current Jest; the singular `--testPathPattern` is deprecated). The regex matches the synthetic test file paths derived from story IDs (e.g. `ui-button`, `layout-pagefooter`), not the source `.stories.tsx` file paths. Use a tight anchor like `ui-button` to scope to a single atom without dragging in `ui-linkbutton`/`ui-downloadbutton`/etc. Pattern is a Jest-compatible regex string.

---

## 7. Effect Schema / api-contract changes

**None.** Phase 2 is presentational. No API endpoints added, no schemas changed.

---

## 8. Visual regression baseline strategy

VR baselines are committed in the same PR as the atom that invalidates them. For each atom PR:

1. Run `pnpm vr:update:story -- --testPathPatterns=<regex>` locally (e.g. `pnpm vr:update:story -- --testPathPatterns=ui-button`) to capture only the changed atom's baselines. The regex is a Jest-compatible `testPathPatterns` value; anchor it tightly to the atom's story-ID prefix (which is what the synthetic test paths use, not source paths). First-degree consumer stories whose visuals change because they import the redesigned atom should be opted out via `parameters.vr.disable: true` per `apps/web/CLAUDE.md` → _Atom reskin PRs_, with the consumer's redesign issue as the re-evaluate date — not auto-baselined here.
2. Inspect the produced baselines manually — the atom should look correct in light + dark, sm + md + lg, default + hover/focus/disabled per its story matrix.
3. Stage and commit the new/updated baseline PNGs in the same commit as the component change.
4. PR description includes a "## VR baselines" section listing every story file whose baseline changed (justifies the update per the VR contract).

Full `pnpm vr:update` (~25–41 minutes) runs only when a token file change demonstrably affects every story (e.g., a global font change). Phase 2's token additions are scoped — no Phase 2 PR should need a full update.

---

## 9. Open questions

These are NOT blockers for writing the PRD. Each one is genuinely unknown right now and will be resolved at the indicated point:

- [x] **Spinner direction.** ✅ Resolved 2026-04-30 — scarf barber-pole + compact three-dot pulse. See `docs/design/mockups/phase-2-track-b/compare.md`.
- [x] **BrandedTabs pattern survival.** ✅ Resolved 2026-04-30 — paper-card body, ink-invert active, no tape, no rotation. See compare.md.
- [x] **FilterTabs pattern survival.** ✅ Resolved 2026-04-30 — paper-chip body, ink-invert active, hairline pipe count. See compare.md.
- [x] **Arrow button shape.** ✅ Resolved 2026-04-30 — single canonical 48 × 48 paper button, italic Freight Display `←` / `→`. See compare.md.
- [ ] **`<Alert variant="info">` migration.** Are there existing consumers? If yes, do they all map cleanly to `success`, or do some need a different variant? → resolved by grep at PR time for #2.A.5
- [x] **Phosphor `Spinner` compatibility.** ✅ Resolved 2026-04-30 — not used. The barber-pole motif replaces the SVG spinner entirely. Phosphor `Spinner` icon was never adopted.
- [x] **Form-atom direction.** ✅ Resolved 2026-04-30 — Direction C (paper-card emphasis) with two revisions: no jersey-deep on the field, filled anchor at `border-ink/60`. See `docs/design/mockups/phase-2-a-4-form-atoms/compare.md`.
- [x] **Form-atom sharp corners override.** ✅ Resolved 2026-04-30 — owner confirmed dropping `rounded-[0.25em]` from issue #1571 AC. PR description must call out the AC override.
- [x] **Form-atom filled-state anchor.** ✅ Resolved 2026-04-30 — `border-ink/60` (three ink weights signal fill progression: ink/30 idle → ink/60 filled → ink full focused).
- [x] **Form-atom textarea counter.** ✅ Resolved 2026-04-30 — in scope for #1571 as new `<TextareaCounter>` primitive.
- [x] **Open-`<select>` active-option styling.** ✅ Resolved 2026-04-30 — deferred to a future combobox issue (Phase 5 forms-tier work). Native `<select>` cannot render `bg-ink text-cream + jersey-deep dot` on the active option.
- [x] **`<FieldError>` extraction.** ✅ Resolved 2026-04-30 — extracted as a primitive (single source of truth across Input / Select / Textarea).
- [ ] **`disabled` cream-soft on Form atoms.** Master design has no explicit guidance for disabled form chrome; cream-soft is a guess that unifies with surrounding page. May need to be lighter (`cream-soft/50`) if it reads as too prominent. → resolved during implementation of #2.A.4
- [ ] **EditorialLink `inline` arrow opt-in.** Is there a use case for inline links that _do_ want a trailing arrow? Default is `false` for `inline` but `withArrow` accepts override. May discover none and remove the prop. → resolved during implementation of #2.A.1
- [ ] **VR baselines for legacy consumers.** When an atom changes, its appearance inside legacy consumer stories also changes. Should those baselines be updated too (consumer is unchanged but renders the new atom), or marked `vr-skip` until the consumer's own phase? → resolved during tracer bullet (#2.0); set the precedent there.

---

## 10. Discovered unknowns

> Filled during implementation. Format: `- [date] Discovered: <what> → <action>`.

_(empty)_
