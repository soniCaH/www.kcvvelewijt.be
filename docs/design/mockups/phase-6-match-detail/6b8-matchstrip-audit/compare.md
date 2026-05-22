# 6.B.d8 · `<MatchStrip>` — audit drill

**Audit only.** Per Phase 6 epic, `<MatchStrip>` was flagged for "audit alongside the match-detail checkpoint to decide whether it shares vocabulary with `<MatchTeaser>` or stays distinct". Phase 3.C already locked the strip design (`docs/design/mockups/phase-3-c-header-and-matchstrip/matchstrip-locked.md`); d8's job is to **verify the lock is still authoritative** + flag any drift between spec and current implementation.

No HTML mockup. Text-only audit.

## Components in scope

`apps/web/src/components/layout/MatchStrip/`:

| File | Role |
| --- | --- |
| `MatchStripSlot.tsx` | Suspense + skeleton wrapper; the mount point for all consumers |
| `MatchStrip.tsx` | Async server component that fetches the next-fixture data from BFF |
| `MatchStripView.tsx` | Pure presentational component — given a match, renders the strip |
| `MatchStripSkeleton.tsx` | Loading state |
| (epic mentioned `<MatchStripClient>` — does not exist; appears to be outdated naming) |

## Production mount points

| Mount | Surface | Mounted via | Theme |
| --- | --- | --- | --- |
| `(landing)/layout.tsx` | All landing surfaces (homepage, section indexes) | `<MatchStripSlot />` | Light (cream-on-cream-soft) |
| `(main)/spelers/[slug]/page.tsx` | Player detail | `<MatchStripSlot />` inline (per d2 opt-in) | Light |
| `(main)/wedstrijd/[matchId]/page.tsx` | Match detail (Phase 6.B implementation) | `<MatchStripSlot />` inline (per d1 lock) | Light |
| `(main)/layout.tsx` | All other detail pages | NOT mounted (per Phase 3.C "detail pages omit" rule) | n/a |

## Direction D conformance check

Reading `MatchStripView.tsx`:

| Element | Current implementation | Direction D expectation | Drift? |
| --- | --- | --- | --- |
| Background | `bg-cream border-t-jersey-deep/35 border-b-ink/15` | `bg-cream` ✓; ink/35 borders are tonal-only, no Direction D mandate on borders for chrome | None |
| Layout | Grid: `auto_1fr_auto` (fixture / meta / CTA) on desktop, stacked on mobile | Phase 3.C lock spec | Matches |
| TeamMark + TeamName components | Italic Freight Display for KCVV; body sans for opponents | Phase 3.C lock | Matches |
| Score / vs separator | `font-display italic text-ink/50` for "vs." | Phase 3.C lock | Matches |
| Aftrap (date + time) | Mono semibold | Phase 3.C lock | Matches |
| CTA "Wedstrijddetails →" | `getButtonClasses(...)` — canonical button at small size | Phase 3.C lock | Matches |
| Mono caption / value cells | `lg:divide-x divide-ink/15` | Phase 3.C lock | Matches |

**Verdict:** no drift. The current `<MatchStripView>` implementation matches the Phase 3.C lock. No Direction D migration needed — the strip was built post-Direction-D and conforms to it natively.

## Cross-cutting vocabulary check

Per the epic: "audit alongside the match-detail checkpoint to decide whether it shares vocabulary with `<MatchTeaser>` or stays distinct".

After d6 locked `<MatchTeaser>` to A2-italic (ticket-card stub + body), the comparison:

| Element | `<MatchStrip>` (Phase 3.C lock) | `<MatchTeaser>` (d6 A2-italic) |
| --- | --- | --- |
| Card chrome | Full-bleed band, no card border, ink/35 + jersey-deep/35 hairlines | TapedCard frame: `border-2 ink + shadow-paper-sm` |
| Date treatment | Mono semibold inline | Display-big stamp in left stub + italic month label |
| Teams | Italic Freight Display KCVV + body sans opponent | Both italic Freight Display |
| Layout | Horizontal full-width band | Card with internal grid |
| Purpose | Always-on next-fixture orientation chrome | Discrete fixture card in a list |

**Vocabulary intentionally distinct.** The strip is chrome (always-on, dense); the teaser is content (a card in a list). The Phase 3.C lock explicitly notes: "**Always-on, dense** — different mood again". Trying to unify the two would weaken both. The audit confirms keeping them separate.

## Decision (locked)

- **No changes to `<MatchStrip*>` for Phase 6.B.** Phase 3.C's lock remains authoritative.
- `<MatchStripClient>` reference in the Phase 6 epic was outdated naming — actual components are `<MatchStripSlot>` / `<MatchStrip>` / `<MatchStripView>`. No work to do.
- The component is mounted inline on `/wedstrijd/[matchId]` per the d1 page composition lock — that's consumer code, not a strip change.
- If a future drift between Phase 3.C lock and implementation surfaces, it spawns a Phase 3.C follow-up, not Phase 6.B work.

## Cross-references

- Phase 3.C lock source-of-record: `docs/design/mockups/phase-3-c-header-and-matchstrip/matchstrip-locked.md`
- Existing components: `apps/web/src/components/layout/MatchStrip/`
- 6.B.d1 page composition (where the strip mounts on `/wedstrijd/[matchId]`): `../page-composition-locked.md`
- 6.B.d6 MatchTeaser lock (vocabulary comparison): `../matchteaser-locked.md`

## Drill state after this lock

| Drill | Subject | Status |
| --- | --- | --- |
| 6.B.d0 | Data reality | ✅ LOCKED |
| 6.B.d1 | Page composition | ✅ LOCKED |
| 6.B.d2 | `<MatchHero>` shape | ✅ LOCKED |
| 6.B.d3 | `<MatchLineupSection>` + `<MatchEventsSection>` | ✅ LOCKED |
| 6.B.d4 | `<MatchArticleLinkCard>` | ✅ LOCKED (build deferred to post-#1470) |
| 6.B.d5 | `<MatchStatusBadge>` Direction-D + tint | ✅ LOCKED |
| 6.B.d6 | `<MatchTeaser>` | ✅ LOCKED (default only; compact + MatchesSlider retired) |
| 6.B.d7 | `<MatchResultRow>` reskin | round 1 in-flight |
| 6.B.d8 | `<MatchStrip>` audit | ✅ **LOCKED (this doc — no changes; Phase 3.C lock authoritative)** |
| 6.B.d2 round 4 | MatchHero mobile collapse | deferred to implementation kickoff |
| 6.B.d3 round 2 | Per-row visual refinements | deferred unless flagged |
