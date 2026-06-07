# PRD: Redesign Phase 7 — Geschiedenis (`/club/geschiedenis`)

**Status**: Ready for implementation (design locked)
**Date**: 2026-06-07
**Design contract**: `docs/design/mockups/phase-7-geschiedenis/7g1-timeline-treatment-locked.md`
**Epic**: #1529 (Redesign Phase 7) · **Milestone**: `redesign-retro-terrace-fanzine`

---

## 1. Problem statement

`/club/geschiedenis` renders the club chronicle (`<HistoryContent>`) in pre-redesign vocabulary:
`<InteriorPageHero>` (dark) + `<SectionStack>` + a `kcvv-green-bright` centre-line timeline of
white/green-border `TimelineCard`s + `<TimelineImage>` photos + `<SectionCta>`. Content is
**entirely hardcoded** (no CMS) — so this is a **pure visual reskin** into the
retro-terrace-fanzine system, keeping the locked T1 "alternating + seam" timeline.

## 2. Scope

### In scope (`apps/web` only)

- Reskin `apps/web/src/app/(main)/club/geschiedenis/HistoryContent.tsx` to the locked spine.
- New heritage **sibling hero**; drop `<InteriorPageHero>` + `<SectionStack>` + `<SectionCta>`.
- `TimelineCard → <TapedCard>`, `TimelineImage → <TapedFigure>`, centre line → dashed-ink rule,
  dots → ink/jersey markers, date/era → `<MonoLabel>` chip, section seam → `<StripedSeam>`.

### Out of scope

- **No content changes** (timeline copy stays as-is, hardcoded).
- **No schema / BFF / repository change** (no data source).
- Other club surfaces (organigram, ultras) — separate.

## 3. Phases

Single phase (small, self-contained reskin).

## 4. Acceptance criteria

- [ ] Heritage hero: kicker "De club · sinds 1909" + `<EditorialHeading>` headline (final wording
      per §5) + italic lead. No `<InteriorPageHero>`/`<EditorialHero>`.
- [ ] Timeline reskinned (T1): dashed-ink centre line (`2px · ink · ~0.5`), `jersey-deep` node
      markers (`border-2 ink`), `<TapedCard>` cards either side, `<MonoLabel>` date/era chips
      (era-names + years both), `<TapedFigure>` newsprint photos + italic captions.
- [ ] Mobile collapses to a single column (preserve current behaviour).
- [ ] No legacy tokens (`kcvv-green-bright`, `kcvv-black`); `<StripedSeam>` for section breaks.
- [ ] Decorative line/markers `aria-hidden`; semantic order carried by the cards; headings
      hierarchy valid.
- [ ] Analytics: `geschiedenis_view` page view; add `geschiedenis_` to the GTM trigger
      regex (manual, note in PR). No PII.
- [ ] Stories (`vr`) for the hero + a left/right `TimelineItem` + a `TimelineImage`; baselines
      committed. e2e `/club/geschiedenis` smoke green.
- [ ] `pnpm --filter @kcvv/web check-all` + VR green.

## 5. Open questions

1. Hero headline: "Meer dan een eeuw." vs "Onze geschiedenis." vs "Sinds 1909."
2. Keep a closing CTA (→ /club or /ploegen) or end on the timeline?
3. Analytics prefix: dedicated `geschiedenis_` vs shared `club_`.

## 6. Discovered unknowns

- `<HistoryContent>` is ~600 LoC of hardcoded JSX — the reskin is mechanical but touches every
  `TimelineItem`/`TimelineImage`; budget for a careful pass + VR of representative items, not all.
