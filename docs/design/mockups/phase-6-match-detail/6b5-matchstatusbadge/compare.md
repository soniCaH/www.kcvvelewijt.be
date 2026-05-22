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

### Finding 1 — Coverage gap vs `matchhero-locked.md`

`matchhero-locked.md` spec (d2) says the corner stamp renders on **finished** matches with text **"FT"** (plus the existing FF / AFG / STOP for edge states). The current component:

- **Returns `null` for `finished`** — no badge at all
- Uses long-form Dutch ("Uitgesteld" / "Gestopt") for postponed / stopped — doesn't match d2's abbreviations ("AFG" / "STOP")
- Uses "FF" for forfeited — matches d2

This is a real spec gap from d2. The hero needs the badge to handle `finished` (the dominant case for any post-kickoff page render). Either:

- **(a)** Extend `<MatchStatusBadge>` to cover `finished` + render "FT", OR
- **(b)** Have `<MatchHero>` render the FT stamp itself via a plain `<MonoLabel>` and only delegate to `<MatchStatusBadge>` for the edge states

(a) is more consistent (one component owns all status-stamp rendering); (b) is more separated (the badge's API stays narrow — only "this match needs special attention").

### Finding 2 — Visual treatment vs Direction D

Current MonoLabel pill chrome:

| State | Current visual | Direction D equivalent |
| --- | --- | --- |
| `postponed`, `stopped` | `pill-jersey` — bright jersey-green bg, no border, no shadow | `border-2 ink + shadow-paper-sm + bg-cream + mono caps` |
| `forfeited` (today via `pill-jersey` too) | Same as above | Same as above |
| `finished` (per d2 — net-new) | n/a today | `border-2 ink + shadow-paper-sm + bg-cream` (or jersey-deep for "FT" emphasis) |

The bright-jersey pill diverges from Direction D. It's also a colour choice the redesign has otherwise dialled down (per `[[feedback_no_bright_jersey]]` — `--color-jersey` retired in favour of `--color-jersey-deep`).

**Recommended migration:** swap `pill-jersey` → Direction D paper-chrome treatment. Either as a NEW MonoLabel variant (`pill-paper-chrome` or similar) reusable elsewhere, OR baked into `<MatchStatusBadge>` directly (component-level styling, no new primitive).

### Finding 3 — Copy: long-form Dutch vs abbreviations

The d2 spec uses abbreviations ("FT", "FF", "AFG", "STOP") for the corner stamp; the current component uses long-form Dutch ("Uitgesteld", "Gestopt"). Trade-off:

- **Abbreviations** read like printed-matchday-programme codes — fit the editorial-paper-fanzine vocabulary. Saves horizontal space on the corner stamp. Less accessible (readers don't always know "AFG" = afgelast).
- **Long-form Dutch** is clear and accessible. Risks looking like a generic UI badge (which it currently does).

Worth noting: PSD's own data uses the numeric status codes (0/1/2/3) which we already normalise to English literals (`scheduled`/`finished`/`forfeited`/`postponed`/`stopped`). The user-facing copy is fully our call.

## Sub-decisions for the owner

| # | Decision | Recommendation | Why |
| --- | --- | --- | --- |
| **1** | Coverage: extend the badge to render `finished` ("FT") inside `<MatchStatusBadge>` (a) OR have `<MatchHero>` render FT itself via plain `<MonoLabel>` and delegate to the badge for edge states only (b) | **(a)** — extend the badge | One component owns all status-stamp rendering. Easier to migrate the visual treatment in one place if/when Direction D evolves. |
| **2** | Visual treatment: keep current `pill-jersey` / `pill-cream` MonoLabel chrome (i) OR migrate to Direction D paper-chrome (ii) | **(ii)** — migrate to Direction D | `pill-jersey` uses the retired bright-jersey colour (see `[[feedback_no_bright_jersey]]`). Direction D matches `<MatchHero>`'s editorial-paper vocabulary directly. |
| **3** | Copy: long-form Dutch ("Uitgesteld" / "Gestopt") (i) OR abbreviations ("AFG" / "STOP") (ii) | **(ii)** — abbreviations | Fits the matchday-printed-programme vocabulary. Saves space on the corner stamp. Tooltip on hover can give the long-form for accessibility. |

If owner agrees with all three recommendations, the d5 lock captures:

- `<MatchStatusBadge>` extended to cover `finished` (renders "FT")
- New visual chrome on the badge: `border-2 border-ink shadow-paper-sm bg-cream` + mono caps (Direction D)
- Edge state copy: "FF" / "AFG" / "STOP" abbreviations + `title=` long-form for tooltip accessibility
- Component-level styling (no new MonoLabel variant; baked into MatchStatusBadge directly to keep the surface area narrow)

If owner disagrees with any of (1) / (2) / (3), a small HTML mockup can render the alternatives for visual confirmation in a round 2.

## Cross-references

- Existing component: `apps/web/src/components/match/MatchStatusBadge/MatchStatusBadge.tsx`
- d2 lock (where "FT" corner stamp originates): `docs/design/mockups/phase-6-match-detail/matchhero-locked.md`
- Direction D source-of-record: `docs/prd/redesign-phase-2.md` §6.5 + `docs/design/mockups/phase-2-track-b/option-d-paper-chrome-ink-emphasis.html`
- MonoLabel pill specs: `apps/web/src/components/design-system/MonoLabel/MonoLabel.tsx`
- Memory: `[[feedback_no_bright_jersey]]` (bright `--color-jersey` retired)
