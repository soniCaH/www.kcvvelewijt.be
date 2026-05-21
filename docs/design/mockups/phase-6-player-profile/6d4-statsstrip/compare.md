# 6.d4 · StatsStrip — primitive map

**Round 1.** Per-element drill. The hero is followed by a black scoreboard
band of 5 numbers. This drill picks which 5 (or 4, or zero) numbers,
factoring in the new cross-age scope from
`[[project_player_profile_all_ages]]` — the profile must work for U6-U21 too.

Visual artifact: `round-1-statsstrip-comparisons.html` — four variants
showing the A-team case (data present) and the U13 case (data absent →
section hides) within each column.

## Reference locks consumed

- `docs/design/phase-6-player-profile-brief.md` §2 "Stats strip styled as scoreboard"
- `6d0-data-reality/data-reality-locked.md` — Variant C upper-bound
- `apps/web/src/app/(main)/spelers/[slug]/page.tsx:130-133` — keeper-stats
  not yet in BFF contract; outfield only
- `[[project_player_profile_all_ages]]` — page renders ALL players across
  age groups; sections must gracefully degrade for youth
- `[[feedback_no_bright_jersey]]` + palette lock — cream / ink / jersey-deep
  only; no yellow/red semantic outcome colours
- `[[feedback_design_data_audit]]` — render only fields that exist

## Variants

- **A — Canonical 5 with last-result.** `matches · goals · assists · minutes ·
last-result`. Matches retro-terrace-fanzine exactly. Requires BFF
  derivation (join games endpoint with player attendance).
- **B — Brief's 5 with cards.** `matches · goals · assists · minutes ·
cards (yellow/red)`. Requires BFF extension (PSD already has the fields).
  Palette risk: yellow + red break monochrome — render as mono pair `3/0`
  to comply with palette lock.
- **C — BFF-shippable 4.** Drop the 5th. Strip renders only what's wired
  today. Ships immediately. ~80% mockup fidelity. Promote to 5 cleanly
  later when BFF gains a field.
- **D — Drop the strip.** No StatsStrip on the player profile. Hero flows
  straight into BioBlock. Stats live elsewhere (team detail, match recaps).

## Cross-age behaviour (all variants A/B/C)

Youth profiles (U6-U21) where PSD doesn't expose match statistics → strip
auto-hides. Same conditional render that already exists for the keeper case
(`stats === null` returns the page-with-no-stats branch). This is a
_data-driven hide_, not a per-variant decision — every variant A/B/C
inherits the same hide-when-absent behaviour. Variant D is the only one
where the strip never renders for any age group.

Open question downstream: should the youth case fall back to **a different
shape** (e.g. just team kicker + age group + a single MonoLabel) rather than
"section is absent"? That's a separate cross-age UX decision; punted to the
forthcoming 6.d9 (cross-age section availability matrix) drill or to PRD
writing.

## Vocabulary deltas summary

| Variant | Δ count | Severity | Cost                                                               | Notes                                                                                                                                |
| ------- | ------- | -------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| **A**   | 1       | Medium   | New BFF logic: last PSD game with player + scoreline derivation    | Couples StatsStrip to games endpoint; sets precedent for "stats that need joins"                                                     |
| **B**   | 1       | Low      | Extend BFF outfield-stats contract with `yellowCards` + `redCards` | PSD `squadPlayerStatistics` already has these fields; pure mapping work. Palette risk handled by rendering as mono pair (no colour). |
| **C**   | 0       | Low      | None — uses what's already wired                                   | Ships first. Strip is 4-wide, slightly underweighted; visual fidelity drops to ~80%.                                                 |
| **D**   | 0       | Low      | None — removes a section                                           | The biggest scope reduction in Phase 6.A. Symmetric across age groups. Loses immediate season-progress signal.                       |

## Use sites consuming this vocabulary (downstream)

- `<StatsStrip>` lives in `apps/web/src/components/player/` today and
  already renders on `/spelers/[slug]`. Whichever variant locks here
  shapes the rebuild during Phase 6.A.
- Phase 6.B `<TeamHero>` may consume the same primitive for team-season
  numbers — sequencing consideration.
- Per-match `<StatsStrip>` on match detail (Phase 6.B `/wedstrijd/[matchId]`)
  has different stats (possession, shots, corners) — different content,
  same primitive.

## Keeper variant — out of scope for this drill

The page code comments (`apps/web/src/app/(main)/spelers/[slug]/page.tsx:130-133`)
note keeper stats (cleanSheets, goalsConceded, saves) aren't in the BFF
contract today. Locking any of A/B/C here doesn't unblock keeper
treatment — that's a separate BFF + design pass once keeper-shape data
exists. Phase 6.A keepers render the same outfield variant they do today;
position-aware variant comes later.

## Things this drill does NOT decide

- **Keeper variant** — separate future drill once BFF gains keeper fields
- **Tape strip / corner treatment of the strip** — brief proposes corner
  tape strips so the band "feels physically pinned"; visual detail
  rendered in the mockup, but the present/absent decision lives elsewhere
  (probably folded into the StatsStrip component as a static treatment)
- **Mobile reflow** — brief specifies 5 stats wrap to 2/3 rows on mobile;
  responsive shape, not a drill question
- **Stat label voice** — Dutch terse ("MATCHES", "GOALS", "ASSISTS",
  "MINUTEN") used throughout the mockup; if a more editorial voice is
  wanted ("Acht keer gespeeld") it's a separate sub-drill
- **Youth fallback shape** — whether the youth page replaces the absent
  strip with a different MonoLabel/MonoLabelRow construct, or simply
  collapses to empty space. Deferred to 6.d9 cross-age section matrix
  or PRD writing.

## Drop-section escape hatch

Variant D is the explicit drop-section variant per the 6.d0 lock. If D
wins:

- The page-level layout becomes Hero → StripedSeam → BioBlock (skipping
  the stats band entirely)
- Cross-age symmetry improves dramatically
- BFF `getPlayerStats` stays consumed by team-detail standings + match-recap
  primitives, not orphaned
- Fidelity vs canonical mockup drops to ~50%
