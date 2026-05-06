# `<EditorialHero variant="interview">` — locked design (Phase 3, Checkpoint B)

**Status:** ✅ owner-approved 2026-05-05.
**Issue:** #1525 · sub-issue 3.B.2 (variants).
**Mockup:** `option-a-interview-detail.html` + screenshots `screenshots/detail-interview-{n1,n2,rare-mobile,full}.png`.
**Iterative comparison file** (historical): `option-a-interview-comparisons.html`.
**Field availability sheet:** `fields.md`.

> **★ Reuse audit correction (2026-05-05):** mentions of `<HeroCoverImage>` below (composition diagram + reuse map) are **superseded** — `<TapedFigure>` already accepts `aspect="landscape-16-9"`, so the cover-image artefact composes inline as `<TapedCard rotation>` + `<TapedFigure aspect="landscape-16-9">`. No wrapper primitive, no new Storybook story. **Canonical source of truth: Phase 3 PRD §8b.** Same correction applies to `announcement-locked.md`, `transfer-locked.md`, `event-locked.md`.

## Scope

Detail-page hero for `/nieuws/[slug]` when `articleType === "interview"`. Reuses the locked Asymmetric Broadsheet shell + the same five slots locked on announcement / transfer / event. Variant-specific composition is a sibling `<SubjectsStrip>` BELOW the hero — same architectural pattern as `<TransferFactStrip>` and `<EventFactStrip>`, but with subject portraits + (for N=1) an inline pull-quote.

## Locked decisions

|                             | Choice                                                 | What it means                                                                                                                                                                            |
| --------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Q1 · Subject placement**  | Option 2 — coverImage in hero, subjects in strip below | `article.coverImage` stays in the hero right column (announcement-pattern). Subject portraits live in a sibling `<SubjectsStrip>` below.                                                 |
| **Q2 · N counts**           | adaptive layout per N                                  | N=1: polaroid + pull-quote inside strip. N=2: duo with italic display "&". N=3: three polaroids inline, no separator. N=4: 2×2 grid.                                                     |
| **Q2b · Mobile (N≥3)**      | compact subjects list                                  | When viewport ≤ 720px AND `subjects.length ≥ 3`, the `<SubjectsStrip>` swaps to a compact mono-caps list. Polaroids do NOT render on mobile for N≥3. N=1 / N=2 keep polaroids on mobile. |
| **Q3 · PlayerFigure reuse** | reuse polaroid shell, override caption                 | Same polaroid TapedCard as `/spelers/[slug]`. Caption overridden for interview context (display italic name + mono caps role/jersey).                                                    |
| **Q4 · Subject kinds**      | uniform polaroid treatment                             | All three kinds (player / staff / custom) render the same polaroid frame. Photo source switches per `kind`. Caption fields adapt per kind.                                               |

## Composition

```text
┌──────────────────────────────────────────────┬───────────────────────────┐
│  EditorialKicker (★ INTERVIEW · format · …)   │                           │
│  EditorialHeading (PT-aware, accent)          │   HeroCoverImage          │
│  EditorialLead                                │   (TapedCard rotation A   │
│  EditorialByline                              │    + 16:9 image)          │
└──────────────────────────────────────────────┴───────────────────────────┘
                                            ↓
                  <SubjectsStrip subjects={article.subjects} body={article.body} />
                  desktop layout per subjects.length:
                    N=1  →  [polaroid] + pull-quote (from body's first key/quote-tagged qaPair)
                    N=2  →  [polaroid] & [polaroid]
                    N=3  →  [polaroid] [polaroid] [polaroid]   (no separator)
                    N=4  →  2×2 grid
                  mobile (≤720px):
                    N=1 / N=2 same as desktop, stacked vertically
                    N≥3 swaps to compact mono-caps list (no polaroids)
                                            ↓
                                   article body in --container-prose
                                   (DropCapParagraph / paragraphs / qaBlock / etc.)
```

## SubjectsStrip — full state matrix

