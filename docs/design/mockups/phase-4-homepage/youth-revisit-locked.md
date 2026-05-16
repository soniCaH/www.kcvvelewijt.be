# Phase 4.5 · Youth section — Locked (R5)

**Locked 2026-05-14. Implemented #1752 (2026-05-16).**
**Supersedes:** open follow-ups in `youthblock-locked.md` Round 8 (CTA + headline emphasis).
**Source compare page:** `round-r5-youth-revisit-comparisons.html`.
**Owner:** @climacon.

## Implementation notes (#1752)

- **Secondary CTA href:** `/club/inschrijven` — the same target the
  `<SiteHeader>` "Word lid" link points at. Surfaces a single
  registration funnel rather than a section-specific anchor.
- **StripedSeam top frame:** `<StripedSeam height="xl"
colorPair="cream-jersey-deep" />` (28 px, cream + `jersey-deep`
  alternating — paper-tape vocabulary laid across the dark green
  field).
- **PR-review revisions:**
  - First pass used a `jersey-tonal-light` pair (jersey-deep +
    jersey). It read as a louder green-on-green band against the
    photographic backdrop; owner asked for a calmer cream-on-deep
    pair instead. The `jersey-tonal-light` variant did not ship — no
    production consumers.
  - Lock asked for `1px var(--color-ink)` hairlines top + bottom
    around the seam for "clean transition edges". PR review dropped
    them — the cream stops carry the band's edge against the photo
    backdrop on their own, and the Clubshop section ships its seams
    bare for the same reason. The two sections stay consistent.
- **StripedSeam API additions** (additive, no behaviour change for
  existing consumers):
  - Renamed the Phase 4.5 (R6.C) clubshop pair from `"jersey-tonal"`
    to `"jersey-tonal-dark"` (ClubshopBanner migrated to the new key).
  - Added `"cream-jersey-deep"` for paper-on-green section frames.
  - New `xl` height entry (28 px) to match the brief's ~28 px target.
- **Implementation path:** path 1 from the lock — the seam renders as
  the first child of `<YouthSection>` itself, not in a SectionStack
  transition slot. The Phase 4 homepage already retired its legacy
  diagonal transitions, so this section ships its own framing rather
  than relying on inter-section chrome.

## Decision

**R5.B · Brief-faithful with Word-avoidance CTA.**

Adds the diagonal stripe top band the brief asks for, shifts the
headline emphasis to "Elewijt", adds a second CTA — but rewords the
secondary CTA from the brief's "Word zelf lid →" to "Schrijf je in →"
so the eyebrow ("Word jeugdspeler") and the CTA don't trip the
Word/Word repetition pattern.

## Composition

```text
[Diagonal stripe band — full-bleed]
   <StripedSeam>           jersey-deep + jersey-light alternating
                           ~28px tall · 45° stripes · ink borders top + bottom

[Youth section — jersey-deep full-bleed, photo + overlay backdrop]
   Word jeugdspeler        eyebrow · cream MonoLabel pill
   De toekomst van         italic-serif H2 · cream
     *Elewijt*.            italic + warm-accent on "Elewijt"
                           (NOT on "De toekomst" — emphasis shift per brief §8)
   Body paragraph          existing copy
   220+ spelers · 16 ploegen   inline stats · cream MonoLabel
   [Ontdek onze jeugd →]   primary CTA · cream-on-jersey LinkButton
   [Schrijf je in →]       secondary CTA · outlined cream LinkButton

[Next section — Banner C / cream-soft]
```

## What changed vs current implementation

`apps/web/src/components/home/YouthSection/YouthSection.tsx` ships:

```typescript
emphasis={{ text: "De toekomst", tone: "warm" }}  // currently emphasizes "De toekomst"

<LinkButton href="/jeugd" variant="primary" withArrow>
  Ontdek onze jeugd
</LinkButton>
// ← only one CTA
```

R5.B requires:

```typescript
emphasis={{ text: "Elewijt", tone: "warm" }}  // shift italic + warm accent to "Elewijt"

<div className="flex flex-wrap gap-3.5">
  <LinkButton href="/jeugd" variant="primary" withArrow>
    Ontdek onze jeugd
  </LinkButton>
  <LinkButton href="/club/inschrijven" variant="inverted" withArrow>
    Schrijf je in
  </LinkButton>
</div>
```

