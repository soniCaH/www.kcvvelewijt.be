# 6.C.d7 · Youth enrolment CTA — drill comparison

Issue #1949 · `/ploegen/[slug]` · out-of-PRD follow-up on the shipped Phase 6.C
team page. Artefact: `visual-compare.html` (open in a browser — true tokens,
real `<JerseyShirt>` paths). Lock: `../enrolment-cta-locked.md`.

## Rounds

1. **Placement** → **B** (standalone section between `<SquadGrid>` and
   `<TeamStaff>`). Rejected A (inline in locked `<TeamHero>`), C (sticky
   mobile-only footer — competes with sticky nav + MatchStrip, no desktop CTA).
2. **Copy** → **v1** (club-motto warm). Rejected direct/every-age + per-team
   personalised (latter over-promises against the generic `/club/inschrijven`).
3. **Visual** → **V2** (jersey-deep card, cream type). Rejected V1 (cream —
   quieter), V3 (split poster — new 2-column layout, no precedent).
4. **Design review (2 fixes + 1 tweak):** static card (no double hover); label
   and heading reserve a right gutter (no text behind the motif); lead flows
   full-width; motif inset from the corner (not bleeding off-edge).

## Reference locks / primitives consumed

| Visual choice                            | Source primitive / lock                                                                                |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Card chrome (ink border + offset shadow) | `<TapedCard>` (`border-ink border-2` baked in)                                                         |
| Card fill                                | `<TapedCard bg="jersey-deep">` token `--color-jersey-deep` #008755                                     |
| Card shadow on dark fill                 | `shadow="soft"` (`--shadow-paper-sm-soft`) — ink-bg soft-shadow rule                                   |
| Overline                                 | `<MonoLabel tone="cream">` (full-opacity cream rule)                                                   |
| Heading + warm accent                    | `<EditorialHeading tone="cream" emphasis={{tone:"warm"}}>` (`accentTone="warm"` = dark-surface accent) |
| Lead                                     | cream body copy, full-width                                                                            |
| CTA button                               | `<LinkButton variant="inverted" withArrow>` (canonical press-down)                                     |
| Jersey motif                             | `<JerseyShirt letterOverlay={ageGroup}>` (`_jersey-paths.ts`)                                          |
| Section seam                             | `<StripedSeam colorPair="ink-cream" height="md">` (page rhythm)                                        |
| Section frame                            | page `sectionClass` (`max-w-5xl scroll-mt-16 px-4 py-10`)                                              |

No net-new vocabulary: every element maps to an existing Phase 0–6 primitive.

## Trade-off table (visual round)

| Variant              | CTA prominence  | Motif legibility                        | New vocabulary / cost      | Cross-page consistency     | Verdict    |
| -------------------- | --------------- | --------------------------------------- | -------------------------- | -------------------------- | ---------- |
| V1 · cream           | Low (blends)    | Good (motif built for cream)            | None                       | Neutral                    | Rejected   |
| **V2 · jersey-deep** | **High (pops)** | **OK — dark silhouette + cream letter** | **None**                   | **Matches `YouthSection`** | **LOCKED** |
| V3 · split poster    | High            | Best (cream panel)                      | New 2-column layout (cost) | Neutral                    | Rejected   |

## Accessibility / data notes surfaced during the drill

- The round-2 "warm accent" only has contrast on a **dark** field —
  `<EditorialHeading>` accent is `warm` (dark) **or** `jersey-deep` (cream). The
  locked V2 (dark) uses `warm`; a cream variant would have to switch to
  `jersey-deep`.
- `<JerseyShirt>` is ink-underprint + jersey-deep overprint, designed for cream;
  on jersey-deep the green stripes wash out and the ink silhouette carries it.
- `letterOverlay` is decorative (`aria-hidden` inside `<JerseyShirt>`); the
  card's accessible content is the heading + lead + link.
