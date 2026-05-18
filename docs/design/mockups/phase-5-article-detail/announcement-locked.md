# Announcement variant identity — locked (drill 5.d-col)

**Drill:** 5.d-col · #1788
**Locked:** 2026-05-18 by @climacon
**Mockups:** `5d-col/round-1-column-identity-comparisons.html`

---

## Decision

**A — monogram author chip beside the byline.** A 24px monogram disc renders inline with the `<EditorialByline>` meta row whenever `article.author` is populated. Reuses the 5.d2 monogram primitive verbatim (same vocabulary as Q&A row + pull-quote attribution avatars).

## Drill scope (Path 2)

Per the mid-drill clarification: the `announcement` articleType doubles as the editorial "column" surface, but **Sanity has no `column`-vs-`announcement` discriminator**. The drill resolved as "announcement variant identity applies to ALL announcements" — no per-article flag, no `tags` convention required.

Option B from the original issue body (`<MonoLabel>` COLUMN kicker + heavier DropCap) was dropped at brief level: the "COLUMN" pill would have required a data signal (`isColumn` boolean, `tags` convention, or new sub-type field) that doesn't exist and we declined to add.

## Rationale

- **Data-honest** — uses `article.author` (added in 5.d-int) + the locked 5.d2 monogram primitive. Zero new schema fields, zero new components.
- **Personalises the announcement** — gives readers a visual anchor for "this is someone's voice" without requiring an author portrait (which we don't have data for).
- **Gracefully optional** — when `article.author` is blank, the chip simply doesn't render. The byline reads as it does today.
- **Consistent with the system** — Phase 5 has already established the monogram as the "person represented in text" cue at row scale (5.d2). This extends the same primitive to the byline at hero scale (smaller — 24px vs 32px Q&A row vs 64px attribution).

## Component shape (locked)

`<EditorialByline>` (existing Phase 0-1 primitive) gains an inline-prefix slot that renders a `<SubjectMonogram>` (5.d2 vocabulary) when `article.author` is non-empty. Locked shape:

```text
<EditorialByline>
  [T] Door Tom De Smet · 17 mei 2026
   ↑ 24px monogram disc, bg-jersey-deep, cream initial, italic Freight Display 900 12px
```

- **Size:** 24px diameter. Smaller than the 32px Q&A row monogram (which sits next to longer body lines) so the byline meta row stays single-line on desktop.
- **Derivation rule:** `article.author[0]` (first letter, uppercased). Same derivation as the locked 5.d2 monogram, just keyed off `author` instead of `subject.firstName` / `subject.customName`.
- **Gap:** 8px between monogram and byline text.
- **Vertical alignment:** centred against the byline mono-caps baseline.

## Scope across variants

This treatment lives on `<EditorialByline>`, which is a shared primitive. The drill explicitly resolves it for the **announcement** variant identity, but because the component is shared:

- Other variants (`interview`, `transfer`, `event`, `matchPreview`, `matchRecap`) inherit the monogram automatically when `article.author` is populated.
- This is acceptable — having the monogram everywhere "the byline appears" is consistent with the 5.d2 monogram-everywhere-the-subject-appears pattern.
- Per-variant drills (5.d-tra / 5.d-evt / 5.d-mat) can still introduce ADDITIONAL identity touches on top of the monogram if needed.

## What this drill resolves

- ✅ Announcement variant identity — monogram author chip in byline.
- ✅ Path 1 vs Path 2 ambiguity — Path 2 (all announcements treated the same; no column discriminator added).
- ✅ Data audit — no new schema fields, no fabricated chrome.

## What this drill does NOT decide

- **Per-variant additional identity touches** — drills 5.d-tra / 5.d-evt / 5.d-mat may layer extra cues on top of the byline monogram (e.g. a transfer arrow flourish, an event countdown chip).
- **Hero composition** — locked at 5.d1 (Phase 3-b EditorialHeroShell 60/40 grid).
- **`<EditorialByline>` fallback** — when `article.author` is blank, the byline reads "Door redactie" per Phase 3-b interview-locked.md. The monogram simply doesn't render in that case (no fallback chip).
- **Newsletter / signed columns / guest authors** — out of scope. KCVV doesn't run a newsletter (per `feedback_no_newsletter`); guest authors are just other values for `article.author`.

## Net new primitives / schema

- **Schema:** none (uses `article.author` from 5.d-int).
- **Component:** none (extends `<EditorialByline>` with an inline-prefix slot; reuses `<SubjectMonogram>` from 5.d2).
- **Vocabulary delta:** inline-byline placement of the monogram (locked usage today: QARow + PullQuote attribution).

## Downstream

- **#1796 (5.B.col)** — needs to consume this lock. Title currently reads "column-variant body touches"; rename to reflect the announcement-variant identity treatment.
- **`<EditorialByline>`** — the existing fallback `article.author ?? "Door redactie"` (per Phase 3-b interview-locked.md) gains an inline-prefix slot for the monogram. Same component, additive change.
- **All variants using `<EditorialByline>`** — inherit the monogram when author is populated (interview, transfer, event, match all consume the same byline).

## Source-of-truth

- Mockup HTML: `docs/design/mockups/phase-5-article-detail/5d-col/round-1-column-identity-comparisons.html`
- 5.d2 monogram lock: `docs/design/mockups/phase-5-article-detail/avatar-locked.md`
- 5.d-int schema additions: `docs/design/mockups/phase-5-article-detail/interview-locked.md` (`article.author` field).
- Memories consumed: `feedback_design_data_audit`, `feedback_reuse_approved_primitives`, `feedback_no_magazine_chrome`, `feedback_monolabel_cream_full_opacity`.
