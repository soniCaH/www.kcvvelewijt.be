# In-body eventFact — locked (drill 5.d-evt-inline / #1840 drill 2.1)

**Drill:** 5.d-evt-inline · One existence decision + two visual rounds + polish defaults · #1840 drill 2.1
**Locked:** 2026-05-19 by @climacon
**Mockups:**

- `5d-evt-inline/round-1-card-vocabulary-comparisons.html`
- `5d-evt-inline/round-2-multi-card-behavior-comparisons.html`

---

> This lock supersedes the legacy Phase 2 `<EventFactOverview>` (dark-band full-bleed). The qaBlock-style "first eventFact absorbed by hero strip" rule from #1798 stands unchanged — this drill only covers what happens to subsequent eventFacts and to eventFacts authored inside non-event articles.

## Existence — locked (broad case)

The "additional eventFact in body" case **stays** in Phase 5. Two real-world cases share one visual:

1. **Inline-in-announcement** — an `announcement` article references an upcoming event via an inline eventFact. Author choice; no hero strip.
2. **Multi-eventFact in event articles** — subsequent eventFacts after the first one is absorbed by `<EventDetailBlock>` (e.g. a tournament weekend with 3 days, each authored as its own eventFact).

Schema unchanged. `eventFact` stays in the body block type list (`packages/sanity-schemas/src/article.ts:228`).

## Visual lock

### Round 1 — Card vocabulary: **C (Taped polaroid)**

A slightly rotated cream-white polaroid with ochre tape strips top-left + bottom-right, pinned into the body flow. No date block — date sits inline below the title in italic Freight Display.

```text
                ┌── tape (-5°) ───┐
            ╔════════════════════════════════╗
            ║  [Clubfeest pill]  Open …      ║
            ║                                ║
            ║  Steakfestijn 2026             ║   ← italic Freight 700, 26px
            ║  Vrijdag 13 juni · 18:00–22:00 ║   ← italic Freight 600, 18px
            ║                                ║
            ║  SPORTPARK · MAX 180 PLAATSEN  ║   ← mono caps, 10px ink-muted
            ║                                ║
            ║  [ INSCHRIJVEN → ]             ║   ← jersey-deep button
            ╚════════════════════════════════╝
                                  └─ tape (+4°)
```

### Round 2 — Multi-card stacking: **B (Subtle alternating rotations)**

Consecutive polaroids tilt at small alternating angles. CSS-only via `nth-of-type`:

```css
.eventfact-polaroid:nth-of-type(odd)   { transform: rotate(-0.5deg); }
.eventfact-polaroid:nth-of-type(even)  { transform: rotate( 0.4deg); }
.eventfact-polaroid:nth-of-type(3n)    { transform: rotate(-0.3deg); }
```

Reads as "hand-pinned at slightly different moments" without becoming a busy collage. Single tape color (ochre) across all cards — no per-card tape variation.

**Reset rule:** the rotation pattern resets when any non-eventFact PT block (paragraph, image, qaBlock, …) sits between two eventFacts. The `nth-of-type` selector handles this naturally inside one PT render.

## Polish defaults (locked alongside the visual rounds)

- **Past-event treatment** — mirrors `<EventDetailBlock>`: tag pill replaced by muted `Afgelopen` pill, CTA hidden entirely, everything else stays visible as a historical record. `isPast` derivation reuses the same `deriveIsPast(eventFact)` helper from the page-level Server Component, passed down as a prop.
- **Skip condition** — none. Always renders when authored. Unlike `<EventDetailBlock>` (which skips when `sessions/address/capacity/note` are all blank to avoid hero-strip duplication), the inline card has no surrounding context to be redundant against — an author placing an eventFact in the body is making an explicit editorial choice.
- **Mobile behavior** — polaroid keeps its sub-1° rotation; tape strips stay. Width clamped to `--container-prose` minus body padding (works down to 320px without overflow). No special mobile fallback needed.
- **Compression rules** — `sessions[]` and `note` PortableText are **NOT** rendered inline. Both stay exclusive to `<EventDetailBlock>`. This keeps the inline card visually lighter than the page-end card and prevents inline reproductions of the full event detail.

## Locked field rendering

| Field | Inline polaroid | `<EventDetailBlock>` (for reference) |
| --- | --- | --- |
| `title` | ✅ italic Freight 700, 26px | ✅ |
| `date` + `endDate` | ✅ italic Freight 600, 18px (resolved range) | ✅ |
| `startTime` / `endTime` | ✅ appended to date line | ✅ |
| `sessions[]` | ❌ compressed out | ✅ |
| `location` | ✅ mono caps meta line | ✅ |
| `address` | ✅ mono caps meta line | ✅ |
| `capacity` | ✅ mono caps meta line | ✅ |
| `ageGroup` | ✅ mono-label kicker (right of pill) | ✅ |
| `competitionTag` | ✅ jersey-deep pill | ✅ |
| `ticketUrl` + `ticketLabel` | ✅ jersey-deep CTA button (hidden when `isPast`) | ✅ |
| `note` (PT) | ❌ compressed out | ✅ |

## Component contract

```tsx
<EventFactInline
  value={eventFactValue}          // EventFactValue from the body PT
  isPast={deriveIsPast(value)}    // computed page-level, same helper as EventDetailBlock
  className?={…}
/>
```

- Component path: `apps/web/src/components/article/blocks/EventFactInline/EventFactInline.tsx` (sibling to `EventDetailBlock`).
- Storybook stories required per `feedback_state_coverage_stories.md`: single upcoming · single past · 3 stacked (rotation pattern) · stacked broken by paragraph (rotation reset) · minimal (only required fields) · CTA-less (no `ticketUrl`) · mobile viewport.
- The `<SanityArticleBody>` legacy `eventFact: () => <EventFactOverview>` serializer stays untouched for now — Phase 5's `<ArticleBody>` wires `EventFactInline` directly. Legacy is removed when `<SanityArticleBody>` itself retires (post-#1829).

## Net new vocabulary / schema

- **Schema:** none. Reuses existing `eventFact` block unchanged.
- **Component:** `<EventFactInline>` (new, sibling to `<EventDetailBlock>`).
- **Tokens:** none. Reuses existing ochre tape, jersey-deep pill/CTA, Freight Display italic, mono caps label, cream surface.
- **CSS:** new `nth-of-type` rotation pattern (≤ 4 lines).

## Downstream impact

- **#1829 (5.B body migration)** — this drill unblocks the `<ArticleBody>` eventFact serializer wiring. The migration ships `<EventFactInline>` alongside the rewritten `<QaGroupRapidFire>` from drill 1.3.
- **Legacy `<EventFactOverview>`** — kept in `apps/web/src/components/article/blocks/EventFact/` for `<SanityArticleBody>` only; retires when `<SanityArticleBody>` does.
- **`feedback_reuse_approved_primitives`** — polaroid reuses TapedCard family + ochre tape + jersey-deep pill/CTA + Freight Display. No new primitives.

## Source-of-truth

- Mockup HTML: `5d-evt-inline/round-1-card-vocabulary-comparisons.html`, `5d-evt-inline/round-2-multi-card-behavior-comparisons.html`.
- Schema: `packages/sanity-schemas/src/eventFact.ts` (unchanged).
- Existing reference: `apps/web/src/components/article/blocks/EventDetailBlock/EventDetailBlock.tsx` (page-end card — sibling).
- Memories consumed: `feedback_reuse_approved_primitives`, `feedback_design_data_audit`, `feedback_state_coverage_stories`, `feedback_no_magazine_chrome`.
