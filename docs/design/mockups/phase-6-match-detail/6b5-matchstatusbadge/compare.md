# 6.B.d5 · `<MatchStatusBadge>` — audit drill

**Audit, not a design comparison.** The component already exists (shipped during the MonoLabel pill migration). This drill confirms whether it's in shape for the Phase 6.B `<MatchHero>` corner-stamp use case OR needs refinement.

No HTML mockup file — three sub-decisions surface from the audit; each can be settled in text + a small mockup if owner wants visual confirmation.

## Current state (as shipped)

`apps/web/src/components/match/MatchStatusBadge/MatchStatusBadge.tsx`:

```typescript
// Renders ONLY for these three statuses; returns null for everything else
type BadgeStatus = Extract<MatchStatus, "postponed" | "stopped" | "forfeited">;

const statusLabels: Record<BadgeStatus, string> = {
  postponed: "Uitgesteld",   // long-form Dutch
  stopped: "Gestopt",
  forfeited: "FF",            // abbreviation (the one exception)
};

// Visual: thin wrapper around <MonoLabel variant="pill-…">
//   color "orange" (postponed/stopped) → variant "pill-jersey"
//   color "gray" (no match status uses this today) → variant "pill-cream"
```

`<MonoLabel>` pill variant specs (from `apps/web/src/components/design-system/MonoLabel/MonoLabel.tsx:27-29`):

```text
pill-jersey: bg-jersey text-ink                                     (no border, no shadow)
pill-ink:    bg-ink text-cream                                      (no border, no shadow)
pill-cream:  bg-cream-soft text-ink border border-paper-edge        (1px paper-edge border, no shadow)
```

## Direction D reference

Phase 2 Track B locked Direction D ("Paper chrome, ink emphasis"):

```text
border-2 ink + shadow-paper-sm + bg-cream (or cream-soft) + mono caps + sharp corners
Active state inversion: bg-ink text-cream + shadow-paper-sm-soft
```

Consumers: `<BrandedTabs>`, `<FilterTabs>`, `<HorizontalSlider>` arrows. **NOT a global mandate** — MonoLabel pills carry their own visual language inherited from earlier phases.

## Audit findings

### Finding 1 — Coverage gap vs `matchhero-locked.md` (also: cancelled/postponed data-model bug)

`matchhero-locked.md` spec (d2) says the corner stamp renders on **finished** matches with text **"FT"**. The current component:

- **Returns `null` for `finished`** — no badge at all
- Uses long-form Dutch ("Uitgesteld" / "Gestopt") for postponed / stopped — doesn't match the locked-abbreviations spec
- Uses "FF" for forfeited — matches the spec

**Also discovered during the audit:** the current `MatchStatus` literal **conflates `cancelled` with `postponed`**. From `apps/api/src/psd/transforms.ts:100`:

```typescript
if (cancelled) return "postponed";
if (status === 0) return goalsScored.length > 0 || ... ? "finished" : "scheduled";
if (status === 1) return "forfeited";
if (status === 2) return "postponed";   // PSD code 2 = afgelast
if (status === 3) return "stopped";
return "scheduled";
```

PSD's `cancelled: boolean` is a separate field that signals "definitively dead — won't be played", semantically distinct from `postponed` (PSD code 2 = afgelast = held, may reschedule). The BFF collapses both into `"postponed"`, hiding the distinction.

**BFF schema delta required** — Phase 6.B owns it (per owner direction):

| Touch point | Change |
| --- | --- |
| `packages/api-contract/src/schemas/match.ts` | Add `"cancelled"` to `MatchStatus` literal |
| `apps/api/src/psd/transforms.ts` | Return `"cancelled"` (not `"postponed"`) when `cancelled === true`; preserve PSD code 2 → `"postponed"` |
| `apps/api/src/psd/service.test.ts` + `apps/api/src/handlers/matches.test.ts` | Cover the new branch |
| All consumers branching on `status === "postponed"` | Decide per-consumer whether `cancelled` shares the branch or splits |

Resulting full set: **6 normalised statuses** (`scheduled`, `finished`, `forfeited`, `postponed`, `cancelled`, `stopped`); **5 render badges** (FT, FF, PP, CANC, STOP); `scheduled` doesn't render (kickoff time IS the status).

### Coverage decision: extend `<MatchStatusBadge>` to cover all 5 badge states

