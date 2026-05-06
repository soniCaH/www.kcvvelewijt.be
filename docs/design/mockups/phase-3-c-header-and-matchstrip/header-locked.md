# `<SiteHeader>` — locked design (Phase 3, Checkpoint C)

**Status:** ✅ owner-approved 2026-05-05.
**Issue:** #1525 · sub-issue 3.C.1 (`SiteHeader` rework).
**Mockup:** `option-a-header-detail.html`.
**Companion:** `matchstrip-locked.md` + `option-a-matchstrip-detail.html` (separate component, separate sub-issue 3.C.2).

> **★ Reuse audit correction (2026-05-05):** the `<IconButton>` primitive originally proposed in this spec is **not** built. Audit against the design-system barrel found that `<Button variant="ghost" size="sm">` already provides the 1.5px ink stroke + sharp corners + canonical press-down hover that the search · hamburger · drawer ✕ affordances need. Search uses `<Button variant="ghost" size="sm">` with a Phosphor `MagnifyingGlass` icon child; hamburger uses the same with a custom 3-bar SVG (or Phosphor `List`); drawer ✕ uses Phosphor `X`. The reuse map, reuse mandate, and approval checklist below have been updated to reflect this; **canonical source of truth: Phase 3 PRD §8b**.

## Scope

Site-wide masthead rendered in the root layout. Sticky at `top: 0` on every page. Three states across viewports: desktop default, mobile closed, mobile drawer-open. Direction A vocabulary (Classic Newsstand) — cream paper, 1px ink rules, IBM Plex Mono caps nav, Playfair italic 900 wordmark with jersey-deep accent on `Elewijt`.

## Composition

### Desktop (≥ 1024px)

Three-column CSS grid (`auto · 1fr · auto`). Sticky at `top: 0`, ~64px tall.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  KCVV Elewijt[SINDS 1909]   Home Nieuws Even Teams▾ Jeugd▾ … De club▾   ⌕ Word lid  │
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
| Wordmark         | `KCVV Elewijt` + `SINDS 1909` (sup)    | Static; jersey-deep accent on `Elewijt`                                                                     |
| Nav              | 8 items, 3 with submenu carets         | Hard-coded in `apps/web/src/components/layout/menuItems.ts` + dynamic teams from `TeamRepository.findAll()` |
| Search           | `⌕` icon button                        | Click → `/zoeken`                                                                                           |
| WORD LID         | ink-fill primary button (desktop only) | → `/club/inschrijven`                                                                                       |
| Mobile hamburger | 1.5px ink-outlined icon button         | Click → opens drawer                                                                                        |
| Drawer Word lid  | Full-width hero primary button         | → `/club/inschrijven` (mobile-only placement)                                                               |

## Component composition — reuse existing, share where new

**Existing primitives used verbatim:**

| Primitive            | Source                                                    | Use                                                                                                         |
| -------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `<EditorialHeading>` | `apps/web/src/components/design-system/EditorialHeading/` | Wordmark (display italic 900 + jersey-deep accent)                                                          |
| `<MonoLabel>`        | `apps/web/src/components/design-system/MonoLabel/`        | Nav links (size `sm`, weight 600, tracking 0.04em)                                                          |
| `<Button>` `primary` | `apps/web/src/components/design-system/Button/`           | WORD LID (desktop) + drawer Word lid hero (mobile)                                                          |
| `<Button>` `ghost`   | `apps/web/src/components/design-system/Button/`           | Icon-only affordances at `size="sm"` with Phosphor icon child — search · hamburger · drawer ✕ (per PRD §8b) |

**New shared sub-components (built once, used by SiteHeader + reusable elsewhere):**

| New component        | Purpose                             | Composition                                                            |
| -------------------- | ----------------------------------- | ---------------------------------------------------------------------- |
| `<NavTakeover>`      | Full-viewport mobile drawer surface | Cream paper, no backdrop, top bar (wordmark + ✕), nav list + hero CTA  |
| `<NavTakeover.Item>` | Drawer nav row                      | Playfair italic 700 22px + bottom paper-edge rule + optional `▾` glyph |

**Storybook coverage required (per reuse mandate):**