Plus the `<StripedSeam>` primitive at the TOP of the section. The
SectionStack wrapper currently controls the section background; the
seam needs to sit above the youth section but BELOW the previous
section's bottom edge. Two implementation paths — to decide at PR time:

1. **Inside YouthSection**: render the `<StripedSeam>` as the first
   child of the section, before the existing `<YouthBackdrop>` and the
   inner container. The seam paints inside the section's jersey-deep
   bg.
2. **Above YouthSection (in SectionStack)**: render the seam as a
   separate transition between the previous section and YouthSection,
   like other section transitions. Cleaner separation but requires
   SectionStack API change.

Recommendation: path 1 (inside `<YouthSection>`) — simpler, no
SectionStack API change.

## Resolves audit §B1

The "diagonal stripe primitive — new or `<StripedSeam>` reuse?" question
from the audit closes here: **`<StripedSeam>` is the right primitive**.
Phase 0 ships it as a horizontal section divider; R5 uses it as a
section TOP frame, which is the same primitive role with a different
adjacent-surface relationship.

Tuning:

- `tall` prop (or equivalent height tuning) — match the ~28px / 24px
  brief spec. Confirm against existing `<StripedSeam>` default at
  implementation time.
- Color stops: `var(--color-jersey-deep)` + `var(--color-jersey-light)`
  (or `--color-jersey-deep-soft` if that token already exists).
  Pre-existing tokens preferred over new ones.
- Borders: 1px `var(--color-ink)` top and bottom for clean transition
  edges.

If `<StripedSeam>` doesn't support these props today, extend it
(adding props is fine; introducing a parallel primitive is not).

## What's unchanged

- Background: `<YouthBackdrop>` (photo + green overlay) — keep per
  `feedback_visual_preferences` and `feedback_no_bright_jersey`. No
  flat illustration fallback.
- Eyebrow: `Word jeugdspeler` (MonoLabel).
- Body copy: existing short narrative (Bovenbouw / Middenbouw / Onderbouw).
- Stats: `220+ spelers · 16 ploegen` (inline MonoLabel, not a featured
  number badge).
- Section background: jersey-deep full-bleed via `SectionStack`.

## Bottom edge

The Youth section's BOTTOM edge stays a flat transition to the next
section (BannerSlot c or directly to Sponsors after R4.B's spine
override). No mirrored stripe band at the bottom — that pattern is
reserved for the Clubshop section (R6, which gets stripe at BOTH top
and bottom per brief §10). Keeping the bottom of Youth flat
differentiates the two dark sections.

## CTA wording rationale

Owner picked R5.B over the brief verbatim because:

- Eyebrow already says "Word jeugdspeler". Secondary CTA "Word zelf lid"
  would create a Word/Word visual pattern within ~6 inches of vertical
  space.
- "Schrijf je in" is the standard Dutch youth-football onboarding verb
  and reads as the next-step CTA (after "Ontdek onze jeugd"), not as a
  parallel ask.
- Per `feedback_role_based_engagement_naming`: not strictly a role-based
  cluster (only 2 CTAs, not 3+), but the spirit of the rule — avoid
  verb-repetition in CTA stacks — still applies.

The secondary CTA's `href` should point to a registration-funnel anchor
or page. Confirm at implementation time — likely `/jeugd#inschrijven`
or a dedicated `/inschrijven` route. Owner to verify the registration
URL.

## Implementation issue spinout

R5 rolls into the broader Phase 4.5 implementation. A dedicated YouthSection
PR is small (one component edit + a primitive insertion); could land
standalone or bundled with the larger restructure issue. No data /
schema work.

## Open follow-ups

- **Registration URL confirmation.** `/jeugd#inschrijven` vs
  `/inschrijven` vs an external form URL. Owner to specify at
  implementation time.
- **StripedSeam height prop.** Verify the Phase 0 `<StripedSeam>` ships
  a configurable height OR extend it to accept one. Default Phase 0
  height may match the ~28px brief target without tuning.
