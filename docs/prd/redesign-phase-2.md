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
   │       2.A.6  FilterTabs icon prop type swap (Lucide → Phosphor Icon)                  → #1573
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

- [ ] `apps/web/package.json` contains `vr:update:story` script that invokes `test-storybook -u` and forwards a positional argument to the test-runner. The argument falls through to Jest as a `testPathPattern` (test-storybook does not expose `--testNamePattern`; pass `--testNamePattern <regex>` after the positional path pattern only if a finer name-level filter is intentionally required).
- [ ] `apps/web/src/styles/globals.css` `@theme` block contains `--color-alert: #B84A3A`, `--color-warning: #C68B2C`, `--color-alert-soft: #E8D5CF`, `--color-warning-soft: #ECDDB8`
- [ ] `@phosphor-icons/react` installed in `apps/web/package.json`
- [ ] `apps/web/src/lib/icons.redesign.ts` exists and exports at least `ArrowRight` as a `weight="fill"` wrapper component
- [ ] `<Button variant="primary">` renders `bg-jersey text-cream` with the documented hover/focus treatment
- [ ] `Button.stories.tsx` `PrimaryRedesigned` story exists with `tags: ["autodocs", "vr"]` and a captured VR baseline
- [ ] `pnpm vr:update:story design-system/Button/Button` (or any `testPathPattern` anchored to the Button atom) updates only Button-story baselines (verified by counting changed PNG files)
- [ ] `pnpm --filter @kcvv/web check-all` passes

### 5.A Track A acceptance (per child issue, summarised here)

- [ ] **2.A.1 EditorialLink:** `apps/web/src/components/design-system/EditorialLink/` exists with `EditorialLink.tsx`, `EditorialLink.stories.tsx`, `EditorialLink.test.tsx`, `index.ts`. `SectionHeader.tsx` no longer holds bespoke highlighter-mask JSX; it renders `<EditorialLink variant="cta">`. The `TODO(phase-4): consolidate with <HighlighterStroke>` comment is removed.
- [ ] **2.A.2 Phosphor migration:** Every Phase 2 atom that previously imported from `@/lib/icons` now imports from `@/lib/icons.redesign`. Wrapper components default `weight="fill"` and accept `size`, `className`, `aria-hidden` pass-through.
- [ ] **2.A.3 Button:** `ButtonVariant` type is `"primary" | "inverted" | "secondary" | "ghost"` (no `link`). `withArrow` renders typographic `→` glyph (`<span aria-hidden>→</span>`), not a Phosphor icon. Focus ring uses `ring-jersey-deep`. Disabled stays `opacity-50 cursor-not-allowed`. Zero non-test consumers of the removed `link` variant (verified by grep at PR time).
- [ ] **2.A.4 Form atoms:** All four atoms render `bg-white` with `border border-ink/20`, focus state uses `border-jersey-deep` + `ring-jersey-deep/20`. Error state on Input/Select/Textarea uses `--color-alert`. Label required asterisk uses `--color-alert`. `kcvv-alert` no longer referenced from these four files.
- [ ] **2.A.5 Alert:** `AlertVariant` type is `"success" | "warning" | "error"` (no `info`). Each variant matches the colour map in §6.5. Dismiss button renders Phosphor Fill `X`.
- [ ] **2.A.6 FilterTabs prop type:** `FilterTab.icon` typed as Phosphor `Icon` from `@phosphor-icons/react`. Type-check passes (no current consumers verified to break).

### 5.B Track B acceptance (per child issue)

Each Track B child issue has two phases internally:

1. **Design phase** (`/design-an-interface` produces mockups + decision; owner approves before implementation begins).
2. **Implementation phase** — the atom reskinned per approved design; story + VR baseline captured; `check-all` green.

Per atom:

