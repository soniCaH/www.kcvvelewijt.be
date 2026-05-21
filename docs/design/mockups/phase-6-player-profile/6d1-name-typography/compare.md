# 6.d1 · Player-name typography — primitive map

**Round 1.** Per-element drill. The hero stacks first name + last name in
display italic; this drill picks the rhythm.

Visual artifact: `round-1-name-typography-comparisons.html` — four variants
rendered against the same hero composition (number, photo, meta), at desktop
and mobile scales.

## Reference locks consumed

- `docs/design/phase-6-player-profile-brief.md` §5 — open drill Q1 framing
- `6d0-data-reality/data-reality-locked.md` — Hero is a surviving section in Variant C
- `[[feedback_reuse_approved_primitives]]` — new mockups compose with existing
  `<EditorialHeading>` / `<MonoLabel>` vocabulary
- `[[feedback_design_data_audit]]` — meta fields use the audited list
  (`position · birthDate · height · weight · nationality`); preferred foot dropped
- Phase 1 EditorialHeading — italic Quasimoda + Freight Display vocabulary

## Variants

- **A — Uniform Black.** Both names share display italic Black. Zero
  primitive extension. Calm magazine voice.
- **B — First regular + last Black.** Family name dominates. Adds a
  `nameWeight="split"` prop OR consumer-level span override. Strongest
  poster / programme feel.
- **C — First Black + last italic.** Given name dominates. Inverse rhythm.
  Adds a `nameWeight="inverse"` prop AND introduces upright display weight
  to the heading vocabulary for the first time. Friendly voice.
- **D — Stage name.** First name as mono kicker, last name as oversized
  italic display. Pure composition of `<MonoLabel>` + `<EditorialHeading>`,
  no prop. Cult-of-personality voice. Awkward on long surnames.

## Vocabulary deltas summary

| Variant | Δ count | Severity | Cost                                                                                       | Notes                                                                           |
| ------- | ------- | -------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| **A**   | 0       | Low      | None — existing primitive.                                                                 | Cheapest. Quietest. Lowest "season-opener" energy.                              |
| **B**   | 1       | Low      | Add `nameWeight="split"` to `<EditorialHeading>` OR raw spans at consumer.                 | Consumer-level override is zero-Δ; prop extension is 1 prop, easy.              |
| **C**   | 2       | Medium   | Add `nameWeight="inverse"` AND introduce upright display weight to the heading vocabulary. | Upright display is a NEW VOICE in the redesign — every other display is italic. |
| **D**   | 0       | Low      | Pure composition — no primitive change.                                                    | Tradeoff is in voice/legibility on long surnames, not vocabulary cost.          |

## Use sites consuming this vocabulary (downstream)

- `<PlayerHero>` (Phase 6.A — this page)
- `<PlayerCard>` in `<SquadGrid>` (Phase 6.B team-detail) — same rhythm at smaller scale
- `<EditorialHero variant="transfer">` — already locked; transfers headline player names too,
  audit whether this drill ripples back into transfer hero
- Search-results `<PlayerCard>` — same composition, smaller

## Long-surname stress test (not rendered, called out)

Common KCVV surnames that strain each treatment:

- `Van den Broeck` — 14 chars + 2 spaces. Variant D goes to two lines at
  desktop hero scale; mobile becomes problematic.
- `Vanderstraeten` — 14 chars. Single token; survives D but eats the meta column.
- `Roussel` — 7 chars. Strong fit for all 4.

## Things this drill does NOT decide

- The hero photo treatment (rectangular psdImage vs polaroid vs jersey
  illustration fallback) — drilled at 6.d2.
- The `NIEUW` badge trigger logic (firstTeamSince threshold) and visual
  treatment — drilled at 6.d3.
- Whether `<EditorialHeading>` grows a `nameWeight` prop OR consumers
  override at span level — the **vocabulary delta is a downstream PRD
  decision** once a treatment locks here. Don't conflate "B locks" with
  "we ship `nameWeight="split"` API".
- The dashed underline / period at end of name — inherited from existing
  `<EditorialHeading>` convention.
- Mobile breakpoint exact width — these are illustrative at 260px;
  Storybook stories at lock time will validate against real breakpoints.

## Drop-section escape hatch

Per the 6.d0 lock, every per-element drill carries an explicit "drop this
section" option. **For the player name in the hero, the drop-option is
nonsensical** — a player profile without a name is a 404. The 4th variant
(D) instead opens different ground (stage-name treatment) so the round
still has four meaningful choices. This is the only Phase 6 drill where
the drop-option does not appear; subsequent drills (Stats, Bio, CareerLog,
RecentMatches, Quotes) will carry it as Variant D.
