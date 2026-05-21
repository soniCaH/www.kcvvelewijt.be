# 6.d9 · Cross-age section availability + privacy — primitive map

**Round 1.** Final design-domain drill. The player profile renders all ages
(A-team adults through U6 toddlers). Hero always renders something; what
should it render, and how should minor privacy be handled?

Visual artifact: `round-1-cross-age-comparisons.html` — four variants
showing three representative players (Maxim A-team / Senne U17 / Lars U8)
rendered under each variant's rules.

## Reference locks consumed

- `[[project_player_profile_all_ages]]` — page renders ALL ages
- Phase 6.A composition locks (all 6.d0 → 6.d8 prior decisions)
- `[[feedback_subject_photo_fallback]]` — psdImage availability skew

## Variants

- **A — Uniform.** Same shape for everyone. Data-driven hide for
  BioBlock + QuotesBlock. Full DOB + body metrics + photo for all ages.
  Highest PII exposure, simplest implementation.
- **B — Privacy-graded meta.** Minors get age + year instead of full DOB;
  height yes, weight only above U13. Photos still render. BioBlock +
  QuotesBlock auto-hide via editorial policy.
- **C — Privacy-graded + illustration.** Above B, plus: minors NEVER
  render psdImage on the hero — always the `<PlayerFigure>`
  illustration fallback. Federation-consent doesn't carry to public
  website context.
- **D — Minimal for minors.** Minors render single-column hero with
  name + team + jersey-number only. No DOB, no metrics, no figure
  column. Adults unchanged.

## Privacy-cost ledger

| Concern                  | A       | B           | C           | D           |
| ------------------------ | ------- | ----------- | ----------- | ----------- |
| Full DOB exposure        | All     | Adults only | Adults only | Adults only |
| Body metrics for minors  | Yes     | Partial     | Partial     | No          |
| Photo of minors public   | Yes     | Yes         | No          | No          |
| Identifiable PII surface | Highest | Medium      | Low         | Lowest      |

## Vocabulary deltas summary

| Variant | Δ count | Severity | Cost                                                                         | Notes                                                                                                                     |
| ------- | ------- | -------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **A**   | 0       | Low      | None — single render path                                                    | Simplest. PII exposure may not be defensible to a privacy regulator for KCVV's youth membership.                          |
| **B**   | 1       | Low      | Age-derived branches in meta-row rendering                                   | Compute age at render time; conditional field list. No new schema.                                                        |
| **C**   | 1       | Medium   | Above + photo gate based on age                                              | Photo gate is the same `psdImage`-presence branch as 6.d2's fallback, just with age < 18 added as a triggering condition. |
| **D**   | 2       | Medium   | Two render paths (adult vs minor); single-column hero composition for minors | Most engineering, most visual divergence. Youth profile reads as a directory entry.                                       |

## Cross-age behaviour summary

All variants:

- BioBlock auto-hides when `player.bio` is empty (~60% squad)
- QuotesBlock auto-hides when bio decorator span #2 is absent
- Editorial policy: don't write bios for minors → both sections cleanly hide

Variant-specific minor rules sit on top of these data-driven hides.

## Opt-in / opt-out pathway

If C or D wins, a future opt-in workflow can promote minors to richer
treatment via a Sanity field like `player.publicConsent: boolean` —
defaults false; manual toggle by an editor with verified parent / coach
approval. Not part of Phase 6.A; just a forward path that any of the
restrictive variants naturally enables.

If A wins, the inverse would be an opt-OUT workflow — defaults to public,
parents request removal. That model is harder to defend.

## Things this drill does NOT decide

- Exact age threshold (16 / 18 / 21?) — assume 18 per Dutch/Belgian
  majority age; configurable in PRD if needed
- `publicConsent` field implementation — out of scope for Phase 6.A
- Behaviour of search results / squad grids when navigating to a
  privacy-restricted minor profile — separate Phase 6.B decisions
- GDPR DPIA / formal privacy review — should run independently of this
  design drill; the drill picks a defensible default

## Drop-section escape hatch

This drill doesn't carry a meaningful drop-section variant per se —
"don't render minor profiles at all" would conflict with
`[[project_player_profile_all_ages]]`. Variant D is functionally a
near-drop (renders almost nothing for minors). Variant A is the
no-policy default.

## Recommendation context

The author's prior session pattern strongly suggests Variant C (strongest
privacy-with-substance) or D (strictest), not A (no policy). The
existing PSD federation consent model + the
`[[project_player_profile_all_ages]]` memory both point at "treat
minors with explicit care", which A doesn't do at all.
