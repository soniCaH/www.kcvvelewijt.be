# `<SiteHeader>` — locked design (Phase 3, Checkpoint C)

**Status:** ✅ owner-approved 2026-05-05.
**Issue:** #1525 · sub-issue 3.C.1 (`SiteHeader` rework).
**Mockup:** `option-a-header-detail.html`.
**Companion:** `matchstrip-locked.md` + `option-a-matchstrip-detail.html` (separate component, separate sub-issue 3.C.2).

> **★ Reuse audit correction (2026-05-05):** the `<IconButton>` primitive originally proposed in this spec is **not** built. Audit against the design-system barrel found that `<Button variant="ghost" size="sm">` already provides the 1.5px ink stroke + sharp corners + canonical press-down hover that the search · hamburger · drawer ✕ affordances need. Search uses `<Button variant="ghost" size="sm">` with a Phosphor `MagnifyingGlass` icon child; hamburger uses the same with a custom 3-bar SVG (or Phosphor `List`); drawer ✕ uses Phosphor `X`. The reuse map and approval checklist below still mention `<IconButton>` for historical accuracy of the drilling; **the canonical source of truth is the Phase 3 PRD §8b**.

## Scope

Site-wide masthead rendered in the root layout. Sticky at `top: 0` on every page. Three states across viewports: desktop default, mobile closed, mobile drawer-open. Direction A vocabulary (Classic Newsstand) — cream paper, 1px ink rules, IBM Plex Mono caps nav, Playfair italic 900 wordmark with jersey-deep accent on `Elewijt`.

## Composition

### Desktop (≥ 1024px)

Three-column CSS grid (`auto · 1fr · auto`). Sticky at `top: 0`, ~64px tall.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  KCVV Elewijt[SINDS 1948]   Home Nieuws Even Teams▾ Jeugd▾ … De club▾   ⌕ Word lid  │
│  └─ wordmark (left)         └─ nav (centred, 8 items)                  └─ actions (right)  │
├──────────────────────────────────────────────────────────────────────────────┤
                          ↓  1px ink seam
                          ↓
                    [page content / hero]
```

### Mobile — closed (≤ 768px)

Three children inline: hamburger (left), wordmark (centre, full `KCVV Elewijt` with jersey-deep accent intact), search icon (right). **No `Word lid` button** — that lives only inside the open drawer.

```text
┌──────────────────────────────────────┐
│  ☰   KCVV Elewijt          ⌕         │
│  └─ hamburger  └─ wordmark  └─ search │
└──────────────────────────────────────┘
```

### Mobile — drawer open

Full-viewport takeover. Wordmark stays at top in the same slot; ✕ close button replaces the hamburger (inverted: ink fill, cream glyph). Nav rendered as Playfair italic 700 22px display lines with paper-edge bottom rules between each row. Word lid as a full-width hero block below the nav list.

```text
┌──────────────────────────────────────┐
│  KCVV Elewijt              [✕]       │   ← top bar (same height as closed)
├──────────────────────────────────────┤
│  Home                                │
│  Nieuws                              │   ← jersey-deep (active)
│  Evenementen                         │
│  Teams                            ▾  │   ← submenu indicator
│  Jeugd                            ▾  │
│  Sponsors                            │
│  Hulp                                │
│  De club                          ▾  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │       WORD LID                 │  │   ← hero CTA, ink fill, paper shadow
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

### Right-slot rule (drawer items)

| Type                                                  | Right slot                                                                |
| ----------------------------------------------------- | ------------------------------------------------------------------------- |
| Submenu item (Teams, Jeugd, De club)                  | `▾` mono glyph                                                            |
| Leaf item (Home, Nieuws, Evenementen, Sponsors, Hulp) | nothing                                                                   |
| Active item                                           | colour signal (jersey-deep) only — no underline, no number, no `★` suffix |

Per `feedback_no_decorative_nav_ornaments`: only functional indicators belong in the right slot. The earlier 01–08 numbering on the open-state mockup was ornamental noise; removed.