| State           | When                                         | Strip content                                                                                                                                                                                                          |
| --------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **N=1 desktop** | `subjects.length === 1` AND viewport > 720px | Single polaroid (200px wide) on the left + pull-quote on the right (italic Playfair, leading quote mark, mono caps attribution). Quote = first body `qaPair` with `tag in [key, quote]`. Hides quote when none exists. |
| **N=2 desktop** | `subjects.length === 2` AND viewport > 720px | Two polaroids side-by-side with italic display "&" between (jersey-deep, 64px).                                                                                                                                        |
| **N=3 desktop** | `subjects.length === 3` AND viewport > 720px | Three polaroids inline, no separator. Tape colours alternate (green / ochre / green). Rotations cycle the pool.                                                                                                        |
| **N=4 desktop** | `subjects.length === 4` AND viewport > 720px | 2×2 grid. Polaroids at the same scale as N=1/2/3.                                                                                                                                                                      |
| **N=1 mobile**  | `subjects.length === 1` AND viewport ≤ 720px | Polaroid (180px) stacked above the pull-quote, both centered.                                                                                                                                                          |
| **N=2 mobile**  | `subjects.length === 2` AND viewport ≤ 720px | Two polaroids stacked vertically with the italic display "&" between (44px on mobile).                                                                                                                                 |
| **N≥3 mobile**  | `subjects.length >= 3` AND viewport ≤ 720px  | **Compact mono-caps list** — paper card titled `★ Subjects`. Each row = display italic name + mono caps role + jersey/functionTitle/customRole. **No polaroids render.**                                               |

## Subject kind branches

`subject.kind` discriminates the data shape. The polaroid frame is uniform; data sources differ:

| `kind`   | Photo source         | Caption shape                                                                       |
| -------- | -------------------- | ----------------------------------------------------------------------------------- |
| `player` | `playerRef.psdImage` | `firstName` (display italic 900) + `position` + " · #" + `jerseyNumber` (mono caps) |
| `staff`  | `staffRef.photo`     | `firstName` (display italic 900) + `functionTitle` (mono caps)                      |
| `custom` | `customPhoto`        | `customName` (display italic 900) + `customRole` (mono caps)                        |

`customPhoto` is **required** when `kind === "custom"` per the existing `subject.ts` validator (no schema change needed).

## Pull-quote source (N=1 only)

When `subjects.length === 1`:

1. Walk `article.body[]` for the first `qaPair` with `tag in [key, quote]`.
2. Render quote text from `qaPair.answer` (Portable Text → flatten to plain string OR a small TitlePT-aware serializer).
3. Render attribution from the only subject's name + role (no `respondentKey` resolution needed at N=1).
4. Hide the quote slot entirely when no key/quote-tagged pair exists.

For N≥2, no in-strip quote — multi-subject quotes belong to the body's QaSection where `respondentKey` carries proper attribution.

## Component composition — reuse + new

**Existing primitives reused** (continued from announcement-locked / transfer-locked / event-locked):

| Primitive                        | Use                                                                          |
| -------------------------------- | ---------------------------------------------------------------------------- |
| `<TapedCard>`                    | Wraps cover image in HeroCoverImage AND each polaroid in the strip           |
| `<TapedFigure>`                  | Cover image at `aspect="landscape-16-9"`                                     |
| `<MonoLabel>` / `<MonoLabelRow>` | Kicker, role labels, compact-list rows                                       |
| `<EditorialHeading>`             | Hero headline (PT-aware post-Ask-9)                                          |
| `<DropCapParagraph>`             | First body paragraph                                                         |
| `<PullQuote>`                    | NOT used in the hero — multi-subject body quotes use it inside the QaSection |

**Shared sub-components** (locked with announcement, reused here):

`<EditorialHero>` · `<EditorialHeroShell>` · `<EditorialKicker>` · `<EditorialLead>` · `<EditorialByline>` — no fork. (Cover image composes inline as `<TapedCard rotation>` + `<TapedFigure aspect="landscape-16-9">` per Phase 3 PRD §8b; `<HeroCoverImage>` is superseded.)

**`<PlayerFigure>` extension** (Ask 4 follow-up):

`<PlayerFigure>` (locked Checkpoint A, sub-issue 3.A.1) gains:

