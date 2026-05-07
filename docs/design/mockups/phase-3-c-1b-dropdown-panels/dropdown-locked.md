# `<NavDropdown>` — locked design (Phase 3, Checkpoint 3.C.1b)

**Status:** ✅ owner-approved 2026-05-07.
**Issue:** #1659 · sub-issue 3.C.1b (`SiteHeader` desktop dropdown panels).
**Companion to:** `phase-3-c-header-and-matchstrip/header-locked.md` (sticky `<SiteHeader>` + `<NavTakeover>` mobile drawer).
**Drill record:** `compare.md` (option-by-option trade-offs and rationale, kept as historical record).

## Scope

Desktop (≥ 1024px) dropdown panels for the three submenu parents in `<SiteHeader>`: **Teams** (per senior team — A-Ploeg / B-Ploeg / etc.), **Jeugd**, and **De club**. Mobile drawer (`<NavTakeover>`) covers all submenus on < 1024px and is out of scope.

## Composition

### Trigger

The existing `<SiteHeader>` top-level nav `<li>` for each submenu parent already renders a `▾` chevron. The dropdown panel hangs from this trigger. No visual change to the trigger itself; only its hover state now opens a panel.

### Panel surface (Q1 lock — option C)

- Background: `--color-ink-soft` (`#1f1f1f`) — inverted from the cream masthead.
- Border: 1px solid `--color-ink`.
- Shadow: `--shadow-paper-sm-soft` (`4px 4px 0 0 var(--color-ink-muted)`).
- Position: `position: absolute; top: calc(100% + 1px)` — sits flush against the masthead's 1px ink seam.
- Anchor: per-panel — see Q2 lock.
- Reads as: UI furniture (a clear list of choices), not as a continuation of the masthead.

### Width & position (Q2 lock — option D · content-width hybrid)

| Submenu | Width | Internal layout | Trigger anchor |
| ------- | ----- | --------------- | -------------- |
| Teams (A-Ploeg, B-Ploeg, …) | `280px` | single column | left edge of trigger |
| Jeugd | `280px` | single column | left edge of trigger |
| De club | `560px` | 2 columns (see Q3) | right edge of trigger |

Width is data-driven, not uniform. Implementation MUST add `max-width: calc(100vw - 32px)` on the wide variant to prevent overflow at 1024px viewport.

### Grouping & labels for the wide De club panel (Q3 lock — option γ-short)

Two columns; 6 / 5 distribution.

| Column heading | Items |
| -------------- | ----- |
| **Wie we zijn** | Geschiedenis · Organigram · Bestuur · Jeugdbestuur · KCVV Angels · KCVV Ultras |
| **Praktisch** | Praktische Info · Word vrijwilliger · Cashless clubkaart · Contact · Downloads |

Right-column heading is `Praktisch` (alone — Contact is listed as an item below; "& contact" was redundant).

Heading styling: `font-mono text-[10px] font-semibold tracking-[0.12em] uppercase`, colour `--color-ink-muted`, with a 1px dashed `--color-ink-muted` underline. Wraps at single line (verify "Praktisch" stays on 1 line at 240px column width).

### Animation (Q4 lock — option C · paper-slide)

| Phase | Duration | Easing | Properties |
| ----- | -------- | ------ | ---------- |
| Open | 150ms | ease-out | opacity 0 → 1, transform translateY(-4px) → translateY(0) |
| Close | 100ms | ease-in | opacity 1 → 0, transform translateY(0) → translateY(-2px) |

Reuse Tailwind utilities: `animate-in fade-in slide-in-from-top-1 duration-150` (matches `<NavTakeover>` drawer). Reduced motion (`prefers-reduced-motion: reduce`) collapses to instant.

### Active state inside panel (Q5 lock — option C · filled chevron)

| State | Bullet | Text colour |
| ----- | ------ | ----------- |
| Inactive | `—` em-dash, `--color-ink-muted` | `--color-cream-soft` |
| Hover | `—` em-dash, `--color-jersey-bright` | `--color-cream` |
| Active (`aria-current="page"`) | `▶` filled chevron, `--color-jersey-bright` | `--color-jersey-bright` |