**(a)** wins. One component owns all status-stamp rendering. Easier to migrate the visual treatment in one place if/when Direction D evolves. The `<MatchHero>` simply mounts `<MatchStatusBadge status={match.status} />` and the badge decides whether to render and how.

### Finding 2 — Visual treatment vs Direction D

Current MonoLabel pill chrome:

| State | Current visual | Direction D equivalent |
| --- | --- | --- |
| `postponed`, `stopped` | `pill-jersey` — bright jersey-green bg, no border, no shadow | `border-2 ink + shadow-paper-sm + bg-cream + mono caps` |
| `forfeited` (today via `pill-jersey` too) | Same as above | Same as above |
| `finished` (per d2 — net-new) | n/a today | `border-2 ink + shadow-paper-sm + bg-cream` (or jersey-deep for "FT" emphasis) |

The bright-jersey pill diverges from Direction D. It's also a colour choice the redesign has otherwise dialled down (per `[[feedback_no_bright_jersey]]` — `--color-jersey` retired in favour of `--color-jersey-deep`).

**Recommended migration:** swap `pill-jersey` → Direction D paper-chrome treatment. Either as a NEW MonoLabel variant (`pill-paper-chrome` or similar) reusable elsewhere, OR baked into `<MatchStatusBadge>` directly (component-level styling, no new primitive).

### Finding 3 — Copy: long-form Dutch vs abbreviations (owner-corrected)

The d2 spec uses abbreviations for the corner stamp; the current component uses long-form Dutch ("Uitgesteld", "Gestopt"). Owner direction during the audit:

- Abbreviations win
- Specifically: **FT** (finished), **FF** (forfeit), **PP** (postponed), **CANC** (cancelled), **STOP** (stopped)
- `title=` tooltip carries the long-form Dutch for accessibility

Reasoning: abbreviations read like printed-matchday-programme codes — fit the editorial-paper-fanzine vocabulary, save horizontal space on the corner stamp, distinct enough at a glance that readers learn them quickly.

## Owner direction (after the audit conversation)

- **Coverage**: extend `<MatchStatusBadge>` to render all 5 badge states (FT / FF / PP / CANC / STOP). `<MatchHero>` just mounts the badge; the badge owns whether-and-how to render.
- **BFF schema delta**: **Phase 6.B owns it.** The `cancelled` literal extension + transform fix + downstream cascade is part of the eventual Phase 6.B implementation tickets that `/prd-to-issues` will spawn.
- **Copy**: abbreviations. FT / FF / PP / CANC / STOP. `title=` tooltip carries the long-form Dutch for accessibility.
- **Visual treatment**: Direction D paper-chrome base (`border-2 ink + shadow-paper-sm + bg-cream + mono caps`) with **per-status tint** signalling severity. Four tints across five statuses:

| Status | Tint token | Severity tier | Why |
| --- | --- | --- | --- |
| FT | `cream` | Normal | Game played to full time |
| PP | `cream-deep` | No game today (held) | May reschedule |
| FF | `cream-deep` | No game today (dead) | Won't be played; result imposed. Owner-grouped with PP — both read as "no game today" |
| STOP | `warm` | Notice (abnormal) | Game started + ended weird — incomplete result |
| CANC | `card-red` (new token) | Alert (dead) | Definitively dead, won't play, may have no result |

A small HTML mockup confirming the visual treatment lives at `round-1-statusbadge-comparisons.html` — all 5 statuses rendered in 3 treatments (current `pill-jersey`, uniform Direction D, Direction D + status tint).

## Open sub-decision

- **`--color-card-red` token introduction**: CANC's red would be the first redesign use of card-red. Acceptable to introduce, OR downgrade CANC to a desaturated warm-tint variant. Owner picks at d5 lock time.

## Cross-references

- Existing component: `apps/web/src/components/match/MatchStatusBadge/MatchStatusBadge.tsx`
- d2 lock (where "FT" corner stamp originates): `docs/design/mockups/phase-6-match-detail/matchhero-locked.md`
- Direction D source-of-record: `docs/prd/redesign-phase-2.md` §6.5 + `docs/design/mockups/phase-2-track-b/option-d-paper-chrome-ink-emphasis.html`
- MonoLabel pill specs: `apps/web/src/components/design-system/MonoLabel/MonoLabel.tsx`
- Memory: `[[feedback_no_bright_jersey]]` (bright `--color-jersey` retired)