- `<NavTakeover>` — `UI/NavTakeover`, vr-tagged, stories for closed (no DOM), open default, open with one submenu expanded
- `<NavTakeover.Item>` — `UI/NavTakeover/Item`, vr-tagged, stories for leaf, submenu, active states
- _(no separate `<IconButton>` story — search · hamburger · drawer ✕ all reuse the existing `<Button>` ghost variant + Phosphor icon child; covered by `<Button>`'s existing baseline.)_

## Field-source map

| UI element       | Source                                                   | Notes                                                                       |
| ---------------- | -------------------------------------------------------- | --------------------------------------------------------------------------- |
| Wordmark text    | Static literal `"KCVV Elewijt"`                          | Not from Sanity                                                             |
| `SINDS 1909`     | Static literal                                           | Mono caps superscript, ink-muted                                            |
| Static nav items | `apps/web/src/components/layout/menuItems.ts`            | Home · Nieuws · Evenementen · Sponsors · Hulp · De club (+ sub-items)       |
| Senior teams     | `TeamRepository.findAll()` filtered by no-`age` prefix   | Dynamic; rendered inside Teams submenu                                      |
| Youth teams      | `TeamRepository.findAll()` filtered by `age` prefix `U…` | Dynamic; rendered inside Jeugd submenu                                      |
| Search action    | Static literal `/zoeken`                                 | Real route                                                                  |
| WORD LID action  | Static literal `/club/inschrijven`                       | Real route                                                                  |
| Active nav state | Path matching against current route                      | jersey-deep colour + 2px underline (desktop) or jersey-deep colour (drawer) |

## Mobile collapse

- **Closed default** at `≤ 768px`: hamburger · wordmark · search (no inline WORD LID).
- **Wordmark scales**: 26px desktop → 20px mobile; `SINDS 1909` superscript dropped.
- **Drawer open** triggers a full-viewport takeover (`<NavTakeover>`); body scroll locks while open. Close paths: ✕ button, Escape key, click on a nav item that navigates.

## API (target shape)

```typescript
// `<SiteHeader>` is a Client Component (top of file: `"use client"`) so it can
// call `usePathname()` for active-item detection — same approach as the
// existing `PageHeader.tsx` it replaces. Senior + youth team nav items are
// server-fetched in the root layout (Server Component, calls
// `TeamRepository.findAll()`) and passed in as props.
type SiteHeaderProps = {
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

1. **Audit before building.** Icon-only affordances (search, hamburger, drawer ✕) reuse `<Button variant="ghost" size="sm">` with a Phosphor icon child — the ghost variant already provides the 1.5px ink stroke, sharp corners, and canonical press-down hover (per Phase 3 PRD §8b — canonical source of truth). No new `<IconButton>` primitive.
2. **Extract before duplicating.** `<NavTakeover>` + `<NavTakeover.Item>` are two new primitives, each used 1× today. They earn their primitive status because (a) their behaviour is non-trivial (focus management, body-scroll lock, escape handler) and (b) they'll be reused by future drawer-style surfaces (filter sheets, command palettes, etc).
3. **Storybook coverage on every new primitive.** `<NavTakeover>` and `<NavTakeover.Item>` each ship with `<Name>.stories.tsx` (title `UI/<Name>`), VR-tagged, `vr` tag in meta. The reused `<Button>` variants are already covered by the existing `<Button>` baseline.
4. **Server / Client split.** `<SiteHeader>` is a **Client Component** (uses `usePathname()` for active-item detection — same as the existing `PageHeader.tsx` it replaces). Senior/youth team data is server-fetched in the root layout (`TeamRepository.findAll()`) and passed in as props; nothing else is fetched inside `<SiteHeader>`. Drawer state (open/close, focus management, body-scroll lock) lives in `<NavTakeover>`, also a Client Component. No `useRouter()` is needed — navigation happens via standard `<Link>` / `<a>` clicks.

## Required (blocking) implementation behaviour

- **a11y focus trap.** When drawer opens, focus moves to the first nav item; on close, focus returns to the hamburger (the `<Button variant="ghost" size="sm">` that triggered open). Tab-cycle is trapped inside `<NavTakeover>` until close. Must coexist with the Drawer scroll lock (`document.body.style.overflow = 'hidden'`) and the locked Q1 sticky `<PageHeader>` — sticky behaviour must not fight scroll lock or focus management. Active route handling stays on `usePathname()` inside `<NavTakeover.Item>` (same approach as existing `PageHeader`).

## Open follow-ups (non-blocking)

- **Production search glyph.** Mockup uses typographic `⌕`; production should swap to Phosphor `MagnifyingGlass` (or equivalent) — confirm during 3.C.1 implementation.
- **Sub-item lazy reveal.** Drawer submenu sub-items render lazily (not in initial DOM) to keep the closed list short on small phones. State managed in `<NavTakeover.Item>` open prop.

## Approval checklist

- [x] Q1 — header sticky at `top: 0` on every page (locked B1).
- [x] Q2 — search is icon-only, click → `/zoeken` (locked C1).
- [x] Q3 — WORD LID hidden on mobile; full `KCVV Elewijt` wordmark preserved (locked D3).
- [x] Q4 — full-screen takeover drawer; Playfair italic 22px nav; `▾` only on submenu items; Word lid as hero block (locked E2 refined).
- [x] No 01-08 numbering on drawer items (per `feedback_no_decorative_nav_ornaments`).
- [x] No fabricated nav items — all 8 trace to `menuItems.ts` + dynamic team data.
- [x] No fabricated CTA destinations — `/zoeken` and `/club/inschrijven` are real routes.
- [x] Reuse mandate captured — existing primitives (`<EditorialHeading>` · `<MonoLabel>` · `<Button>` primary + ghost) + new `<NavTakeover>` and `<NavTakeover.Item>` shared sub-components, Storybook-covered. Icon-only affordances reuse `<Button variant="ghost" size="sm">` with Phosphor icon child per Phase 3 PRD §8b — no new `<IconButton>` primitive.
- [x] No schema migrations required for Checkpoint C.
