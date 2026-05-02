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
- [ ] `<Button variant="primary">` renders `bg-jersey-deep text-cream` with the documented hover/focus treatment
- [ ] `Button.stories.tsx` `PrimaryRedesigned` story exists with `tags: ["autodocs", "vr"]` and a captured VR baseline
- [ ] `pnpm vr:update:story -- --testPathPatterns=ui-button` (or any `testPathPatterns` regex anchored to the Button atom's story-ID prefix) updates only Button-story baselines (verified by counting changed PNG files)
- [ ] `pnpm --filter @kcvv/web check-all` passes

### 5.A Track A acceptance (per child issue, summarised here)

- [ ] **2.A.1 EditorialLink:** `apps/web/src/components/design-system/EditorialLink/` exists with `EditorialLink.tsx`, `EditorialLink.stories.tsx`, `EditorialLink.test.tsx`, `index.ts`. `SectionHeader.tsx` no longer holds bespoke highlighter-mask JSX; it renders `<EditorialLink variant="cta">`. The `TODO(phase-4): consolidate with <HighlighterStroke>` comment is removed.
- [ ] **2.A.2 Phosphor migration:** Every Phase 2 atom that previously imported from `@/lib/icons` now imports from `@/lib/icons.redesign`. Wrapper components default `weight="fill"` and accept `size`, `className`, `aria-hidden` pass-through.
- [ ] **2.A.3 Button:** `ButtonVariant` type is `"primary" | "inverted" | "secondary" | "ghost"` (no `link`). `withArrow` renders typographic `→` glyph (`<span aria-hidden>→</span>`), not a Phosphor icon. Focus ring uses `ring-jersey-deep`. Corners are square (`rounded-none`). `secondary` uses the shared `shadow-paper-sm` token (not an arbitrary `[4px_4px_0_0_…]` value). Disabled stays `opacity-50 cursor-not-allowed`. Zero non-test consumers of the removed `link` variant (verified by grep at PR time).
- [ ] **2.A.4 Form atoms:** Input / Select / Textarea uniformly implement the locked Direction C state machine (`bg-white` + 2px ink-weighted border + `--shadow-paper-sm-soft` resting shadow + paper-press idiom on hover/focus + `--shadow-paper-sm-alert` on error). No jersey-deep on the field anywhere — focus signals via `border-ink` + shadow snap + `translate(2px, 2px)`. Filled state anchors at `border-ink/60`. Sharp corners (`rounded-[0.25em]` removed — see AC override note in §6.3). New `<FieldError>` and `<TextareaCounter>` primitives extracted. Phosphor `CaretDown` replaces Lucide on Select. `kcvv-alert` no longer referenced from these four files. See `docs/design/mockups/phase-2-a-4-form-atoms/compare.md` (locked spec) and `option-c-locked.html` (canonical visual).
- [ ] **2.A.5 Alert:** Two-form retro vocabulary per the locked design checkpoint (2026-04-30) — primary `<AlertBadge>` (Direction E — angled badge + italic Freight Display message, non-dismissible) and long-form `<Alert>` (Direction B — perforated ticket-stub with mono kicker + italic title + ink body + optional dismiss). Both share `variant: "success" | "warning" | "error"` (no `info`). Each variant uses distinct icons: `CheckCircle` (success) / `Warning` (warning) / `WarningCircle` (error). Dismiss on `<Alert>` renders Phosphor Fill `X`. WAI-ARIA: `success` and `warning` use `role="status"` + `aria-live="polite"`; `error` uses `role="alert"` + `aria-live="assertive"`. See `docs/design/mockups/phase-2-a-5-alert/compare.md` (locked spec) and `option-e-angled-badge.html` + `option-b-ticket-stub.html` (canonical visuals). Original token-swap PRD §6.4 was rejected and has been rewritten — see updated §6.4 in this PRD. Form-atoms (§6.3 / #1571) consume `<AlertBadge variant="error">` for the helper-row error slot — the originally-proposed `<FieldError>` primitive is superseded.
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

All four variants share the canonical retro press-down hover: `hover:shadow-none hover:translate-x-1 hover:translate-y-1` (the shadow is "absorbed" as the button presses down by exactly its 4 px offset). Inverted swaps `shadow-paper-sm` for the muted sibling `shadow-paper-sm-soft` so the shadow stays visible against the dark surface the variant is designed for. Every variant carries `border-2 border-ink` for the stamped paper-card silhouette.

| Variant     | Surface          | Text         | Shadow                 | Hover-fill change      |
| ----------- | ---------------- | ------------ | ---------------------- | ---------------------- |
| `primary`   | `bg-jersey-deep` | `text-cream` | `shadow-paper-sm`      | `hover:brightness-110` |
| `inverted`  | `bg-cream`       | `text-ink`   | `shadow-paper-sm-soft` | `hover:bg-cream-soft`  |
| `secondary` | `bg-cream-soft`  | `text-ink`   | `shadow-paper-sm`      | `hover:bg-cream`       |
| `ghost`     | transparent      | `text-ink`   | `shadow-paper-sm`      | `hover:bg-ink/5`       |

**Cross-component rule:** the press-down hover defined here is the **canonical interactive hover** for the redesign. Every paper-stamped interactive primitive (`Button`, `LinkButton`, `FilterTabs` chips, `BrandedTabs` tabs, `ScrollArrowButton`, `HorizontalSlider` arrows) uses `hover:shadow-none hover:translate-x-1 hover:translate-y-1` — no exceptions, no per-component soft-press variants.

**Removed:** `variant="link"` (zero non-test consumers; the link visual lives in `<EditorialLink>` instead).

**Other Button changes:**

- `withArrow` renders `<span aria-hidden>→</span>` with `group-hover:translate-x-1` (typographic glyph, not Phosphor icon).
- Focus ring: `focus-visible:ring-jersey-deep focus-visible:ring-offset-2`.
- Disabled: `opacity-50 cursor-not-allowed` (unchanged).
- Sizes (sm/md/lg) and `fullWidth` prop preserved.
- **Corners are square** (`rounded-none`). The retro-terrace fanzine vocabulary drops border-radius across the redesign — buttons inherit that rule.

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

**Field-error rendering — use `<AlertBadge>`, not a separate `<FieldError>` primitive.** The form-atoms checkpoint compare.md sketched a `<FieldError>` extraction (a "paper pill `FOUT` + italic alert message" wrapper). The Phase 2.A.5 design checkpoint independently arrived at the identical idiom and shipped it as `<AlertBadge variant="error">` (PRD §6.4.A). Two teams converging on the same retro-pill-plus-italic-message vocabulary is a strong design signal — there is no behavioural daylight between the two. The form atoms therefore use `<AlertBadge variant="error">` directly:

- `<Input>`, `<Select>`, `<Textarea>` accept an `error?: string` prop. When set, the atom renders `<AlertBadge variant="error">{error}</AlertBadge>` inside the helper-row slot. No separate `<FieldError>` primitive is created.
- The form-atoms compare.md `<FieldError>` extraction (lines 112–129) is **superseded by this PRD section**. The historical mockup remains for reference.
- One source of truth, one component file, one set of stories + VR baselines.

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

#### New primitive — `<TextareaCounter>`

Extracted into `apps/web/src/components/design-system/` with its own story (`tags: ["autodocs", "vr"]`).

- **`<TextareaCounter>`** — `current/max` mono digits in the bottom-right corner of `<Textarea>`. Color shifts to `text-alert` when `current > max`. Wired into `<Textarea>` via the existing `maxLength` prop (no new public surface).

> **Field-error rendering uses `<AlertBadge>` (§6.4.A)**, not a separate `<FieldError>` primitive. The form-atoms compare.md sketched a `<FieldError>` extraction, but the Phase 2.A.5 design checkpoint independently arrived at the identical retro-pill-plus-italic-message vocabulary as `<AlertBadge variant="error">`. There is no behavioural daylight between the two — `<Input>`, `<Select>`, `<Textarea>` render `<AlertBadge variant="error">{error}</AlertBadge>` in the helper-row slot when `error?: string` is set. Single component file, one set of stories + VR baselines, no vocabulary drift between teams.

#### Sizes

Heights locked at sm 32 / md 40 / lg 48 (px). Padding scales with the existing `sm/md/lg` ladder. Sizes ladder unchanged from current implementation; only borders, shadows, and transforms change.

#### Implementation order (per the standard Phase 2 atom-reskin workflow)

1. Append `--shadow-paper-sm-alert` to the `@theme` block in `apps/web/src/styles/globals.css`. Add MDX entry in `Foundation/Colors`.
2. Reskin `Input.tsx`, `Select.tsx`, `Textarea.tsx`, `Label.tsx` per the spec above.
3. Create `<TextareaCounter>` primitive with its own story + tests. (Field-error rendering uses `<AlertBadge variant="error">` from §6.4.A — no separate `<FieldError>` primitive.)
4. Update Storybook stories for all four atoms covering every state in the table above (default, hover, focus, filled, filled+focus, error, error+focus, disabled), plus sm/md/lg, optional-pill, hint, kicker.
5. `pnpm vr:update:story "Input|Select|Textarea|Label|TextareaCounter"` captures baselines.
6. PR description lists every story whose baseline was updated, plus an explicit **AC overrides** section calling out the sharp-corners override.
7. `pnpm --filter @kcvv/web check-all` passes.

### 6.4 Alert — two-form retro vocabulary (`<AlertBadge>` + `<Alert>`)

Originally specced as a single token-swap atom in this PRD. Owner reviewed the token-swap implementation (left-accent border + tinted soft bg + Phosphor icon) and rejected — it produced visuals indistinguishable from generic Material/shadcn alerts. Promoted to a real design checkpoint; **see [`docs/design/mockups/phase-2-a-5-alert/compare.md`](../design/mockups/phase-2-a-5-alert/compare.md) for the full direction comparison and locked decisions.**

The locked outcome is a **two-form Alert API**: a primary inline form (`<AlertBadge>`, Direction E) and a long-form companion (`<Alert>`, Direction B). Different shapes for different message lengths instead of one shape forced on every use case.

`info` stays retired across both forms; consumers migrate to `success`. Verify zero `<Alert variant="info">` consumers at PR time; if any exist, migrate them in the same PR.

#### 6.4.A `<AlertBadge>` — primary inline form (Direction E)

Angled solid-colored badge on the left + italic Freight Display message to the right. No card body, no soft-tinted bg, no chrome — the page colour shows through. Used for inline form-field validation, short single-headline confirmations, and one-badge-per-form-summary multi-line messages.

```typescript
type AlertBadgeVariant = "success" | "warning" | "error";

interface AlertBadgeProps {
  variant: AlertBadgeVariant;
  /** Message text — single line typical, multi-line allowed. */
  children: ReactNode;
  className?: string;
}
```

**Visual contract** (canonical reference: [`option-e-angled-badge.html`](../design/mockups/phase-2-a-5-alert/option-e-angled-badge.html)):

| Layer                | Spec                                                                                                                                                                                                                                                                                                             |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Container            | `inline-flex items-start gap-[18px]`. No border, no shadow, no bg.                                                                                                                                                                                                                                               |
| Badge                | `inline-flex items-center gap-2`, `border-2 border-ink`, `shadow-[3px_3px_0_0_var(--color-ink)]`, `transform: rotate(-2deg)`, `rounded-none`, `font-mono text-[11px] font-bold uppercase tracking-[0.12em]`, `px-3 py-[6px]`, `whitespace-nowrap`, `mt-[2px]` (cap-height alignment with line 1 of the message). |
| Badge bg per variant | success → `bg-jersey-deep text-cream`; warning → `bg-warning text-cream`; error → `bg-alert text-cream`.                                                                                                                                                                                                         |
| Badge label          | Mono caps Dutch — `MELDING` / `WAARSCHUWING` / `FOUT`.                                                                                                                                                                                                                                                           |
| Badge glyph          | `✓` (success — Phosphor `CheckCircle`); `▲` (warning — Phosphor `Warning`); `!` (error — Phosphor `WarningCircle`). Distinct per variant; the earlier draft mistakenly used `▲` for both warning and error.                                                                                                      |
| Message              | `font-display italic font-normal text-[22px] leading-[1.25]`. Variant accent colour: `text-jersey-deep` / `text-warning` / `text-alert`.                                                                                                                                                                         |
| Multi-line behaviour | Wrapped lines align to the same x-edge as line 1 (badge-right + 18 px gap). The badge stays at line 1 via `align-items: flex-start`; do **not** vertically centre the badge against multi-line messages.                                                                                                         |
| Dismiss              | **Not supported.** AlertBadge is non-dismissible by design — form validation resolves on revalidation; confirmations fade with the next interaction; no `×` slot.                                                                                                                                                |

**Production icon imports:** `CheckCircle`, `Warning`, `WarningCircle` from `@/lib/icons.redesign`.

**Form-atoms integration (cross-references §6.3):** `<AlertBadge variant="error">` is the canonical renderer for form-field errors. When `<Input>`, `<Select>`, `<Textarea>` (Phase 2.A.4) accept an `error?: string` prop, they internally render `<AlertBadge variant="error">{error}</AlertBadge>` in the helper-row slot. The originally-proposed `<FieldError>` primitive in the form-atoms checkpoint compare.md is superseded — there is no behavioural daylight between it and `<AlertBadge>`, and converging on a single component avoids vocabulary drift between two teams shipping the same idiom.

#### 6.4.B `<Alert>` — long-form companion (Direction B — Ticket Stub)

Perforated-edge "torn from a programme" card with mono caps kicker label, italic Freight Display title, and an ink-text body. Used for page-level / dashboard-level alerts that need a title, multi-paragraph body, and/or a dismiss button. Replaces the legacy `<Alert>`.

```typescript
type AlertVariant = "success" | "warning" | "error";

interface AlertProps {
  variant?: AlertVariant; // default: "success"
  title?: string;
  children: ReactNode;
  dismissible?: boolean; // default: false
  onDismiss?: () => void;
  className?: string;
}
```

**Visual contract** (canonical reference: [`option-b-ticket-stub.html`](../design/mockups/phase-2-a-5-alert/option-b-ticket-stub.html)):

| Layer                         | Spec                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Outer card                    | `relative grid grid-cols-[72px_1fr] border-2 border-ink shadow-[var(--shadow-paper-sm)] rounded-none overflow-hidden`. Tinted soft bg per variant: `bg-success-soft` (introduced for this atom — see §6.7) / `bg-warning-soft` / `bg-alert-soft`.                                                                                                                                                                                                                            |
| Notch column                  | Left grid track (72 px wide). Perforated tear via paired `radial-gradient` masks producing half-disc cut-outs at a 12 px rhythm; reinforced by `border-right: 2px dashed var(--color-ink)`. The mask punches the notch column itself, so the page bg shows through the half-discs (works on both light and dark surrounding panels). Implemented as the `kcvv-stub-notch` utility class in `globals.css`.                                                                    |
| Icon block                    | 40 × 40 (h-10 w-10), centred horizontally in the notch column and anchored to the top via `flex items-start justify-center pt-4`, so the icon top aligns with the kicker text top instead of the geometric centre — keeps the icon "on top text" in multi-paragraph bodies. Solid bg per variant (`bg-jersey-deep` / `bg-warning` / `bg-alert`). Cream glyph; same icon mapping as `<AlertBadge>` (`CheckCircle` / `Warning` / `WarningCircle` from `@/lib/icons.redesign`). |
| Body                          | `px-5 py-4` (20 × 16 px). Mono caps kicker (`★ MELDING` / `⚠ WAARSCHUWING` / `! FOUT`) above an italic Freight Display title (`font-display italic font-bold text-[22px]`). Body text in `text-ink` Inter 15 px / 1.55.                                                                                                                                                                                                                                                      |
| Dismiss                       | Optional `×` button in the upper-right corner just inside the body padding. `text-ink/60 hover:text-ink`, `focus-visible:ring-jersey-deep`.                                                                                                                                                                                                                                                                                                                                  |
| **No** right-edge claim strip | An earlier draft rendered a 6 px coloured strip on the right edge as a redundant variant cue — removed per owner feedback (2026-04-30). The icon block + tinted body already carry the variant cue, the card already has a border + paper shadow.                                                                                                                                                                                                                            |
| Dusk-panel legibility         | Stub body keeps its tinted soft bg regardless of surrounding panel theme — title and body MUST stay `text-ink` even when nested inside `panel--dusk` (CSS-level override required, since `.panel--dusk h3` cascades cream to `<h3>` titles by default).                                                                                                                                                                                                                      |

**Production icon imports:** same as `<AlertBadge>` plus `X` for dismiss, all from `@/lib/icons.redesign`.

#### 6.4.C Choosing between the two forms

| Use case                                                               | Form                                           |
| ---------------------------------------------------------------------- | ---------------------------------------------- |
| Inline form-field error ("invalid phone number")                       | `<AlertBadge>`                                 |
| Short single-headline confirmation ("message sent")                    | `<AlertBadge>`                                 |
| Form-summary alert under the form (multi-line, listing several issues) | `<AlertBadge>` (one badge, multi-line message) |
| Page-level system error / dashboard banner with title + body           | `<Alert>`                                      |
| Multi-paragraph guidance / informational notice with optional dismiss  | `<Alert>`                                      |
| Anything that needs a `dismissible` close button                       | `<Alert>`                                      |

If a use case feels ambiguous, default to `<AlertBadge>` — it carries the strongest retro signal and works for ~80 % of alerts in the product.

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

/* Success body tint — desaturated sage. Pairs with the existing
   warning-soft (mustard) and alert-soft (dusty brick) so the three Alert
   variants share a balanced soft-body palette. Introduced for the Phase
   2.A.5 Alert ticket-stub (§6.4.B). */
--color-success-soft: #d8e7d0;
```

`--color-success` itself is **not added** — `--color-jersey-deep` covers solid-fill success semantics (icon blocks, badge fills). Only the `-soft` body tint is unique enough to warrant its own token.

Legacy `--color-kcvv-warning` and `--color-kcvv-alert` stay defined; legacy components keep using them until their own phase.

### 6.8 New script — `apps/web/package.json`

```json
"vr:update:story": "pnpm run vr:build-storybook && docker compose -f docker-compose.vr.yml run --rm vr -u"
```

Invocation: `pnpm vr:update:story -- --testPathPatterns=ui-button` — only updates baselines for stories whose synthetic test path matches the regex. The `--` separator hands the trailing arguments to test-storybook, which forwards `--testPathPatterns=<regex>` to Jest (the flag is plural in current Jest; the singular `--testPathPattern` is deprecated). The regex matches the synthetic test file paths derived from story IDs (e.g. `ui-button`, `layout-pagefooter`), not the source `.stories.tsx` file paths. Use a tight anchor like `ui-button` to scope to a single atom without dragging in `ui-linkbutton`/`ui-downloadbutton`/etc. Pattern is a Jest-compatible regex string.

### 6.9 Composition primitives — `<ClippedCard>` + `<StampBadge>`

Two Tier B composition primitives that frame **document / form** surfaces in the retro-terrace-fanzine direction. Implemented in #1591 alongside Phase 2. Visual reference: the consolidated form composition in `docs/design/mockups/phase-2-a-4-form-atoms/option-c-locked.html`.

#### `<ClippedCard>`

Bordered "archival document" paper card — `border-2 ink` + cream-soft surface + opinionated `36px 40px 28px` padding default, **no offset shadow, no rotation**. Renders TL + BR L-shaped corner-clip accents internally as a private `<CornerClipDecoration>` subcomponent (not exported from the design-system barrel). L-marks: `18px × 18px`, `2px solid ink`, drawn on the relevant two sides per corner, translated 6px outward so they sit _outside_ the parent's border edge. Sharp corners. Decorations carry `aria-hidden="true"`.

Prop surface is intentionally narrow: `{ children, className?, as? }`. No `rotation`, no `shadow`, no `tape`, no surface-tone override. A consumer reaching for any of those should use `<TapedCard>` instead — see the mood split below.

#### `<StampBadge>`

Content-bearing rotated badge with paper offset shadow, designed to pin to a `position: relative` parent (`<ClippedCard>` already is). Default surface: `bg-jersey-deep text-cream` + `1.5px ink` border + `4px 4px 0 0 var(--color-ink)` shadow. Mono caps typography (`text-[11px] tracking-[0.1em] font-bold`, `px-3.5 py-1.5`). Default rotation `2°`; accepts negative values for opposite tilt.

Props: `{ children, rotation?, position?, tone?, className? }`. Tones: `jersey` (default), `ink` (`bg-ink text-cream`), `alert` (`bg-alert text-white` — for stamps like "VOLZET" or "GEANNULEERD"). Positions: `top-right` (default) and `top-left`. Border + shadow stay ink across all tones — chrome rule, mirrors the `<FieldError>` FOUT badge convention from #1571.

Distinct from `<TapeStrip>` (graphical washi-tape strip) — `<StampBadge>` is a _content-bearing rotated label_ with an offset shadow.

#### Mood split — keep `<ClippedCard>` and `<TapedCard>` distinct

The two card primitives express different moods and **must not be combined**. Their prop surfaces are deliberately non-overlapping so the visual conflict is unrepresentable:

| Mood                        | Primitive       | Visual identity                                                                         |
| --------------------------- | --------------- | --------------------------------------------------------------------------------------- |
| Loose paper / casual notice | `<TapedCard>`   | `border-2 ink` + `--shadow-paper-sm` offset + optional washi tape + sub-degree rotation |
| Document / archival form    | `<ClippedCard>` | `border-2 ink` + L-marks at TL/BR (internal) + **no offset shadow** + **no rotation**   |

`<ClippedCard>` is for things that feel like _clipped paper_ — pinned to a clipboard, archival, official. `<TapedCard>` is for things that feel like loose paper on a desk (notices, taped-up artefacts, editorial figures). The "don't" Storybook story `UI/ClippedCard › DontMixWithTapedCard` illustrates the conflict.

#### Composition pattern — registration form shell

The locked Phase 2.A.4 form composition is documented as a Storybook story at `Features/Forms/RegistrationCardPattern` — **not** promoted to a `<FormCard>` wrapper component. `<ClippedCard>` carries the visual contract; the form-specific composition (stamp content, header, footer divider, button) is feature-level. If ≥ 2 form pages duplicate that exact shell, promote to `<FormCard>` then — not pre-emptively.

Submit button uses `<Button variant="secondary">` (cream-soft body + ink border + ink paper shadow + press idiom; PRD §6.1) — the single green moment in the form is the jersey-deep stamp. Two greens (button body + stamp body) become a visual conversation; cohesion of paper-card chrome wins.

```tsx
<ClippedCard>
  <StampBadge rotation={2}>★ INSCHRIJVING</StampBadge>
  <MonoLabelRow>…</MonoLabelRow>
  <EditorialHeading>Welkom op de tribune.</EditorialHeading>
  <FormGrid>…</FormGrid>
  <DashedDivider />
  <FormFooter>
    <span className="font-mono text-ink-muted">5 van 7 ingevuld</span>
    <Button variant="secondary" withArrow>
      Versturen
    </Button>
  </FormFooter>
</ClippedCard>
```

#### Deferred follow-ups

- `<ClippedCard size?: "sm" | "md">` — corner-clip size scaling for smaller surfaces (e.g. event tile in a grid). Defer until a real consumer hits the limit.
- `<ClippedCard tone?: "dark">` — dark-mood archival variant on `panel--dusk`. Defer until needed.
- `<StampBadge glyph?: "★" | "✱" | "♦">` — promote leading-glyph variant when ≥ 2 consumers request it. Currently inlined via `children`.
- `<StampBadge>` `tone="ink"` shadow on `panel--dusk` — adopt `--shadow-paper-sm-soft` per Track B precedent if a non-form consumer puts the stamp on dark.

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
