# 5.d2 · Subject avatar vocabulary — primitive map

**Round 1.** Every visual choice in
`round-1-avatar-vocabulary-comparisons.html` maps back to a locked
primitive. Net-new vocabulary is called out as a delta (Δ). Per
`feedback_reuse_approved_primitives` and `feedback_design_data_audit`.

Reference locks consumed:

- Phase 4.5 R9 · photo treatment (newsprint filter, paper grain, 1px ink border)
- `feedback_subject_photo_fallback` · ~90% of subjects only have `psdImage`; design for bounded-box, transparent cutouts second
- `feedback_playerfigure_no_hybrid` · never a photo face inside a drawn body
- `project_jersey_illustration_vocabulary` · all jersey illustrations share one two-pass print style (jersey-deep underprint + ink overprint, no Celtic green/white, no photo-realism)
- `feedback_monolabel_cream_full_opacity` · cream on jersey-deep must be full-opacity

## Use sites consuming this vocabulary

- `<QARow avatar>` — interview Q&A row, scale ~32px circular, repeats many times per interview.
- `<PullQuote attribution>` — attribution avatar next to a quote, scale ~64px circular, repeats per pull-quote across all variants.

Whatever we lock here applies to **both** sites for **all** subject
kinds (`player` / `staff` / `custom`).

## Subject kinds + photo availability (from Sanity)

| Kind     | Photo source          | Has photo?                                               |
| -------- | --------------------- | -------------------------------------------------------- |
| `player` | `player.psdImage`     | ~90% yes (rectangular); ~10% no                          |
| `staff`  | `staffMember.photo`   | usually yes                                              |
| `custom` | `subject.customPhoto` | required by schema validator (per `interview-locked.md`) |

So a real interview's Q&A speakers and a real pull-quote subject
_usually_ have a photo — but not always.

## Option-by-option vocabulary map

| Element                        | A — photo                                              | B — monogram                                            | C — illustration                                               | D — mixed (mono at 32px, photo at 64px)               |
| ------------------------------ | ------------------------------------------------------ | ------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------- |
| Primary primitive              | Circular photo crop (CSS `border-radius: 50%` + photo) | Initial in jersey-deep disc                             | 4 line-art SVG portraits, two-pass print                       | Photo + monogram, scale-conditional                   |
| Image source                   | `player.psdImage` / `staff.photo` / `customPhoto`      | n/a (initial derived from `firstName[0]`)               | n/a (slot derived from a hash of subject key)                  | photo at ≥48px, monogram below                        |
| Photo filter                   | `--filter-photo-newsprint`                             | n/a                                                     | n/a                                                            | newsprint when photo path active                      |
| Paper grain                    | Same as `<TapedFigure>` (4% radial multiply)           | n/a                                                     | n/a                                                            | when photo path active                                |
| Background colour              | Source image                                           | `--color-jersey-deep`                                   | Cream (illustration sits on the surface)                       | hybrid                                                |
| Foreground colour              | n/a                                                    | `--color-cream` full opacity                            | `--color-jersey-deep` (underprint) + `--color-ink` (overprint) | hybrid                                                |
| Border                         | 1px ink                                                | none (silhouette is the disc)                           | none (line-art owns the silhouette)                            | both                                                  |
| Subject-photo-missing fallback | Defer to B monogram (~10% of player subjects)          | n/a (B has no photo dep)                                | n/a (illustration is decoupled from photo)                     | Q&A row already monogram; pull-quote needs a fallback |
| Subject identity preserved?    | ✅ photo = the person                                  | ⚠️ collision on shared initials (An ↔ Anouk → both "A") | ❌ illustration is a slot index, not the person                | ✅ at pull-quote, ⚠️ at Q&A                           |
| Scales tested                  | 32px + 64px                                            | 32px + 64px                                             | 32px + 64px                                                    | 32px (mono) + 64px (photo)                            |
| Recognisability @ 32px         | Marginal (face too small)                              | Good (one letter is readable)                           | Glyph-level only (detail collapses)                            | Good (uses mono at this scale)                        |
| Recognisability @ 64px         | Good (face readable)                                   | Good but generic                                        | Decorative, not identifying                                    | Good (uses photo at this scale)                       |