- [ ] **2.B.1 Spinner:** Approved design (likely _not_ the circular SVG default). Reskinned. `SpinnerVariant` updated if needed (e.g., `white` → `cream` rename). Story + baseline.
- [ ] **2.B.2 BrandedTabs:** Approved design. Bottom-border tabs reinterpreted in retro vocabulary. Token swap (`kcvv-green-bright` → `jersey-deep`, etc.). Story + baseline.
- [ ] **2.B.3 FilterTabs:** Approved design. Pill toggle group reinterpreted. Story + baseline.
- [ ] **2.B.4 HorizontalSlider + ScrollHint arrows:** Approved design. Arrow buttons reskinned. Phosphor Fill `CaretLeft` / `CaretRight` consumed via `icons.redesign.ts`. Story + baseline.

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

Master design Open Q7 (paper aesthetic on chrome) defers to Phase 6/8. Phase 2 keeps form atoms as functional chrome — no rotation, no tape, no hard paper shadow.

**Token swaps:**

- Background: stays `bg-white`.
- Border (default): `border border-ink/20` (was `border-foundation-gray`).
- Border (focus): `focus:border-jersey-deep`.
- Ring (focus): `focus:ring-jersey-deep/20`.
- Border (error): `border-alert`.
- Ring (error): `focus:ring-alert/20`.
- Disabled: `disabled:bg-cream-soft disabled:opacity-50` (cream-soft unifies with page surface).
- Placeholder text: `text-ink/40`.
- `Label`: `text-ink font-semibold`. Required asterisk `text-alert`.

Border radius (`rounded-[0.25em]`) unchanged. Sizes (sm/md/lg) unchanged.

### 6.4 `<Alert>` — 3 variants (info dropped)

| Variant   | Surface           | Left accent                     | Icon                                                       | Text       |
| --------- | ----------------- | ------------------------------- | ---------------------------------------------------------- | ---------- |
| `success` | `bg-jersey/10`    | `border-l-4 border-jersey-deep` | `CheckCircle` (Phosphor Fill, `text-jersey-deep`)          | `text-ink` |
| `warning` | `bg-warning-soft` | `border-l-4 border-warning`     | `Warning` (Phosphor Fill, `text-warning`)                  | `text-ink` |
| `error`   | `bg-alert-soft`   | `border-l-4 border-alert`       | `WarningCircle` or `XCircle` (Phosphor Fill, `text-alert`) | `text-ink` |

- Dismiss button: Phosphor Fill `X` icon, `text-ink/60 hover:text-ink`.
- `info` variant removed entirely. Any consumer using it migrates to `success` (the closest visual semantic).
- Verify zero `<Alert variant="info">` consumers at PR time; if any exist, migrate them in the same PR.

### 6.5 Track B atoms (designs to be produced)

The following atoms have **no specified visual contract in this PRD** — design checkpoints via `/design-an-interface` produce that contract before implementation begins.

- **`<Spinner>`** — circular SVG default is the digital-loader trope. Explore retro-fanzine alternatives: spinning football glyph, halftone dot cycle, barber-pole stripe, animated mono-cycling dots. Constraint: still works at every Spinner size (sm/md/lg/xl) and renders correctly inline + standalone. Logo variant (`/images/logo-flat.png` rotation) likely retained as-is — it's already brand-character.
- **`<BrandedTabs>`** — bottom-border tab pattern. Token swap is trivial; the open question is whether the bottom-border _pattern itself_ survives in the retro vocabulary or gets reinterpreted (e.g., taped corner accent, mono-stamp underline, ink ribbon).
- **`<FilterTabs>`** — pill toggle group. Open question: pills survive (with new fills), or replaced with a stamped-card grid, button-row, or other retro-coherent toggle pattern.
- **`<HorizontalSlider>` + `<ScrollHint>` arrow buttons** — arrow button shape, fill, hover treatment. Should match whatever toggle/button vocabulary settles in BrandedTabs/FilterTabs for visual cohesion.

