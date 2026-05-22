# 6.B.d5 · `<MatchStatusBadge>` — LOCKED

**Decision:** **Treatment 3** (Direction D paper-chrome + per-status tint), locked 2026-05-22.

The component is extended to cover all 5 badge-rendering statuses (FT / FF / PP / CANC / STOP). It uses the locked Phase 2 Direction D paper-chrome base (`border-2 ink + shadow-paper-sm + bg-cream + mono caps`) with a per-status background tint that signals severity. Phase 6.B implementation owns the BFF schema delta required to surface `cancelled` as distinct from `postponed`.

## What this locks

| Decision | Locked value |
| --- | --- |
| Badge-rendering statuses | 5 — `finished`, `forfeited`, `postponed`, `cancelled`, `stopped` |
| Non-rendering statuses | 1 — `scheduled` (kickoff time in `<MatchHero>` IS the status) |
| Visual base | Direction D paper-chrome: `border-2 border-ink shadow-paper-sm` + mono caps + sharp corners + small padding (`5px 8px`) |
| Per-status tint | See severity table below |
| Copy | Abbreviations: `FT` / `FF` / `PP` / `CANC` / `STOP` |
| Accessibility | `title=` attribute carries long-form Dutch on every badge (`"Voltijd"` / `"Forfait"` / `"Uitgesteld"` / `"Geannuleerd"` / `"Gestopt"`) |
| API | `<MatchStatusBadge status={match.status} />` — the badge owns whether-and-how to render. `<MatchHero>` mounts it unconditionally. |
| Placement on `<MatchHero>` | Corner stamp, top-right, slight overlap with the card top border (per `matchhero-locked.md`) |
| New design-system primitive | **None** — chrome is styled inline on the existing `<MatchStatusBadge>` (no new `<MonoLabel>` variant; keeps the surface narrow) |
| BFF schema delta | **In Phase 6.B scope** — extend `MatchStatus` literal + update `transforms.ts` to stop collapsing `cancelled` into `postponed`. See "BFF schema delta" below. |
| `--color-card-red` token | **Introduced** as part of this lock — new design-system token for the CANC severity tier. Reusable elsewhere if a system-alert vocabulary lands later. |

## Severity table

| Status | Abbreviation | Tint token | Severity tier | Why |
| --- | --- | --- | --- | --- |
| `finished` | **FT** | `cream` | Normal | Game played to full time |
| `postponed` | **PP** | `cream-deep` | No game today (held) | May reschedule |
| `forfeited` | **FF** | `cream-deep` | No game today (dead-end) | Won't be played; result imposed. Owner-grouped with PP — both read as "no game today" |
| `stopped` | **STOP** | `warm` | Notice (abnormal) | Game started + ended weird — incomplete result |
| `cancelled` | **CANC** | `card-red` | Alert (dead) | Definitively dead, won't play, may have no result |
| `scheduled` | — (no badge) | — | — | Upcoming — kickoff time in hero conveys the state |

Four tints across five statuses. Reader sees severity at a glance.

## BFF schema delta (in Phase 6.B scope)

Today's `MatchStatus` literal lumps `cancelled` into `postponed` (see `apps/api/src/psd/transforms.ts:100`):

```typescript
if (cancelled) return "postponed";
```

This hides a real semantic distinction — PSD's `cancelled: boolean` means "definitively dead" while PSD code 2 (`afgelast`) means "held, may reschedule". The d5 lock requires the distinction to survive into the normalised type.

**Implementation tickets (spawned by `/prd-to-issues` when the PRD lands):**