- An optional `caption` prop (defaults to `★ KCVV ELEWIJT · SEIZOEN 25–26` for `/spelers/[slug]` use).
- Interview consumers pass a custom caption built from the subject data.
- The polaroid TapedCard shell, photo well, and rotation pool stay locked.

**New variant-specific component:**

| Component         | Path                                                    | Purpose                                                                                                                                                                                                                                                                                                                                            |
| ----------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<SubjectsStrip>` | `apps/web/src/components/article/blocks/SubjectsStrip/` | Renders the polaroid strip below the hero. Takes `subjects: Subject[]` + `body: PortableTextBlock[]` (for the N=1 quote lookup). Internally branches on `subjects.length` AND viewport. Storybook stories: `n1-with-quote`, `n1-without-quote`, `n2-duo`, `n3-trio`, `n4-panel`, `mobile-compact-list`, all subject-kind permutations — VR-tagged. |

The strip is an article body block (parallel to `<TransferFactStrip>` and `<EventFactStrip>`), not a design-system primitive — variant-specific.

## Field-source map

| UI element                         | Source                                                                                                                    | Notes                                                                                                          |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Kicker · "INTERVIEW"               | static label keyed off `articleType==='interview'`                                                                        | EditorialKicker constant                                                                                       |
| Kicker · format                    | `subjects.length` → "DUO" (2) / "TRIO" (3) / "PANEL" (4) — for N=1 use `tags[0]` if "AFSCHEID" or similar, otherwise drop | Mono caps muted                                                                                                |
| Kicker · reading time              | `computeReadingTime(article.body)`                                                                                        | Hides when undefined                                                                                           |
| Headline                           | `article.title` (PT, post-Ask-9)                                                                                          | Renders accent decorator as italic + jersey-deep                                                               |
| Lead                               | `article.lead` (post-Ask-1) → fallback `body[0]`                                                                          | Italic display                                                                                                 |
| Byline                             | `article.author ?? "Door redactie"`                                                                                       | Default stub                                                                                                   |
| Hero cover image                   | `article.coverImage` @ 16:9 (post-Ask-8 required)                                                                         | HeroCoverImage · plain                                                                                         |
| Strip · subject photo              | per `kind` (see "Subject kind branches" above)                                                                            | PlayerFigure polaroid · 3:4 aspect                                                                             |
| Strip · subject caption            | per `kind` (see "Subject kind branches" above)                                                                            | Display italic name + mono caps role line                                                                      |
| Strip · "&" separator (N=2)        | static italic display character                                                                                           | 64px Playfair italic · jersey-deep                                                                             |
| Strip · pull-quote (N=1)           | first `body[].qaPair` with `tag in [key, quote]`                                                                          | Italic Playfair display 700 · leading quote mark · mono caps attribution · hides when no key/quote-tagged pair |
| Strip · compact list (mobile, N≥3) | all `subjects[]` · same caption fields                                                                                    | Display italic name + mono caps role · paper-card with "★ Subjects" label · polaroids absent                   |
| Image alt (cover)                  | `serializeTitle(article.title)` (post-Ask-9 plain text)                                                                   | —                                                                                                              |
| Image alt (polaroid)               | subject name (firstName + lastName, customName, etc.)                                                                     | —                                                                                                              |

## API (target shape post-Ask-8 + Ask-9 migrations)

```typescript
type EditorialHeroInterviewProps = {
  variant: "interview";
  placement?: "detail" | "homepage"; // default "detail"
  article: {
    title: PortableTextBlock[];
    lead?: string;
    body: PortableTextBlock[];
    publishedAt: string;
    coverImage: { url: string; hotspot?: { x: number; y: number } };
    author?: string;
  };
  // 1–4 subjects. Resolved at the page-level Server Component before passing in.
  subjects: Array<
    | {
        _key: string;
        kind: "player";
        firstName: string;
        lastName: string;
        jerseyNumber?: number;
        position?: string;
        psdImageUrl: string;
        psdId: string;
      }
    | {
        _key: string;
        kind: "staff";
        firstName: string;
        lastName: string;
        functionTitle: string;
        photoUrl: string;
      }
    | {
        _key: string;
        kind: "custom";
        customName: string;
        customRole: string;
        customPhotoUrl: string;
      }
  >;
};
```

## Schema dependencies (BLOCKING)

Inherits the 5 from announcement-locked plus the existing `subjects` shape (already validated by `validateSubjectsCount`). No new schema migration for the interview variant beyond what's already enumerated:

1. `article.lead` field added (Ask 1).
2. `articleType=event` body validator (Ask 6).
3. `articleType=transfer` body validator (Ask 6).
4. `article.coverImage` becomes required (Ask 8).
5. `article.title` → constrained Portable Text + `accent` decorator (Ask 9).

The existing `subject.customPhoto` validator (`A photo is required for custom subjects …`) covers Q4. The existing `validateSubjectsCount` covers the 1–4 cardinality. No schema change needed for interview-locked.

## Implementation contract

- **N branching** is computed once per render from `subjects.length`. The branch chooses the strip layout class (`n1` / `n2` / `n3` / `n4`).
- **Mobile breakpoint** at `720px` matches the rest of the variants (consistent across announcement / transfer / event mobile collapses).
- **Compact list (mobile N≥3)** is a separate component (or a separate render path inside `<SubjectsStrip>`) — uses different markup, NOT the polaroid stack.
- **Pull-quote walk** at N=1: page-level Server Component pre-resolves the first key/quote-tagged qaPair from body and passes it as a prop. Avoids a body-walk inside the presentational component.
- **Image alt** for each polaroid uses the subject's name. Hero image alt uses `serializeTitle(article.title)`.
- **No CTAs** in the interview variant strip — multi-subject articles don't have a single conversion goal at hero level.

## Approval checklist

- [x] Asymmetric Broadsheet shell (locked direction A).
- [x] Detail placement — no click-through CTAs.
- [x] coverImage in right column · plain.
- [x] SubjectsStrip below hero (Q1 Option 2).
- [x] N=1: polaroid + pull-quote inside strip; quote source = body's first key/quote-tagged qaPair.
- [x] N=2: duo with italic display "&".
- [x] N=3: three polaroids inline, no separator (rare).
- [x] N=4: 2×2 grid (rare).
- [x] Mobile (N≥3): compact mono-caps subjects list, no polaroids.
- [x] N=1 and N=2 keep polaroids on mobile.
- [x] PlayerFigure shell reused; caption slot extended.
- [x] All three subject kinds (player / staff / custom) render uniform polaroid; photo + caption sources differ per kind.
- [x] customPhoto required by existing schema validator (no new schema change).
- [x] Component path: `apps/web/src/components/article/blocks/SubjectsStrip/`.
- [x] Existing 5 schema migrations (lead / fact validators / coverImage required / title PT) cover this variant — no additional schema work.

## Homepage placement (`placement="homepage"`)

Locked 2026-05-05 — see `option-a-homepage-placement-comparisons.html` (P3 picked from P1/P2/P3 drill).

When the EditorialHero renders as a featured-article teaser at the top of the homepage's news section, the shell + slots above stay **identical to the detail-page composition**. One extension: **whole-card click**.

- The entire hero is wrapped as a link to `/nieuws/{article.slug}`.
- **At rest**: identical to the detail-page hero — kicker, heading, lead, byline, right-column artefact unchanged. No CTA text, no extra band, no inline read-more affordance.
- **On hover**: card press-ups (`transform: translate(-2px, -2px)` + box-shadow grown by ~4px) — the natural inverse of the canonical press-down hover used on paper-stamped primitives. A small `★ Lees verder →` hint fades in at the bottom-right.
- **Body content does not render in homepage placement.** The SubjectsStrip, Q&A divider, and EndMark are all article-detail-only.
- **Touch-device note**: no hover means the press-up + hint never trigger. The whole card is clickable; native touch tap navigates. Acceptable starting point; revisit with a persistent foot-line hint if analytics show click-through underperforms.
- **`<EditorialHero>` discriminated union**: `placement?: "detail" | "homepage"` (default `"detail"`). `"homepage"` triggers the `<a>` wrap + press-up styling + body content suppression in the Server Component.