## Slots

| Slot             | Content                                | Source                                                                                                      |
| ---------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Wordmark         | `KCVV Elewijt` + `SINDS 1948` (sup)    | Static; jersey-deep accent on `Elewijt`                                                                     |
| Nav              | 8 items, 3 with submenu carets         | Hard-coded in `apps/web/src/components/layout/menuItems.ts` + dynamic teams from `TeamRepository.findAll()` |
| Search           | `⌕` icon button                        | Click → `/zoeken`                                                                                           |
| WORD LID         | ink-fill primary button (desktop only) | → `/club/inschrijven`                                                                                       |
| Mobile hamburger | 1.5px ink-outlined icon button         | Click → opens drawer                                                                                        |
| Drawer Word lid  | Full-width hero primary button         | → `/club/inschrijven` (mobile-only placement)                                                               |

## Component composition — reuse existing, share where new

**Existing primitives used verbatim:**

| Primitive            | Source                                                    | Use                                                |
| -------------------- | --------------------------------------------------------- | -------------------------------------------------- |
| `<EditorialHeading>` | `apps/web/src/components/design-system/EditorialHeading/` | Wordmark (display italic 900 + jersey-deep accent) |
| `<MonoLabel>`        | `apps/web/src/components/design-system/MonoLabel/`        | Nav links (size `sm`, weight 600, tracking 0.04em) |
| `<Button>`           | `apps/web/src/components/design-system/Button/`           | WORD LID (variant `primary`); drawer Word lid hero |

**New shared sub-components (built once, used by SiteHeader + reusable elsewhere):**

| New component        | Purpose                                                  | Composition                                                            |
| -------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------- |
| `<IconButton>`       | Outlined icon affordance — search + hamburger + drawer ✕ | 1.5px ink stroke, sharp corners, press-down hover (canonical)          |
| `<NavTakeover>`      | Full-viewport mobile drawer surface                      | Cream paper, no backdrop, top bar (wordmark + ✕), nav list + hero CTA  |
| `<NavTakeover.Item>` | Drawer nav row                                           | Playfair italic 700 22px + bottom paper-edge rule + optional `▾` glyph |

**Storybook coverage required (per reuse mandate):**

- `<IconButton>` — `UI/IconButton`, vr-tagged, stories for default + hover-press states
- `<NavTakeover>` — `UI/NavTakeover`, vr-tagged, stories for closed (no DOM), open default, open with one submenu expanded
- `<NavTakeover.Item>` — `UI/NavTakeover/Item`, vr-tagged, stories for leaf, submenu, active states

## Field-source map

| UI element       | Source                                                   | Notes                                                                       |
| ---------------- | -------------------------------------------------------- | --------------------------------------------------------------------------- |
| Wordmark text    | Static literal `"KCVV Elewijt"`                          | Not from Sanity                                                             |
| `SINDS 1948`     | Static literal                                           | Mono caps superscript, ink-muted                                            |
| Static nav items | `apps/web/src/components/layout/menuItems.ts`            | Home · Nieuws · Evenementen · Sponsors · Hulp · De club (+ sub-items)       |
| Senior teams     | `TeamRepository.findAll()` filtered by no-`age` prefix   | Dynamic; rendered inside Teams submenu                                      |
| Youth teams      | `TeamRepository.findAll()` filtered by `age` prefix `U…` | Dynamic; rendered inside Jeugd submenu                                      |
| Search action    | Static literal `/zoeken`                                 | Real route                                                                  |
| WORD LID action  | Static literal `/club/inschrijven`                       | Real route                                                                  |
| Active nav state | Path matching against current route                      | jersey-deep colour + 2px underline (desktop) or jersey-deep colour (drawer) |

## Mobile collapse

- **Closed default** at `≤ 768px`: hamburger · wordmark · search (no inline WORD LID).
- **Wordmark scales**: 26px desktop → 20px mobile; `SINDS 1948` superscript dropped.
- **Drawer open** triggers a full-viewport takeover (`<NavTakeover>`); body scroll locks while open. Close paths: ✕ button, Escape key, click on a nav item that navigates.