## Vocabulary deltas summary

| Option | Δ count | Severity | Cost                                                                                                     | Notes                                                                                                                                                                          |
| ------ | ------- | -------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **A**  | 2       | Low      | One prop value (`aspect="circle"` on `TapedFigure` or thin `<SubjectAvatar>` wrapper) + a fallback rule. | Easiest. Reuses R9 photo treatment verbatim. Preserves subject identity. Open question: no-photo fallback rule.                                                                |
| **B**  | 1       | Low      | One new `<SubjectMonogram>` primitive (small disc + initial + role-aware bg).                            | Decouples from photo presence. Open question: initial collision (An ↔ Anouk both render "A"). Could mitigate with two-letter initials or a hue-shift per-role.                 |
| **C**  | 3       | High     | 4–6 SVG line-art portraits + slot-mapping rule + new asset pipeline.                                     | Highest cost. Identity is decoupled from data (avatars represent "the speaker" generically). Closest to fanzine register but reads as decorative, not identifying.             |
| **D**  | 2       | Medium   | Both A's + B's primitives plus a scale-conditional rule.                                                 | Two avatar primitives in the system. Same speaker reads differently at different scales within the same article — consistency risk. Solves the "face too small at 32px" issue. |

## Recommendation framing

- **Option A** is the safest reuse — photos are real data and ~90% of
  subjects have them. The 10% fallback question becomes a rule
  ("monogram from Option B") instead of a separate vocabulary.
- **Option C** is appealing for the fanzine register but breaks
  identity. A pull-quote that attributes a real human shouldn't
  render an abstract glyph instead of that human's face.
- **Option D** is the strongest argument against pure A — but the
  same-speaker-two-looks consistency risk is real, and the underlying
  primitives are still A + B, so we'd be locking both regardless.

The drill question, narrowed: **is photo-with-monogram-fallback (A
with B as fallback) enough, or do we need scale-conditional
treatment (D)?**

## Things this drill does NOT decide

- **Subject-photo-missing fallback rule** when Option A is picked —
  whether the monogram from B fills the slot, or the avatar slot is
  omitted entirely (Q&A row drops the avatar column when the photo
  is missing).
- **Initial collision rule** when Option B is picked —
  one-letter / two-letter / hue-shift per role.
- **Illustration slot count** if Option C is picked — 4 / 5 / 6 / 8.
- **Pull-quote attribution copy below the avatar** — current spec is
  italic display name + mono caps role; not re-opened here.

## Net new primitives proposed

| Option | Net-new                                                      | Cost                                                              |
| ------ | ------------------------------------------------------------ | ----------------------------------------------------------------- |
| A      | `<SubjectAvatar kind="photo">` (thin wrapper)                | One component + story + VR baseline. Trivially additive.          |
| B      | `<SubjectAvatar kind="monogram">` (disc + initial)           | One component + story + VR baseline.                              |
| C      | `<SubjectAvatar kind="illustration">` + 4–6 SVG glyph assets | Component + asset set + slot-mapping helper + stories + baselines |
| D      | A + B + a `kind="auto"` selector                             | A + B costs + the rule helper.                                    |

## Source-of-truth

- Mockup HTML: `docs/design/mockups/phase-5-article-detail/5d2-avatars/round-1-avatar-vocabulary-comparisons.html`
- Phase 3-b interview lock — `docs/design/mockups/phase-3-b-editorial-hero/interview-locked.md` (Q&A row + pull-quote already locked structurally — this drill only resolves the avatar fill).
- Memories consumed: `feedback_subject_photo_fallback`, `feedback_playerfigure_no_hybrid`, `project_jersey_illustration_vocabulary`, `feedback_monolabel_cream_full_opacity`, `feedback_reuse_approved_primitives`, `feedback_design_data_audit`.