Bullet area width unchanged across states (no padding shift). Glyph swap, not styling change — hover keeps `—`, active replaces it with `▶`.

### Hover-grace timing (Q6 lock — preset B · forgiving)

| Phase | Grace | Total (incl. transition) |
| ----- | ----- | ------------------------ |
| Open | 80ms debounce | 80 + 150ms = 230ms to fully open |
| Close | 200ms after mouse-leave | 200 + 100ms = 300ms to fully close |

Implementation: `setTimeout` / `clearTimeout` keyed off the trigger element. Grace constants — not props.

### Always-on close paths (Q6 lock — required)

| Trigger | Behaviour |
| ------- | --------- |
| Escape key | Close immediately. Refocus the trigger. |
| Click outside (pointerdown) | Close immediately. |
| Click on a panel item | Item navigates → route-change handler closes. |
| Route change (`pathname` change) | Close immediately. |
| Tab past last focusable item | Focus advances to next nav item AND panel closes. (No focus trap — that's mobile-drawer behaviour.) |
| Re-hover within close grace | Cancel pending close. No flicker. |
| Cross-panel hand-off | Opening another panel skips the previous panel's close grace (immediate close), starts the new panel's open grace clean. |

## Slots

| Slot                | Content                                  | Source                                                        |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------- |
| Trigger label       | "A-Ploeg" / "Jeugd" / "De club" / etc.   | `menuItems.ts` MenuItem `label`                               |
| Submenu items       | per-panel                                | `menuItems.ts` MenuItem `children` OR `childGroups`           |
| Group headings      | "Wie we zijn" / "Praktisch"              | `menuItems.ts` MenuItemGroup `label` (new)                    |
| Active state        | jersey-bright + ▶ on current-route item  | path matching against `usePathname()` + `searchParams`        |

## Component composition — reuse existing, share where new

**Existing primitives used:**

| Primitive | Source | Use |
| --------- | ------ | --- |
| `<MonoLabel>` (or its raw classes) | `apps/web/src/components/design-system/MonoLabel/` | Item rows + group headings |
| Existing nav classes from `<SiteHeader>` | `apps/web/src/components/layout/SiteHeader/SiteHeader.tsx` | Trigger label styling |

**New shared primitive (built once, used by `<SiteHeader>`):**

| Component | Purpose | Composition |
| --------- | ------- | ----------- |
| `<NavDropdown>` | Desktop dropdown panel — handles surface, layout, animation, focus, close paths, grace timing | One component, items array prop, `childGroups` opt-in for the wide variant |

API target shape (closed primitive — see `compare.md` §Design A for full justification):

```typescript
// apps/web/src/components/layout/NavDropdown/NavDropdown.tsx
"use client";

export interface NavDropdownItem {
  label: string;
  href: string;
  active?: boolean;        // resolved by caller via isMenuItemActive
}

export interface NavDropdownGroup {
  label: string;           // mono caps heading
  items: readonly NavDropdownItem[];
}

export interface NavDropdownProps {
  /** Trigger label (rendered by `<SiteHeader>`'s `<li>`, just for aria-label here). */
  label: string;
  /** Trigger's own destination — for keyboard click-through. */
  href: string;
  /** Whether the trigger or any descendant child is active. */
  triggerActive?: boolean;
  /** Flat children — narrow 280px panel (Teams, Jeugd). */
  items?: readonly NavDropdownItem[];
  /** Grouped children — wide 560px panel (De club). Prefers over `items` when both passed. */
  itemGroups?: readonly NavDropdownGroup[];
  /** Optional className passthrough. */
  className?: string;
}

export const NavDropdown: (props: NavDropdownProps) => JSX.Element;
```

## Schema dependencies

`apps/web/src/components/layout/menuItems.ts` extends `MenuItem` with an optional `childGroups` field:

```typescript
export interface MenuItemGroup {
  label: string;
  items: MenuItem[];
}

export interface MenuItem {
  label: string;
  href: string;
  children?: MenuItem[];          // existing — flat (Teams, Jeugd)
  childGroups?: MenuItemGroup[];  // new — grouped (De club)
}
```

The `De club` static MenuItem in `menuItems.ts` swaps from `children: [...]` to `childGroups: [...]` with the locked Wie we zijn / Praktisch grouping.

No Sanity schema changes — Sanity menu schema is deferred to `project_sanity_studio_ux_rework`.

## Storybook coverage required

- `<NavDropdown>` — `Layout/NavDropdown`, vr-tagged
  - Stories: closed, open narrow (Teams), open narrow (Jeugd), open wide grouped (De club), open with active item (Geschiedenis), open with hover state (one item hovered)
- VR baselines: 6 stories × 3 viewports = 18 baselines
- Existing `<SiteHeader>` baselines drift — flag updated baselines in PR

## Required (blocking) implementation behaviour

1. **Grace timing constants.** 80ms open / 200ms close. Not configurable. `setTimeout` cleared on opposite event before firing.
2. **Cross-panel hand-off.** Opening B's panel mid-A's-close-grace must immediately close A and start B's open grace cleanly. No two panels visible simultaneously.
3. **Re-hover cancels pending close.** Cursor leaving and re-entering the trigger within the close grace must cancel the close — no flicker.
4. **Keyboard parity.** Enter / Space / ArrowDown on the trigger opens immediately (no open grace). ArrowUp / ArrowDown navigate items. Escape closes + refocuses. Tab past last item closes.
5. **`aria-current="page"`** on the active item carries the load-bearing semantic. Visual chevron is supportive.
6. **`prefers-reduced-motion: reduce`** collapses Q4 transition to instant. Grace timings stay the same (they're behavioural, not motion).
7. **Click-outside via `pointerdown`.** Not `click`. So the panel doesn't catch a click meant for content beneath.
8. **Max-width guard.** Wide panel (560px) anchored right of De club's trigger MUST use `max-width: calc(100vw - 32px)` to prevent overflow at 1024px viewport.

## Open follow-ups (non-blocking)

- **"Hulp" top-level rename / fold-in.** Owner flagged that the top-level `Hulp` nav item could maybe be renamed or folded into the De club tree. Top-level nav IA decision; affects `menuItems.ts` and the `/hulp` route. Surface as a separate spec issue under #1525.
- **Sanity menu schema.** Long-term home for `childGroups` data. Tracked under `project_sanity_studio_ux_rework`. Not blocking #1659.
- **Heading wrap verification.** "Praktisch" (alone) at 11px mono caps in a ~240px column is comfortable, but verify with real Freight + IBM Plex Mono fonts in Storybook before locking VR baselines.
- **Touch device hover.** Q2 locked hover-open. On touch devices, hover doesn't fire reliably; the implementation must accept a tap as equivalent to hover-open. Test on iPad / Android tablet during implementation.

## Approval checklist

- [x] Q1 — Surface = C (Ink-fill cool, ink-soft bg, 1px ink border, soft offset shadow).
- [x] Q2 — Width & position = D (Content-width hybrid: 280 / 280 / 560px).
- [x] Q3 — Grouping & labels = γ-short (Wie we zijn / Praktisch, 6/5 in 2 cols).
- [x] Q4 — Animation = C (Fade + paper-slide, 150ms open / 100ms close, ease-out / ease-in).
- [x] Q5 — Active state = C (Em-dash → ▶ filled chevron, jersey-bright text + glyph).
- [x] Q6 — Close paths = B (Forgiving: 80ms open grace / 200ms close grace) + always-on matrix.
- [x] Trigger = hover-open (locked at start of drill, before Q1).
- [x] Schema extension agreed: `childGroups` field on `MenuItem` in `menuItems.ts`.
- [x] No new design tokens introduced. Reuses existing redesign palette.
- [x] `aria-current="page"` carries semantic weight; visual chevron is supportive.
- [x] Reduced-motion fallback documented (collapse to instant).
- [x] Hulp rename + Sanity menu schema flagged as Phase 3 follow-ups, not blockers.