## API (target shape)

```typescript
type SiteHeaderProps = {
  // Reads current route via Next.js navigation hooks; no caller props needed for that.
  // Senior + youth team nav items are server-fetched in the root layout and passed as props:
  seniorTeams: TeamNavVM[]; // existing shape from PageHeader
  youthTeams: TeamNavVM[];
};

type NavTakeoverProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // children = composed nav items + hero CTA via <NavTakeover.Item> + <Button>
};

type NavTakeoverItemProps = {
  label: string;
  href?: string; // omit when item is a submenu trigger (no leaf navigation)
  hasSubmenu?: boolean; // shows ▾ glyph
  active?: boolean; // jersey-deep colour
  children?: React.ReactNode; // submenu items rendered indented + collapsed
};
```

## Schema dependencies

**None.** Navigation is hard-coded in `menuItems.ts`; no Sanity menu schema exists, and no migration is needed for Checkpoint C. (The Sanity Studio UX rework — `project_sanity_studio_ux_rework` — may surface a future menu schema; that's out of scope here.)

## Reuse mandate

1. **Audit before building.** Before writing `<IconButton>`, grep `apps/web/src/components/design-system/` for an existing primitive that fits. (Audit confirmed none — `IconButton` does not exist today; landing it as a primitive serves search, hamburger, drawer ✕, and any future outlined-icon affordance.)
2. **Extract before duplicating.** `<NavTakeover>` + `<NavTakeover.Item>` are two new primitives, but each is used 1× today. They earn their primitive status because (a) their behaviour is non-trivial (focus management, body-scroll lock, escape handler) and (b) they'll be reused by future drawer-style surfaces (filter sheets, command palettes, etc).
3. **Storybook coverage on every new primitive.** Each new component ships with `<Name>.stories.tsx` (title `UI/<Name>`), VR-tagged, `vr` tag in meta.
4. **No hidden state.** `<SiteHeader>` is a Server Component fed by the root layout's data fetch; client-side interactivity (drawer open/close) lives in `<NavTakeover>` only.

## Open follow-ups (non-blocking)

- **Production search glyph.** Mockup uses typographic `⌕`; production should swap to Phosphor `MagnifyingGlass` (or equivalent) — confirm during 3.C.1 implementation.
- **Drawer scroll lock.** When drawer is open, `document.body.style.overflow = 'hidden'`. Coordinate with the locked Q1 sticky header (sticky behaviour shouldn't fight scroll lock).
- **Active route detection.** Existing `PageHeader` does this via `usePathname()`; preserve the same approach.
- **Sub-item lazy reveal.** Drawer submenu sub-items render lazily (not in initial DOM) to keep the closed list short on small phones. State managed in `<NavTakeover.Item>` open prop.
- **a11y focus trap.** When drawer opens, focus moves to the first nav item; on close, focus returns to the hamburger. Tab-cycle inside the drawer (focus trap) until close.

## Approval checklist

- [x] Q1 — header sticky at `top: 0` on every page (locked B1).
- [x] Q2 — search is icon-only, click → `/zoeken` (locked C1).
- [x] Q3 — WORD LID hidden on mobile; full `KCVV Elewijt` wordmark preserved (locked D3).
- [x] Q4 — full-screen takeover drawer; Playfair italic 22px nav; `▾` only on submenu items; Word lid as hero block (locked E2 refined).
- [x] No 01-08 numbering on drawer items (per `feedback_no_decorative_nav_ornaments`).
- [x] No fabricated nav items — all 8 trace to `menuItems.ts` + dynamic team data.
- [x] No fabricated CTA destinations — `/zoeken` and `/club/inschrijven` are real routes.
- [x] Reuse mandate captured — existing primitives + new `<IconButton>`, `<NavTakeover>`, `<NavTakeover.Item>` shared sub-components, all Storybook-covered.
- [x] No schema migrations required for Checkpoint C.
