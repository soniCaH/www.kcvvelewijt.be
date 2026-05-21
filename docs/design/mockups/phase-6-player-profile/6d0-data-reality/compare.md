# 6.d0 · Data-reality reconciliation — scope map

**Round 1, grand-overview pass.** This is the only Phase 6 drill round that
compares full-page scope variants instead of per-element treatments. Subsequent
rounds (6.d1 name typography, 6.d2 hero PlayerFigure fallback, 6.d6 CareerLog
anchor-row emphasis, etc. — full queue in `data-reality-locked.md`) drill one
element at a time at full design fidelity, per
`[[feedback_design_drill_pattern]]` and `[[feedback_drill_visual_then_ia]]`.

Visual artifact: `round-1-data-reality-comparisons.html` — three side-by-side
full-page renders of the Maxim Breugelmans profile under each scope variant.

## Reference locks consumed

- Master plan §5.3 — twelve-item player-profile stack as authored
- `docs/design/phase-6-player-profile-brief.md` — scope decisions from
  2026-05-14 (preferredFoot dropped, sticky-next-match dropped, vorm indicator
  dropped, palette stays locked at cream/ink/jersey-deep)
- `docs/design/mockups/retro-terrace-fanzine/player-profile-desktop.png` —
  canonical visual baseline (Maxim Breugelmans)
- `[[feedback_design_data_audit]]` — mockups must render only fields PSD /
  Sanity actually provide
- `[[feedback_no_magazine_chrome]]` — no fabricated content, no fictional
  publication structure
- `[[feedback_variant_coverage_matrix_in_seeds]]` — seed-matrix per variant is
  the deliverable contract

## The question this drill resolves

Master plan §5.3 specifies twelve items. Three of them rely on data that
does not exist in `packages/sanity-schemas/src/player.ts` or in the BFF's
`squadPlayerStatistics` contract:

| §5.3 element        | What's missing                                                            |
| ------------------- | ------------------------------------------------------------------------- |
| `CareerLogTable`    | No schema field, no source. Would need new `careerLog[]` + editorial work |
| `RecentMatchesGrid` | BFF gives season aggregate only; per-match per-player attribution absent  |
| Hero `NIEUW` badge  | No join-date field on the player document                                 |

Building these components against fabricated content violates
`[[feedback_design_data_audit]]`. The remaining nine items (hero core,
stats strip, bio paragraph, derived pull-quote, derived QuotesBlock,
chrome) all map cleanly to existing data.

## Variant overview

| Variant | Scope                                                                       | Commitment                                                   | Mockup fidelity vs. retro-terrace-fanzine |
| ------- | --------------------------------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------- |
| **A**   | Trimmed — drop CareerLog, RecentMatches, NIEUW                              | Zero schema, zero editorial, zero BFF                        | ~55%                                      |
| **B**   | Enriched — add CareerLog + NIEUW (schema + editorial), defer RecentMatches  | 2 schema migrations, ~12h editorial, club-crest assets       | ~80%                                      |
| **C**   | Full §5.3 — adds RecentMatchesGrid (new BFF endpoint with goal attribution) | All of B + BFF endpoint design + per-player goal attribution | 100%                                      |

## Section-by-section data source map

| Section                | Variant A   | Variant B   | Variant C   | Data source                                                                                      |
| ---------------------- | ----------- | ----------- | ----------- | ------------------------------------------------------------------------------------------------ |
| `PlayerHero` core      | ✓           | ✓           | ✓           | `player.{firstName, lastName, position, jerseyNumber, psdImage, birthDate, height, nationality}` |
| `PlayerHero` team chip | ✓           | ✓           | ✓           | `team.players[].ref` reverse lookup                                                              |
| Hero `NIEUW` badge     | ✗ (omitted) | ✓           | ✓           | New schema field: `player.firstTeamSince: date`                                                  |
| `StatsStrip` 5 numbers | ✓           | ✓           | ✓           | BFF `getPlayerStats()` — already wired on `/spelers/[slug]`                                      |
| `BioBlock` paragraph   | ✓           | ✓           | ✓           | `player.bio` (Portable Text)                                                                     |
| `BioBlock` PullQuote   | ✓ (derived) | ✓ (derived) | ✓ (derived) | Derived: PullQuote-marked block in related interview article                                     |
| `CareerLogTable`       | ✗ (omitted) | ✓           | ✓           | New schema: `player.careerLog: array<{yearRange, clubName, clubCrest?, role, badge?}>`           |
| `RecentMatchesGrid`    | ✗ (omitted) | ✗ (omitted) | ✓           | New BFF endpoint: `/matches/player/{id}/recent` with per-player attribution                      |
| `QuotesBlock`          | ✓ (derived) | ✓ (derived) | ✓ (derived) | `ArticleRepository.findRelated(player.id)` → `subject.playerRef` → qaBlock decorators            |

## Scope deltas (per variant)

| Variant | Δ count | Severity | Cost summary                                                                                                                                         |
| ------- | ------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A**   | 0       | Low      | No schema, no BFF, no editorial. Build is pure UI + composition of existing data. Ships fastest.                                                     |
| **B**   | 2       | Medium   | Sanity migrations: `careerLog[]`, `firstTeamSince`. Editorial: ~12h to populate 24 A-ploeg players + sourcing club crest assets.                     |
| **C**   | 3       | High     | All of B, plus a new BFF endpoint joining PSD games with per-player goal/assist attribution. Today's `goalsScored` is team-global, not player-keyed. |

## What this drill does NOT decide

- **Per-element design choices** within the surviving sections — those drill
  rounds open after scope locks here. Open drills already queued (full ordered
  list in `data-reality-locked.md`):
  - 6.d1 — Player-name typography rhythm
  - 6.d2 — Hero `<PlayerFigure>` treatment (illustrated fallback policy)
  - 6.d6 — `<CareerLogTable>` anchor-row emphasis (only relevant if section survives its drill)
- **Build-slice shape** — single PR vs. component-first vs. vertical slice
  vs. hero-spike (Q8 in the grill agenda; re-asked after this lock).
- **Seed matrix** — minimum viable seeds for staging verification (Q6); shape
  depends on which sections survive.
- **Schema migration timing** — if Variant B or C: do migrations land
  alongside the page PR, or as a separate prep PR?
- **Master design doc audit** — §5.3 + §5.4 + §6.7 wording will need
  updates (Q7); cadence not yet decided.

## Hand-off note for downstream drill rounds

Whatever variant locks here determines which downstream drill rounds even
exist. If Variant A wins, drills 6.d6 (CareerLogTable anchor row) and the
not-yet-numbered RecentMatchesGrid drill both drop from the Phase 6.A
queue. If Variant B wins, 6.d6 remains, the RecentMatches drill drops. If
Variant C wins, both stay.

The locked scope also feeds:

- `docs/design/phase-6-player-profile-brief.md` — needs an "Open scope
  decision (locked 2026-05-21)" section appended pointing at this drill's
  `*-locked.md`.
- `docs/plans/2026-04-27-redesign-master-design.md` §5.3 — needs trimming
  to match. §5.4's "one EditorialHero" thesis is already wrong (locked
  earlier — sibling components, not unified variant union).
- `[[project_phase_6_prep_notes]]` — update with locked scope.
