# Subject avatar vocabulary — locked

**Drill:** 5.d2 · Round 1 · #1784
**Locked:** 2026-05-18 by @climacon
**Mockups:** `5d2-avatars/round-1-avatar-vocabulary-comparisons.html`
**Primitive map:** `5d2-avatars/compare.md`

---

## Decision

**Option D — scale-conditional.** Subject avatars render as:

- **Q&A row scale (~32px)** → **initial monogram** (Option B vocabulary)
- **Pull-quote attribution scale (~64px)** → **circular photo crop**
  (Option A vocabulary), falling back to a 64px monogram when the
  subject has no photo

Same primitive set, two render paths, picked by the consuming
component. `<QARow>` always renders monograms; `<PullQuote>` prefers
photos with monogram as fallback.

## Rationale

- **A circular photo crop at 32px is too small to identify a face.**
  The Q&A row repeats often (one per question, many per interview);
  if the face isn't recognisable, the avatar is just visual noise. A
  monogram is at least a deterministic marker tied to the speaker.
- **A monogram at 64px feels generic for a pull-quote attribution.**
  Pull-quotes are interspersed across long-form body, attribute a
  specific human's words, and benefit from the photo's identity
  carrying signal at that scale.
- **Option C (illustrations) was rejected** as decorative-not-
  identifying — a pull-quote attributing a real human shouldn't
  render an abstract glyph instead of that human's face.
- **Same-speaker-two-looks consistency risk acknowledged.** The same
  person renders as "W" in the Q&A row and as a photo of Wim in a
  pull-quote on the same page. Tradeoff: scale-appropriate
  recognisability beats cross-scale consistency, and the speaker
  tag (mono caps name) sits next to the avatar in both sites — so
  identity is never carried by the avatar alone.

## Component shape (locked)

Two primitives, or one primitive with a `kind` discriminator —
implementation choice, but the data model is the same:

```typescript
type SubjectAvatarProps = {
  subject: Subject; // resolved at the page-level Server Component
  scale: "row" | "attribution"; // "row" ≈ 32px, "attribution" ≈ 64px
};
```

- `scale="row"` → renders monogram regardless of photo availability.
- `scale="attribution"` → renders photo when `subject.<kind-photo>`
  resolves, else renders monogram at 64px.

Both renders share:

- Circular geometry (border-radius: 50%).
- The Phase 4.5 R9 photo treatment when the photo path is active
  (newsprint filter + paper grain + 1px ink border).
- Cream-on-jersey-deep monogram surface with full-opacity cream text
  per `feedback_monolabel_cream_full_opacity`.

### Monogram derivation rule (locked)

- **First initial of `firstName` only.** Single uppercase letter,
  italic Freight Display 900.
- **Collision tolerance:** initial collisions WITHIN a single article
  are accepted (An ↔ Anouk → both "A"). Mitigations like two-letter
  initials, per-role hue shift, or last-initial were considered and
  deferred — the surrounding speaker tag (mono caps `firstName ·
role`) disambiguates inline, and pull-quote attributions always
  render the full name beside the avatar.
- **Custom subjects** use the first letter of `customName`.
- **Staff subjects** use the first letter of `firstName`.

### Photo source per subject kind (unchanged from `interview-locked.md`)

- `player` → `playerRef.psdImage`
- `staff` → `staffRef.photo`
- `custom` → `customPhoto` (required by existing validator)

## What this drill resolves

- ✅ "What fills the avatar slot in Q&A row + pull-quote attribution?"
  Monogram at row scale, photo (with monogram fallback) at attribution
  scale.
- ✅ "Are subjects without a photo blocked from rendering?" No —
  monogram fills the slot in either site.
- ✅ "Do we ship illustrated character vocabulary?" No (rejected as
  identity-decoupled).

## What this drill does NOT decide

- **Component count** — one `<SubjectAvatar kind>` or two
  (`<SubjectMonogram>` + `<SubjectPhoto>`). Implementation choice at
  5.B.int build time.
- **Q&A row layout** — drill 5.d-int (#1787) drills row composition
  (number style, speaker-tag placement). This drill only fills the
  avatar slot.
- **Initial collision mitigation** — deferred as a content-editor
  concern. Revisit if real interviews produce frequent collisions
  that confuse readers; the speaker-tag-next-to-avatar disambiguation
  is the first line of defence.
- **Pull-quote attribution role text** — already locked in
  `interview-locked.md` (italic display name + mono caps role/jersey).

## Downstream

- **#1787 (5.d-int)** — unblocks one of its two blockers (5.d2). Still
  blocked on 5.d3 (#1785 section-break flourish).
- **#1795 (5.B.int)** — consumes this lock when wiring `<QARow>` and
  `<QASection>`. No new schema dependencies beyond what
  `interview-locked.md` already specified.
- **5.A.2 #1793** — `<PullQuote>` attribution avatar lands here too,
  not just inside interview. The avatar primitive is shared across all
  article variants that use `<PullQuote>`.

## Net new primitives

- `<SubjectAvatar>` (or split into `<SubjectMonogram>` +
  `<SubjectPhoto>`). One component, two scales, shared circular
  geometry. No schema migration required.

## Source-of-truth

- Mockup HTML: `docs/design/mockups/phase-5-article-detail/5d2-avatars/round-1-avatar-vocabulary-comparisons.html`
- Primitive map: `docs/design/mockups/phase-5-article-detail/5d2-avatars/compare.md`
- Locks consulted:
  - `docs/design/mockups/phase-3-b-editorial-hero/interview-locked.md` (Q&A row + pull-quote already locked structurally)
  - `docs/design/mockups/phase-4-homepage/photo-treatment-system-locked.md` (R9 newsprint filter, paper grain)
- Memories consumed: `feedback_subject_photo_fallback`, `feedback_playerfigure_no_hybrid`, `feedback_monolabel_cream_full_opacity`, `feedback_reuse_approved_primitives`, `project_jersey_illustration_vocabulary`.