**Design exploration brief for Track B:** produce _cohesive directional options_ (e.g., direction A = "stamped paper buttons", direction B = "ink ribbon underlines") so the four atoms read as one family, AND _per-atom variations_ within each direction so each atom can be evaluated on its own merits. Owner picks direction → per-atom mockups → implementation.

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
```

`--color-success` is not added — `--color-jersey-deep` covers success semantics.

Legacy `--color-kcvv-warning` and `--color-kcvv-alert` stay defined; legacy components keep using them until their own phase.

### 6.8 New script — `apps/web/package.json`

```json
"vr:update:story": "pnpm run vr:build-storybook && docker compose -f docker-compose.vr.yml run --rm vr -u"
```

Invocation: `pnpm vr:update:story design-system/Button/Button` — only updates baselines for stories whose `.stories.tsx` file path matches the given pattern. The positional argument falls through to Jest's runner as `testPathPattern` per Jest CLI convention (test-storybook does not expose `--testNamePattern` directly; it spawns Jest with leftover argv). Use a tight anchor like `design-system/Button/Button` to scope to a single component file. Pattern is a Jest-compatible regex string.

---

## 7. Effect Schema / api-contract changes

**None.** Phase 2 is presentational. No API endpoints added, no schemas changed.

---

## 8. Visual regression baseline strategy

VR baselines are committed in the same PR as the atom that invalidates them. For each atom PR:

1. Run `pnpm vr:update:story <atom-path-pattern>` locally (e.g. `pnpm vr:update:story design-system/Button/Button`) to capture only the changed atom's baselines. The argument is a Jest-compatible `testPathPattern` regex; anchor it tightly to the atom file path. First-degree consumer stories whose visuals change because they import the redesigned atom should be opted out via `parameters.vr.disable: true` per `apps/web/CLAUDE.md` → _Atom reskin PRs_, with the consumer's redesign issue as the re-evaluate date — not auto-baselined here.
2. Inspect the produced baselines manually — the atom should look correct in light + dark, sm + md + lg, default + hover/focus/disabled per its story matrix.
3. Stage and commit the new/updated baseline PNGs in the same commit as the component change.
4. PR description includes a "## VR baselines" section listing every story file whose baseline changed (justifies the update per the VR contract).

Full `pnpm vr:update` (~25–41 minutes) runs only when a token file change demonstrably affects every story (e.g., a global font change). Phase 2's token additions are scoped — no Phase 2 PR should need a full update.

---

## 9. Open questions

These are NOT blockers for writing the PRD. Each one is genuinely unknown right now and will be resolved at the indicated point:

- [ ] **Spinner direction.** Retro alternatives explored — which one wins? → resolved by `/design-an-interface` for #2.B.1
- [ ] **BrandedTabs pattern survival.** Bottom-border underline preserved or reinterpreted (taped accent, mono-stamp, ink ribbon)? → resolved by `/design-an-interface` for #2.B.2
- [ ] **FilterTabs pattern survival.** Pill toggle preserved (new fills) or replaced with a stamped-card grid? → resolved by `/design-an-interface` for #2.B.3
- [ ] **Arrow button shape.** Should follow whatever toggle vocabulary settles in BrandedTabs/FilterTabs. → resolved by `/design-an-interface` for #2.B.4
- [ ] **`<Alert variant="info">` migration.** Are there existing consumers? If yes, do they all map cleanly to `success`, or do some need a different variant? → resolved by grep at PR time for #2.A.5
- [ ] **Phosphor `Spinner` compatibility.** Phosphor Fill ships a `Spinner` icon — does it work as a CSS-spun loading indicator, or does the design checkpoint settle on something else? → resolved by `/design-an-interface` for #2.B.1
- [ ] **`disabled` cream-soft on Form atoms.** Master design has no explicit guidance for disabled form chrome; cream-soft is a guess that unifies with surrounding page. May need to be lighter (`cream-soft/50`) if it reads as too prominent. → resolved during implementation of #2.A.4
- [ ] **EditorialLink `inline` arrow opt-in.** Is there a use case for inline links that _do_ want a trailing arrow? Default is `false` for `inline` but `withArrow` accepts override. May discover none and remove the prop. → resolved during implementation of #2.A.1
- [ ] **VR baselines for legacy consumers.** When an atom changes, its appearance inside legacy consumer stories also changes. Should those baselines be updated too (consumer is unchanged but renders the new atom), or marked `vr-skip` until the consumer's own phase? → resolved during tracer bullet (#2.0); set the precedent there.

---

## 10. Discovered unknowns

> Filled during implementation. Format: `- [date] Discovered: <what> → <action>`.

_(empty)_
