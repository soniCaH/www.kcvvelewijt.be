# `<MatchStrip>` — locked design (Phase 3, Checkpoint C)

**Status:** ✅ owner-approved 2026-05-05.
**Issue:** #1525 · sub-issue 3.C.2 (`MatchStrip` rework).
**Mockup:** `option-a-matchstrip-detail.html`.
**Companion:** `header-locked.md` + `option-a-header-detail.html` (separate component, separate sub-issue 3.C.1).

## Scope

Persistent next-fixture band rendered on **landing surfaces only** (homepage + section indexes). Not chrome — a landing-page module. Surfaces a single forward-looking match (the next upcoming KCVV-A fixture). Two states: **hidden** (no upcoming match → component returns `null`) and **upcoming** (one rendered visual treatment).

## Composition

### Desktop (≥ 1024px)

Three-column CSS grid (`auto · 1fr · auto`). Cream paper + 1px ink top & bottom rules. ~40px tall. Sits in document flow immediately below the sticky `<SiteHeader>` (per locked Q1 B1: header sticky · strip flows with page).

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  [SiteHeader sticky at top:0 — see header-locked.md]                         │
│──────────────────────────────────────────────────────────────────────────────│ ← 1px ink
│  [K]KCVV vs. RC Mechelen[M]    Competitie | Aftrap | Terrein   Wedstrijddetails →  │
│   └─ fixture (left)             └─ meta (centre)              └─ CTA (right)  │
│──────────────────────────────────────────────────────────────────────────────│ ← 1px ink
                              ↓
                       [page content / hero]
```

### Tablet (769–1023px)

Same composition as desktop — the 3-column grid scales down with the viewport but doesn't restructure. Padding tightens slightly via `clamp()`. The strip stays single-row through the entire tablet range; the column collapse only fires below the mobile breakpoint.

### Mobile (≤ 768px)

Single-column stack: fixture row → meta row (Aftrap value only) → CTA. Total height ~80–90px.

```text
┌──────────────────────────────────────┐
│  [K]KCVV vs. RC Mech.[M]             │
│  Zat 10 mei · 19:30                  │
│  Wedstrijddetails →                  │
└──────────────────────────────────────┘
```

### Why this composition

- **Fixture cluster** mirrors the visual ranking: own shield + own name (full ink) — `vs.` separator (italic display, ink-muted) — opponent name (italic display, ink-muted) — opponent shield (cream-soft fill).
- **Meta cluster** uses the locked Phase 2 caption-over-value pattern (MonoLabel 9/600 caption above body 14/600 value), with 3 cells separated by 1px paper-edge dividers. Order: Competitie · Aftrap · Terrein.
- **CTA** is the canonical primary button at small size (`Wedstrijddetails →`) — same chrome as the locked WORD LID, smaller padding.

## Slots

| Slot            | Content (upcoming state)                          | Source                                                              |
| --------------- | ------------------------------------------------- | ------------------------------------------------------------------- |
| KCVV shield     | Static SVG (heraldic clip-path, jersey-deep fill) | KCVV brand asset                                                    |
| KCVV name       | Static literal `"KCVV"`                           | Always the home identity                                            |
| Versus glyph    | `vs.` (home) or `@` (away)                        | Computed from `match.is_home`                                       |
| Opponent name   | Opposing club name                                | `match.home_team.name` or `match.away_team.name` (whichever ≠ KCVV) |
| Opponent shield | Opposing club logo (or cream-soft placeholder)    | `match.home_team.logo` / `match.away_team.logo`                     |
| Competitie      | Competition / league name                         | `match.competition` (optional — row hides when undefined)           |
| Aftrap          | Date + kickoff time                               | `formatDate(match.date)` + `match.time`                             |
| Terrein         | Venue name                                        | `match.venue` (optional, **desktop only**)                          |
| CTA             | "Wedstrijddetails →" → `/wedstrijden/[id]`        | Real route to match-detail page                                     |

## Component composition — reuse existing, ship one new primitive

**Existing primitives used verbatim:**

| Primitive            | Source                                                    | Use                                                |
| -------------------- | --------------------------------------------------------- | -------------------------------------------------- |
| `<EditorialHeading>` | `apps/web/src/components/design-system/EditorialHeading/` | Team names (display italic 700 16px)               |
| `<MonoLabel>`        | `apps/web/src/components/design-system/MonoLabel/`        | Meta captions (size `sm`, weight 600, 9px caption) |
| `<Button>`           | `apps/web/src/components/design-system/Button/`           | CTA (variant `primary`, size `sm`)                 |

**New shared sub-component (Storybook required):**

| New component    | Purpose                                  | Composition                                                                                                                                                                                                                                       |
| ---------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<ShieldFigure>` | Heraldic shield with team initial / logo | 36×42px desktop / 28×33 mobile, 1.5px ink border, heraldic clip-path. Variants: `kcvv` (jersey-deep fill, cream initial), `opponent` (cream-soft fill, ink initial). Renders an opponent logo URL inside if provided, otherwise initial fallback. |