| File | Change |
| --- | --- |
| `packages/api-contract/src/schemas/match.ts` | Add `"cancelled"` to the `MatchStatus` literal: `"scheduled" \| "finished" \| "forfeited" \| "postponed" \| "cancelled" \| "stopped"` |
| `apps/api/src/psd/transforms.ts` | Return `"cancelled"` when `cancelled === true`; preserve PSD code 2 → `"postponed"`. Update the JSDoc comment block. |
| `apps/api/src/psd/service.test.ts` | Add a test case: `cancelled: true` + PSD code 0 → status === `"cancelled"` |
| `apps/api/src/handlers/matches.test.ts` | Update fixtures that exercise the postponed branch — confirm cancelled now flows separately |
| `apps/web/src/components/match/MatchStatusBadge/MatchStatusBadge.tsx` | Extend `BadgeStatus` from 3 → 5 statuses; add the per-status tint logic |
| `apps/web/src/components/match/MatchStatusBadge/MatchStatusBadge.test.tsx` | Branch test per status |
| `apps/web/src/components/match/MatchStatusBadge/MatchStatusBadge.stories.tsx` | Story per status; meta `tags: ["autodocs", "vr"]` |
| `apps/web/src/app/globals.css` (or wherever tokens live) | Introduce `--color-card-red` |

## Rejected alternatives

- **T1 — Current `pill-jersey`**: rejected. Uses the retired bright-jersey colour (`feedback_no_bright_jersey`). All edge statuses look visually identical. Doesn't align with the editorial paper-card vocabulary that the rest of `<MatchHero>` uses.
- **T2 — Direction D uniform**: rejected. Aligns with the editorial vocabulary but provides no per-status severity signal. The CANC alert would visually equal the routine FT — loses an important reader signal.

## Knock-on resolutions

**`<MatchHero>` simplifies.** The hero now just mounts `<MatchStatusBadge status={match.status} />`. No per-state special-casing; the badge owns rendering decisions. `matchhero-locked.md` status table updates to 5 statuses + reference this lock.

**`<MatchTeaser>` / `<MatchResultRow>` / `<MatchStripClient>` cross-cutting components** (drills 6.B.d6 / d7 / d8) inherit the same badge. If they currently render status differently, they migrate to `<MatchStatusBadge>` in their own implementation tickets.

**`<MonoLabel>` pill variants stay untouched.** No new variant added; chrome is local to `<MatchStatusBadge>`. Other consumers of `pill-jersey` / `pill-ink` / `pill-cream` are unaffected.

**`title=` Dutch tooltip** on each badge for accessibility — abbreviations read as printed-matchday-programme codes but tooltips preserve the full meaning for screen readers + new readers.

## Cross-references

- 6.B.d2 MatchHero lock (badge consumer): `matchhero-locked.md` — needs an update for the 5-status set; tracked in this same drill commit
- Direction D source-of-record: `docs/prd/redesign-phase-2.md` §6.5 + `docs/design/mockups/phase-2-track-b/option-d-paper-chrome-ink-emphasis.html`
- BFF source files: `packages/api-contract/src/schemas/match.ts`, `apps/api/src/psd/transforms.ts`
- Existing component: `apps/web/src/components/match/MatchStatusBadge/`
- d5 drill artifacts:
  - `6b5-matchstatusbadge/compare.md`
  - `round-1-statusbadge-comparisons.html`
- Memory: `[[feedback_no_bright_jersey]]` (bright `--color-jersey` retired)

## Drill state after this lock

| Drill | Subject | Status |
| --- | --- | --- |
| 6.B.d0 | Data reality | ✅ LOCKED |
| 6.B.d1 | Page composition | ✅ LOCKED |
| 6.B.d2 | `<MatchHero>` shape | ✅ LOCKED |
| 6.B.d3 | `<MatchLineupSection>` + `<MatchEventsSection>` | ✅ LOCKED |
| 6.B.d4 | `<MatchArticleLinkCard>` | ✅ LOCKED (build deferred to post-#1470) |
| 6.B.d5 | `<MatchStatusBadge>` Direction-D + tint | ✅ **LOCKED (this doc — T3, 5 statuses, severity tint)** |
| 6.B.d6 | `<MatchTeaser>` reskin (default + compact) | next — cross-cutting per #1528 |
| 6.B.d7 | `<MatchResultRow>` reskin | queued — cross-cutting per #1528 |
| 6.B.d8 | `<MatchStripClient>` audit | queued — cross-cutting per #1528 |
| 6.B.d2 round 4 | MatchHero mobile collapse | deferred to implementation kickoff |
| 6.B.d3 round 2 | Per-row visual refinements | deferred unless flagged |
