# Phase 2.A.4 — Form Atoms Design Checkpoint

> **Status:** ✅ **LOCKED — Direction C chosen, with revisions.**
> **Date:** 2026-04-30.
> **Scope:** Issue [#1571](https://github.com/soniCaH/www.kcvvelewijt.be/issues/1571) — Input / Select / Textarea / Label reskin.
> **PRD:** [`docs/prd/redesign-phase-2.md`](../../../prd/redesign-phase-2.md) §6.3.
> **Master design:** [`docs/plans/2026-04-27-redesign-master-design.md`](../../../plans/2026-04-27-redesign-master-design.md) §6.3.
> **Track B precedent:** [`docs/design/mockups/phase-2-track-b/compare.md`](../phase-2-track-b/compare.md) — paper chrome / ink emphasis / `--shadow-paper-sm-soft`.
> **Canonical visual reference:** [`option-c-locked.html`](option-c-locked.html).
> **Historical comparison:** [`compare.html`](compare.html) — three-way exploration that produced this lockdown.

---

## Decision

**Direction C — "Paper-card emphasis"** is the chosen direction, with two revisions on top of the original three-way exploration:

1. **No jersey-deep on the field anywhere.** Original C used `border-jersey-deep` on focus. This was wrong on two counts: (a) Track B Direction D explicit rule — "jersey reserved for _content_, not chrome", and form fields are chrome; (b) green-border-on-focus semantically reads as "validated", colliding with form-validation conventions. Focus now signals via **ink-darken + paper press** instead.
2. **Filled-state anchor locked in.** Q2 from the original sign-off list resolved — filled fields get `border-ink/60`, three ink weights now telegraph fill progression (`ink/30` empty → `ink/60` filled → `ink` focused).

Why C over the other directions:

- **Resonates with Track B chrome.** Fields read as part of the same paper-chrome family as BrandedTabs, FilterTabs, ScrollArrowButton. The whole UI speaks one vocabulary instead of two.
- **Filled-state anchor is unambiguous.** Long forms (member registration, match report) need at-a-glance "what's done, what's empty" scanning. Three ink weights deliver this without color.
- **The "dense-form" objection is cheap to dismiss.** Owner pointed out: this site doesn't have many forms. A 12-field admin Studio view doesn't exist on the public site — the cases that do exist (newsletter signup, contact, member registration, content reactions) are 3–6 fields. C's tactility wins for those.
- **Tactile interaction reinforces the editorial-fanzine direction.** Paper press on hover and pressed-into-paper on focus echoes physical paperwork — the same idiom used everywhere else on Track B chrome.

---

## Reference inputs

Owner-supplied mockups establish the baseline vocabulary; the C lockdown specialises that vocabulary onto paper-chrome rules.

Vocabulary fixed:

- **White surface** for the field body. Forms read distinct from editorial cream surfaces (this is the explicit AC; we do not pull cream into the field).
- **Sharp corners** — no `border-radius`. Matches the Track B chrome lockdown ("Sharp corners everywhere — no `border-radius`" — `phase-2-track-b/compare.md` §Decision). **This overrides the issue body's `rounded-[0.25em]` AC** — see Open Q6 below.
- **2px borders everywhere** with three ink weights signaling fill progression: `ink/30` (idle) → `ink/60` (filled) → `ink` (focused). Disabled drops to `ink/15`.
- **Resting paper-soft shadow** — `--shadow-paper-sm-soft` (4×4 ink-muted) on every field at rest. Hover compresses to 3×3 + `translate(1px, 1px)`. Focus snaps shadow to `0 0 0 0` and translates `2px, 2px` (pressed into the paper).
- **Bold ink labels** above the field with required `*` in `--color-alert`.
- **Mono caps `OPTIONEEL` pill** for optional fields (border `ink/30`, mono 10px, vertical padding for badge geometry).
- **Italic Freight Display hint** between label and field, color `ink/60`.
- **Mono caps kicker** below the field for state markers (`VAN BESTUUR ONTVANGEN`, `GEPUBLICEERD · 12 APR 2026`).
- **Paper-card `FOUT` badge** for the error helper row: alert-fill body + 1.5px ink border + ink paper shadow offset (3×3) + mono caps "FOUT" + Phosphor `WarningCircle` fill icon. Inline italic Freight Display alert message to the right of the badge. (Jersey-deep shadow under an alert body would be visually clashing — Track B reserves jersey for content; chrome takes ink shadows.)
- **Counter** (Textarea only) — mono digits in the bottom-right corner.
- **Sizes** — sm 32 / md 40 / lg 48 (height in px).
- **Phosphor `CaretDown`** chevron on Select (replaces Lucide `ChevronDown`).

---

## Locked specifications — Direction C

### Field state machine (Input / Select / Textarea — uniform)

| State        | Border             | Shadow                                     | Transform             | Surface         | Notes                                          |
| ------------ | ------------------ | ------------------------------------------ | --------------------- | --------------- | ---------------------------------------------- |
| Default      | `2px ink/30`       | `--shadow-paper-sm-soft` (4×4 ink-muted)   | —                     | `bg-white`      | Field is a mini paper module                   |
| Hover        | `2px ink/40`       | `3×3 ink-muted`                            | `translate(1px, 1px)` | `bg-white`      | Paper press idiom (matches Tabs)               |
| Focus        | `2px ink` _(full)_ | `0 0 0 0`                                  | `translate(2px, 2px)` | `bg-white`      | Pressed into paper. **No jersey, no ring.**    |
| Filled       | `2px ink/60`       | `--shadow-paper-sm-soft`                   | —                     | `bg-white`      | Anchored — completed fields read clearly       |
| Filled+focus | `2px ink`          | `0 0 0 0`                                  | `translate(2px, 2px)` | `bg-white`      | Focus dominates filled                         |
| Error        | `2px alert`        | `--shadow-paper-sm-alert` (4×4 alert-soft) | —                     | `bg-white`      | Alert color + alert-soft shadow                |
| Error+focus  | `2px alert`        | `0 0 0 0`                                  | `translate(2px, 2px)` | `bg-white`      | Press carries focus, alert color carries error |
| Disabled     | `2px ink/15`       | `none`                                     | —                     | `bg-cream-soft` | `opacity-50` + `cursor-not-allowed`            |

**Where jersey-deep no longer appears:** the field itself. Jersey returns only on the `<EditorialHeading>` period dot in showcase headers (decoration), the submit-button paper-shadow offset (content CTA), and tape stamps (content moment) — never on form-field chrome.

### New token

```css
/* Append to the existing @theme block in apps/web/src/styles/globals.css */
--shadow-paper-sm-alert: 4px 4px 0 0 var(--color-alert-soft);
```

Mirrors the `--shadow-paper-sm-soft` pattern locked in Track B. Used exclusively on form fields in the error state (and only where `--color-alert` border is present).

### Input ([`apps/web/src/components/design-system/Input/Input.tsx`])

Field state machine above. Token swaps:

```text
text-kcvv-gray-dark           → text-ink
placeholder:text-foundation-gray-dark → placeholder:text-ink/40
border-foundation-gray        → border-ink/30 (and the 1px → 2px weight swap)
focus:border-kcvv-green-bright focus:ring-kcvv-green-bright/20 → ink-press machine above (no ring)
border-kcvv-alert             → border-alert (+ shadow-paper-sm-alert)
disabled:bg-foundation-gray-light → disabled:bg-cream-soft
rounded-[0.25em]              → (removed — sharp corners)
```

Helper-row error rendering: replace the inline `<p class="text-kcvv-alert">` with `<FieldError>` (see below).

### Select ([`apps/web/src/components/design-system/Select/Select.tsx`])

Same field state machine as Input. Chevron: import `CaretDown` from `@/lib/icons.redesign` (Phosphor Fill), drop the Lucide `ChevronDown`. The chevron must visually shift with the field on hover/focus translate (it lives inside the press-target — already true in current `Select.tsx` since the icon is absolutely positioned inside the same `relative` wrapper).

**Open-menu state** (image 2 mockup, inverted active option `bg-ink text-cream + jersey-deep dot`): native `<select>` keeps OS-rendered dropdown — that styling appears in the mockup as a design idea but is **not implementable** on a native select. Flagged as a deferred _future combobox_ candidate (Phase 5 forms-tier work, not Phase 2). Q4 resolved.

### Textarea ([`apps/web/src/components/design-system/Textarea/Textarea.tsx`])

Same field state machine as Input. `resize: vertical` (unchanged). Counter: mono digits in the bottom-right corner (`58/240`, font-mono 11px, color `ink/60`). Color shifts to `text-alert` when `current > max`. The counter **is** in scope for #1571 (Q3 resolved — owner intent in image 3 makes the counter a deliverable, not a follow-up).

### Label ([`apps/web/src/components/design-system/Label/Label.tsx`])

```text
text          → text-ink font-semibold
required *    → text-alert (was text-kcvv-alert)
optional pill → mono caps "OPTIONEEL", border border-ink/30, px-1.5 py-0.5, text-[10px] tracking-wide
sizes         → sm/md/lg unchanged
```

### Shared `<FieldError>` primitive (new, scope-included)

The `FOUT` paper-pill + italic alert message is recurring; extract into a tiny primitive co-located with the form atoms (Q5 resolved — extracted, not inlined):

```tsx
<FieldError>Geen geldig telefoonnummer.</FieldError>
```

Renders:

```html
<span class="paper-pill paper-pill--alert">
  <WarningCircle weight="fill" /> FOUT
</span>
<span class="font-display italic text-alert">{children}</span>
```

Single source of truth; consumed by Input / Select / Textarea via their respective `error?: string` props.

### Counter primitive (new, scope-included)

`<TextareaCounter current={58} max={240} />` — standalone, used inside Textarea. Renders `58/240` mono in the corner, switches to `text-alert` when `current > max`.

---

## Open questions — resolution

| #   | Question                          | Resolution                                                                                                                                                                     |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Direction confirmation            | ✅ **C** with the two revisions above                                                                                                                                          |
| 2   | Filled-state anchor               | ✅ Locked — `border-ink/60` on filled, full ink on focus                                                                                                                       |
| 3   | Counter scope                     | ✅ In scope for #1571                                                                                                                                                          |
| 4   | Open-select active-option styling | ✅ Deferred to future combobox (Phase 5)                                                                                                                                       |
| 5   | `<FieldError>` extraction         | ✅ Extracted as a primitive                                                                                                                                                    |
| 6   | Sharp corners override            | ⚠️ **Pending owner sign-off** — issue body and `redesign-phase-2.md` §6.3 AC text both need a one-line edit to drop `rounded-[0.25em]`. Flag in implementation PR description. |

---

## Next step

Implementation proceeds via the standard Phase 2 atom-reskin workflow:

1. Append `--shadow-paper-sm-alert: 4px 4px 0 0 var(--color-alert-soft);` to the `@theme` block in `apps/web/src/styles/globals.css`. Add a swatch + token reference in `Foundation/Colors` MDX.
2. Reskin `Input.tsx`, `Select.tsx`, `Textarea.tsx`, `Label.tsx` per the spec above.
3. Create `<FieldError>` and `<TextareaCounter>` primitives in `apps/web/src/components/design-system/` with their own stories (`tags: ["autodocs", "vr"]`).
4. Update Storybook stories for all four atoms covering every visual state (default, hover, focus, filled, filled+focus, error, error+focus, disabled, sizes sm/md/lg, optional-pill, hint, kicker).
5. `pnpm vr:update:story "Input|Select|Textarea|Label|FieldError|TextareaCounter"` captures baselines.
6. PR description lists every story whose baseline was updated, plus the AC override note for sharp corners.
7. `pnpm --filter @kcvv/web check-all` passes.

---

## Historical exploration (preserved for reference)

The three original directional explorations led to the C lockdown. Each is preserved for context in [`compare.html`](compare.html):

| Direction                                                                                 | Status                  |
| ----------------------------------------------------------------------------------------- | ----------------------- |
| A — Color-only emphasis (mockup faithful)                                                 | Historical — not chosen |
| B — AC-faithful soft halo focus                                                           | Historical — not chosen |
| C — Paper-card emphasis, **revised** (no jersey on field, ink-press focus, ink/60 filled) | ✅ **Chosen**           |

Owner feedback that drove the lockdown:

- C's "dense-form heaviness" objection dismissed — owner noted: site doesn't have heavy forms; C's tactility wins for the 3–6-field cases that do exist.
- C's original `border-jersey-deep` focus was wrong: violates Track B's "jersey reserved for content" rule and reads as false-positive validation. Replaced with ink-darken + paper press.
- A's "filled state nearly invisible" objection accepted as a real failure mode → C locks in `border-ink/60` for filled.
- B's halo idiom rejected: doesn't appear elsewhere on Track B chrome; was a divergence from the editorial vocabulary.
- FOUT badge: jersey-deep shadow under alert-red body was visually clashing — corrected to ink shadow before the lockdown.

Initial green border on the FOUT badge was a designer error caught by owner during review — flagged as a useful precedent that **chrome shadows always default to ink (or ink-muted on dark panels), never to brand color, regardless of the surface tone underneath**.