**Composition glue (no new primitive — just composition rules in the SC):**

| Composition     | What it bundles                                                                                                                               |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Fixture cluster | `<ShieldFigure variant="kcvv">` + KCVV name + `vs.` + opponent name + `<ShieldFigure variant="opponent">`                                     |
| Meta cluster    | 3× (`<MonoLabel>` caption + body value) separated by 1px paper-edge vertical dividers                                                         |
| Strip container | Single CSS grid rule with cream paper + 1px ink top &amp; bottom rules; `display: contents` on parent if needed for layout-slot compatibility |

**Storybook coverage required:**

- `<ShieldFigure>` — `UI/ShieldFigure`, vr-tagged, stories for `kcvv` + `opponent` variants, with-logo + initial-fallback states.
- `<MatchStrip>` — `UI/MatchStrip`, vr-tagged, story for "upcoming" state at desktop + mobile widths. The "hidden" state has zero DOM and is verified at integration test, not Storybook.

## Field-source map

Every rendered element traces to a real source on the existing `UpcomingMatch` shape (BFF `/matches/next` endpoint). **No fabricated data.**

| UI element      | Source                                                 | Notes                                            |
| --------------- | ------------------------------------------------------ | ------------------------------------------------ |
| KCVV shield     | Static SVG asset                                       | jersey-deep fill                                 |
| KCVV name       | Static literal                                         | Always "KCVV"                                    |
| Versus glyph    | `match.is_home` → `"vs."` or `"@"`                     | Computed home/away                               |
| Opponent name   | `match.{home_team\|away_team}.name` (whichever ≠ KCVV) | From PSD via BFF                                 |
| Opponent shield | `match.{home_team\|away_team}.logo` (optional URL)     | Cream-soft placeholder when absent               |
| Competitie      | `match.competition` (optional)                         | Hide row when undefined                          |
| Aftrap          | `formatDate(match.date)` + `match.time`                | "Zat 10 mei · 19:30"                             |
| Terrein         | `match.venue` (optional, desktop only)                 | Hide row when undefined; mobile hides regardless |
| CTA destination | `/wedstrijden/${match.id}`                             | Real route                                       |

## Mobile collapse

- 3-column grid → single-column stack.
- Drop **Competitie** label + **Terrein** row on mobile (still visible on the linked match-detail page).
- Drop MonoLabel captions in meta (only the value shows — saves vertical space).
- Total height ~80–90px below the ~52px header — combined chrome ~140px on landing only.

## Render rule

The strip is rendered by a **landing-layout slot**, not the root layout. Detail-page templates inherit from a layout that omits the slot — the strip is therefore literally absent from those page subtrees in the DOM.

| Page type                                                                    | Has upcoming match | Strip render     |
| ---------------------------------------------------------------------------- | ------------------ | ---------------- |
| Homepage `/`                                                                 | Yes                | **Render**       |
| Homepage `/`                                                                 | No                 | Hidden (`null`)  |
| Section indexes (`/nieuws`, `/evenementen`, `/teams`, `/jeugd`, `/sponsors`) | Yes                | **Render**       |
| Section indexes                                                              | No                 | Hidden (`null`)  |
| Article detail `/nieuws/[slug]` (any articleType)                            | Yes / No           | Hidden (no slot) |
| Single team / player page                                                    | Yes / No           | Hidden           |
| Match detail `/wedstrijden/[id]`                                             | Yes / No           | Hidden           |
| Hero-less utility (`/zoeken`, `/sitemap`, errors)                            | Yes / No           | Hidden           |

