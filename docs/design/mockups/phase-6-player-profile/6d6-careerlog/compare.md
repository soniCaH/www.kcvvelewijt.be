# 6.d6 · CareerLogTable — primitive map

**Round 1.** Per-element drill. Originally framed as brief Q2 (anchor-row
emphasis assuming the section ships). Reframed after 6.d3 / 6.d4 dropped
two sections: Variant D (drop CareerLog entirely) is a serious option —
this section is the **heaviest remaining commitment** from the 6.d0 Variant
C lock.

Visual artifact: `round-1-careerlog-comparisons.html` — four variants
showing Maxim's 5-station career + the empty / U13 case (auto-hides).

## Reference locks consumed

- `docs/design/phase-6-player-profile-brief.md` §2 "Career timeline" + §5 Q2
- `6d0-data-reality/data-reality-locked.md` — Variant C commits to `player.careerLog[]` schema migration + ~12h editorial
- `[[project_player_profile_all_ages]]` — youth profiles have empty career log → section hides
- `[[project_youth_divisions]]` — division names (Bovenbouw / Middenbouw / Onderbouw)
- `[[feedback_design_data_audit]]` — render only fields that exist
- `[[feedback_no_magazine_chrome]]` — no fabricated career narration

## Variants

- **A — Uniform rows.** All career rows render identically. Flat ledger.
  Ships the section; lowest visual emphasis.
- **B — Anchor by typography.** First + last rows get heavier club-name
  weight + slightly larger type. Story arc reads at-a-glance.
- **C — Anchor by typography + surface.** First + last rows get weight
  emphasis AND a cream-deep background tint. Strongest signal; "dog-eared
  pages" reading.
- **D — Drop CareerLog.** No section. Zero schema, zero editorial, zero
  crest assets. Phase 6.A becomes **zero-schema** for the first time.

## Vocabulary deltas summary

| Variant | Δ count | Severity | Cost                                                                                           | Notes                                                                                                                              |
| ------- | ------- | -------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **A**   | 1       | Medium   | New `<CareerLogTable>` primitive + `player.careerLog[]` schema + ~12h editorial + crest assets | Lowest design risk among ship-the-section variants.                                                                                |
| **B**   | 2       | Medium   | Above + `<CareerLogRow variant="anchor">` row prop                                             | Story arc reads. Single-row logs (1 station only) trivially anchor.                                                                |
| **C**   | 3       | Medium   | Above + cream-deep surface tone usage                                                          | Strongest signal. Risks layering with parked dark-band aesthetic (third surface tone in one section if dark band also lands here). |
| **D**   | 0       | Low      | None — removes the section + cancels schema + cancels editorial backlog                        | **Biggest scope win available in Phase 6.A.** Phase 6.A schema migrations would drop from `careerLog[]` to **zero** if D wins.     |

## Scope cascade if D wins

- `6d0-data-reality/data-reality-locked.md` schema scope reduces from
  `careerLog[] (the only remaining migration after 6.d3 dropped firstTeamSince)`
  to **zero** schema migrations
- Editorial workload for Phase 6.A drops from ~12h to ~0h
- Club-crest asset sourcing cancelled
- Page surviving sections so far: Hero + (BioBlock w/ PT pullquote decorator) + (RecentMatches?) + (Quotes?)
- The "logboek" framing in the canonical retro-terrace-fanzine mockup is
  abandoned — strongest break from the mockup yet
- Cross-age symmetry improves materially

## Cross-age behaviour (A/B/C)

Youth profiles where `player.careerLog[]` is empty → section hides.
Practically: all U6-U21 profiles, since (a) editorial workload won't
populate career logs for youth, and (b) most youth players have minimal
"career history" to log. Variant D removes the section for all profiles.

## Dark-band repurpose candidacy

Per the 6.d4 parking:

- **A**: header on ink + rows on cream — plausible
- **B**: same — plausible
- **C**: already adds a third surface (cream-deep tint); layering ink
  on top would be visually busy. Discount C as a dark-band candidate.
- **D**: not a candidate (section absent)

## Use sites consuming this vocabulary (downstream)

- `<CareerLogTable>` would be a Phase 6.A new primitive
- Could theoretically extend to staff-member profiles
  (`/staf/[slug]`) — but that's Phase 7 (`/club/organigram`)
- No Phase 6.B reuse (match / team / kalender don't need career logs)

## Things this drill does NOT decide

- Row sorting (chronological ascending vs descending — assume ascending,
  oldest-first, for "story arc reading"; revisit if D survives)
- Crest assets — sourcing strategy (Sanity image asset per club vs
  external CDN URLs in schema) — PRD decision
- "Anchor row" definition edge cases: 1-row log? 2-row log? PRD
- Whether old non-A-team career rows (e.g. U13 → U17 progressions for a
  current A-team player) belong in the log — editorial guidance
- Dark-band presentation home — 6.d5.a / cross-page after later locks

## Drop-section escape hatch

Variant D is the explicit drop-section variant per the 6.d0 lock. If D
wins:

- Phase 6.A becomes the leanest version of itself — zero schema work,
  zero editorial backlog, zero new asset workflows
- The page is closer to a "voice + identity" page than a "biographical
  ledger" page
- 6.d0 lock doc gets updated to note the schema scope is now empty