**Implementation:** wrap the landing-page templates in a shared layout that includes the `<MatchStrip />` slot below the `<SiteHeader />`. Detail-page templates use a sibling layout without the slot.

## API (target shape)

```typescript
type MatchStripProps = {
  // No caller props — fetches its own data via the existing
  // server-component getFirstTeamNextMatch() helper.
  // Component is server-rendered; if no upcoming match, returns null.
};

// Existing data shape from packages/api-contract/src/schemas/match.ts
// (re-stated for spec clarity — the strip consumes the existing type as-is):
type UpcomingMatch = {
  id: number;
  date: Date;
  time?: string;
  venue?: string;
  competition?: string;
  home_team: { id: number; name: string; logo?: string };
  away_team: { id: number; name: string; logo?: string };
  is_home: boolean;
  // …other fields ignored for the strip view
};
```

## Schema dependencies

**None.** All required fields exist on the current `UpcomingMatch` shape. No Sanity migrations, no API changes for Checkpoint C.

## State matrix (verified)

| State    | Triggered by                                               | Visual treatment                                                 |
| -------- | ---------------------------------------------------------- | ---------------------------------------------------------------- |
| Hidden   | `getFirstTeamNextMatch() === null` OR detail-page template | Component returns `null` — zero DOM, no placeholder, no skeleton |
| Upcoming | One upcoming match available + landing surface             | Single locked visual treatment (see "Composition" above)         |

**Out of scope:** live state (no live data feed), concluded state (strip is forward-looking only), ticketing CTA (KCVV doesn't sell tickets). All confirmed by owner direction 2026-05-05.

## Reuse mandate

1. **Audit before building.** Grep `apps/web/src/components/design-system/` for shield primitives. Audit confirmed: no `<ShieldFigure>` exists today. Building it earns primitive status because (a) the heraldic clip-path geometry is non-trivial and (b) it'll be reused on team pages, match detail pages, and the rankings table.
2. **Extract before duplicating.** Composition glue (fixture cluster, meta cluster) lives inside `<MatchStrip>` itself — not extracted as separate primitives, because they're used only here.
3. **Storybook coverage on every new primitive.** `<ShieldFigure>` ships with `UI/ShieldFigure` story, vr-tagged.
4. **No hidden state.** `<MatchStrip>` is a Server Component fetching via the existing cached helper. No client-side interactivity.

## Open follow-ups (non-blocking)

- **Opponent shield placeholder.** When `away_team.logo` is undefined, render a cream-soft shield with the opponent's initial. Confirm initial-extraction logic (first letter of last word? first letter of first word?) during 3.C.2 implementation.
- **Logo aspect-ratio normalisation.** PSD logos arrive in mixed aspect ratios. Render inside the heraldic clip-path with `object-fit: contain` + a small inset.
- **Long opponent names.** Cap at 18 characters? Truncate with ellipsis? Verify against real PSD data during implementation (look for the longest currently-active opponent name in the database).
- **Section-index pages without an upcoming match.** Component returns `null` — confirm CSS layout doesn't reserve empty space (no min-height on the slot).
- **Defining "landing surfaces" precisely.** Section indexes today: `/nieuws`, `/evenementen`, `/teams`, `/jeugd`, `/sponsors`. Add `/kalender` if/when it ships. Single-team pages (`/ploegen/[slug]`) are detail, not landing.

## Approval checklist

- [x] Q1 — strip in document flow, scrolls away with page (locked B1).
- [x] Q5 — strip rendered on landing surfaces only; detail pages omit (locked G3).
- [x] Q6 — 2-state matrix (hidden / upcoming); component returns `null` in hidden cases.
- [x] No live state, no concluded state, no ticketing CTA (owner direction 2026-05-05).
- [x] No fabricated data — all UI elements trace to existing `UpcomingMatch` fields or static literals.
- [x] No fabricated CTAs — `Wedstrijddetails →` resolves to `/wedstrijden/[id]` (real route).
- [x] No clash with locked event/transfer factStrip (strip is absent from article detail pages).
- [x] Reuse mandate captured — existing primitives + new `<ShieldFigure>` shared sub-component, Storybook-covered.
- [x] No schema migrations required for Checkpoint C.
